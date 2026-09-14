import { toCalendarDate, type ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { DateRange, WeekDay } from '../../types/range.types.js'
import type { RecurrenceRule } from '../../types/recurrence.types.js'
import { warnOnce } from '../utils/dev.js'
import { overlaps } from '../time/range.js'
import { startOfWeek, weekDayOf } from '../time/week.js'
import { isAfter, isBefore } from '../time/zone.js'

export interface ExpandOptions {
    readonly weekStartsOn: WeekDay
    readonly limit?: number
}

const DEFAULT_LIMIT = 1000
const DAYS_PER_WEEK = 7

const UNSUPPORTED: readonly (keyof RecurrenceRule)[] = [
    'rDates',
    'bySetPos',
    'byMonthDay',
    'byMonth',
    'byWeekNo',
    'byYearDay'
]

export function unsupportedFields(rule: RecurrenceRule): string[] {
    const fields = UNSUPPORTED.filter((field) => rule[field] !== undefined).map(String)
    if (rule.byDay?.some((day) => typeof day !== 'number')) fields.push('byDay ordinals')
    return fields
}

export function expandSeries<T>(
    series: SchedulerEvent<T>,
    range: DateRange,
    options: ExpandOptions
): SchedulerEvent<T>[] {
    const rule = series.recurrence
    if (!rule) return overlaps(series, range) ? [series] : []
    warnUnsupported(series.id, rule)

    const duration = wallDuration(series.start, series.end)
    const excluded = new Set((rule.exDates ?? []).map(instant))
    const horizon = range.start.subtract({ days: duration.days + 1 })
    const skip = rule.count === undefined ? stepsBefore(series.start, horizon, rule, options) : 0
    const occurrences: SchedulerEvent<T>[] = []

    for (const start of boundedStarts(series.start, rule, options, skip)) {
        if (!isBefore(start, range.end)) break
        if (excluded.has(instant(start))) continue
        const end = shift(start, duration)
        if (isAfter(end, range.start)) occurrences.push(occurrence(series, start, end))
    }
    return occurrences
}

function* boundedStarts(
    origin: ZonedDateTime,
    rule: RecurrenceRule,
    options: ExpandOptions,
    skip: number
): Generator<ZonedDateTime> {
    const limit = Math.min(options.limit ?? DEFAULT_LIMIT, rule.count ?? Infinity)
    let produced = 0
    for (const start of starts(origin, rule, options, skip)) {
        if (produced >= limit) return
        if (rule.until && isAfter(start, rule.until)) return
        produced += 1
        yield start
    }
}

function stepsBefore(
    origin: ZonedDateTime,
    horizon: ZonedDateTime,
    rule: RecurrenceRule,
    options: ExpandOptions
): number {
    const interval = intervalOf(rule)
    const whole = (units: number) => Math.max(Math.floor((units - 1) / interval), 0) * interval
    switch (rule.freq) {
        case 'daily':
            return whole(daysBetween(origin, horizon))
        case 'weekly':
            return whole(
                Math.floor(
                    daysBetween(
                        startOfWeek(origin, rule.weekStart ?? options.weekStartsOn),
                        horizon
                    ) / DAYS_PER_WEEK
                )
            )
        case 'monthly':
            return whole((horizon.year - origin.year) * 12 + horizon.month - origin.month)
        case 'yearly':
            return whole(horizon.year - origin.year)
    }
}

function* starts(
    origin: ZonedDateTime,
    rule: RecurrenceRule,
    options: ExpandOptions,
    skip: number
): Generator<ZonedDateTime> {
    const interval = intervalOf(rule)
    switch (rule.freq) {
        case 'daily':
            yield* daily(origin, interval, skip)
            return
        case 'weekly':
            yield* weekly(origin, rule, options, skip)
            return
        case 'monthly':
            yield* monthly(origin, interval, skip)
            return
        case 'yearly':
            yield* yearly(origin, interval, skip)
            return
    }
}

function* daily(origin: ZonedDateTime, interval: number, skip: number): Generator<ZonedDateTime> {
    for (let days = skip; ; days += interval) yield origin.add({ days })
}

function* weekly(
    origin: ZonedDateTime,
    rule: RecurrenceRule,
    options: ExpandOptions,
    skip: number
): Generator<ZonedDateTime> {
    const interval = intervalOf(rule)
    const days = plainWeekDays(rule.byDay) ?? [weekDayOf(origin)]
    const weekStartsOn = rule.weekStart ?? options.weekStartsOn
    const time = { hour: origin.hour, minute: origin.minute, second: origin.second }
    const firstWeek = startOfWeek(origin, weekStartsOn)
    for (let weeks = skip; ; weeks += interval) {
        const week = firstWeek.add({ weeks })
        for (const day of days) {
            const offset = (day - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK
            const candidate = week.add({ days: offset }).set(time)
            if (!isBefore(candidate, origin)) yield candidate
        }
    }
}

function* monthly(origin: ZonedDateTime, interval: number, skip: number): Generator<ZonedDateTime> {
    const day = origin.day
    for (let months = skip; ; months += interval) {
        const candidate = origin.add({ months }).set({ day })
        if (candidate.day === day) yield candidate
    }
}

function* yearly(origin: ZonedDateTime, interval: number, skip: number): Generator<ZonedDateTime> {
    const { month, day } = origin
    for (let years = skip; ; years += interval) {
        const candidate = origin.add({ years }).set({ month, day })
        if (candidate.month === month && candidate.day === day) yield candidate
    }
}

function intervalOf(rule: RecurrenceRule): number {
    return Math.max(Math.floor(rule.interval ?? 1), 1)
}

function daysBetween(from: ZonedDateTime, to: ZonedDateTime): number {
    return toCalendarDate(to).compare(toCalendarDate(from))
}

function plainWeekDays(byDay: RecurrenceRule['byDay']): WeekDay[] | null {
    if (!byDay || byDay.length === 0) return null
    const days = byDay.filter((day): day is WeekDay => typeof day === 'number')
    return days.length > 0 ? [...new Set(days)].sort((a, b) => a - b) : null
}

function wallDuration(start: ZonedDateTime, end: ZonedDateTime) {
    return {
        days: toCalendarDate(end).compare(toCalendarDate(start)),
        minutes: end.hour * 60 + end.minute - (start.hour * 60 + start.minute)
    }
}

function shift(date: ZonedDateTime, duration: { days: number; minutes: number }): ZonedDateTime {
    return date.add({ days: duration.days }).add({ minutes: duration.minutes })
}

function instant(date: ZonedDateTime): number {
    return date.toDate().getTime()
}

function occurrence<T>(
    series: SchedulerEvent<T>,
    start: ZonedDateTime,
    end: ZonedDateTime
): SchedulerEvent<T> {
    const rest = { ...series }
    delete rest.recurrence
    return {
        ...rest,
        id: `${series.id}@${start.toDate().toISOString()}`,
        seriesId: series.id,
        start,
        end,
        editable: false
    }
}

function warnUnsupported(id: string, rule: RecurrenceRule): void {
    const fields = unsupportedFields(rule)
    if (fields.length === 0) return
    warnOnce(
        `recurrence:${id}`,
        `Event "${id}" uses recurrence fields the built-in engine does not evaluate: ${fields.join(', ')}.`
    )
}
