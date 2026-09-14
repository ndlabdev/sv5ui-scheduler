import { parseZonedDateTime, type ZonedDateTime } from '@internationalized/date'
import type { DateRange } from '../../types/range.types.js'

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(locale: string, options: Intl.DateTimeFormatOptions, timeZone: string) {
    const key = `${locale}|${timeZone}|${JSON.stringify(options)}`
    let cached = formatters.get(key)
    if (!cached) {
        cached = new Intl.DateTimeFormat(locale, { ...options, timeZone })
        formatters.set(key, cached)
    }
    return cached
}

function format(date: ZonedDateTime, locale: string, options: Intl.DateTimeFormatOptions): string {
    return formatter(locale, options, date.timeZone).format(date.toDate())
}

export function formatTime(date: ZonedDateTime, locale: string, hour12?: boolean): string {
    return format(date, locale, { hour: 'numeric', minute: '2-digit', hour12 })
}

export function formatTimeRange(
    start: ZonedDateTime,
    end: ZonedDateTime,
    locale: string,
    hour12?: boolean
): string {
    return formatter(
        locale,
        { hour: 'numeric', minute: '2-digit', hour12 },
        start.timeZone
    ).formatRange(start.toDate(), end.toDate())
}

export function formatWeekday(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'short' })
}

export function formatWeekdayLong(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'long' })
}

export function formatDayNumber(date: ZonedDateTime, locale: string): string {
    const parts = formatter(locale, { day: 'numeric' }, date.timeZone).formatToParts(date.toDate())
    return (
        parts.find((part) => part.type === 'day')?.value ?? format(date, locale, { day: 'numeric' })
    )
}

export function formatLongDate(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatDate(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatMonthYear(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { month: 'long', year: 'numeric' })
}

export function formatDayRange(range: DateRange, locale: string): string {
    const last = range.end.subtract({ days: 1 })
    return formatter(
        locale,
        { month: 'short', day: 'numeric', year: 'numeric' },
        range.start.timeZone
    ).formatRange(range.start.toDate(), last.toDate())
}

export interface HourParts {
    readonly hour: string
    readonly rest: string
}

export function formatHourParts(date: ZonedDateTime, locale: string, hour12?: boolean): HourParts {
    const options: Intl.DateTimeFormatOptions =
        hour12 === false
            ? { hour: '2-digit', minute: '2-digit', hour12 }
            : { hour: 'numeric', minute: '2-digit', hour12 }
    const parts = formatter(locale, options, date.timeZone).formatToParts(date.toDate())
    const split = parts.findIndex((part) => part.type === 'hour') + 1
    const join = (list: Intl.DateTimeFormatPart[]) => list.map((part) => part.value).join('')
    return { hour: join(parts.slice(0, split)), rest: join(parts.slice(split)) }
}

export function formatAgendaDay(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

export function formatPopoverDay(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'long', month: 'short', day: 'numeric' })
}

export function formatMonthName(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { month: 'long' })
}

export function formatWeekdayNarrow(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'narrow' })
}

const SAMPLE_WEEK = Array.from({ length: 7 }, (_, index) =>
    parseZonedDateTime('2026-01-05T12:00[UTC]').add({ days: index })
)

export function compactWeekdayFormat(locale: string): 'narrow' | 'short' {
    const narrow = SAMPLE_WEEK.map((day) => formatWeekdayNarrow(day, locale))
    return new Set(narrow).size === narrow.length ? 'narrow' : 'short'
}

export function formatYear(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { year: 'numeric' })
}
