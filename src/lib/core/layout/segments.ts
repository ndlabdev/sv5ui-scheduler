import type { ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from '../../types/event.types.js'
import { isoDate } from '../time/day-flags.js'
import type { DateRange } from '../../types/range.types.js'
import { eachDay, intersect, splitByDay, type DaySegment } from '../time/range.js'
import { endOfDay } from '../time/zone.js'

const DAY_MS = 86400000

export interface EventSegment<T = unknown> extends DaySegment {
    readonly event: SchedulerEvent<T>
    readonly dayIndex: number
}

export function isWholeDay(event: SchedulerEvent): boolean {
    return event.allDay === true || durationMs(event) >= DAY_MS
}

function durationMs(event: SchedulerEvent): number {
    return event.end.toDate().getTime() - event.start.toDate().getTime()
}

function dayIndexer(days: readonly ZonedDateTime[]): (dayStart: ZonedDateTime) => number {
    const indexes = new Map(days.map((day, index) => [day.toDate().getTime(), index]))
    return (dayStart) => indexes.get(dayStart.toDate().getTime()) ?? -1
}

export function segmentsInRange<T>(
    events: readonly SchedulerEvent<T>[],
    range: DateRange,
    days: readonly ZonedDateTime[]
): EventSegment<T>[] {
    const indexOf = dayIndexer(days)
    const segments: EventSegment<T>[] = []
    for (const event of events) {
        const visible = intersect({ start: event.start, end: event.end }, range)
        if (!visible) continue
        for (const segment of splitByDay(visible)) {
            const dayIndex = indexOf(segment.dayStart)
            if (dayIndex === -1) continue
            segments.push({
                ...segment,
                event,
                dayIndex,
                continuesBefore: segment.continuesBefore || event.start.compare(visible.start) < 0,
                continuesAfter: segment.continuesAfter || event.end.compare(visible.end) > 0
            })
        }
    }
    return segments
}

export function daysWithEvents(
    events: readonly SchedulerEvent[],
    range: DateRange
): ReadonlySet<string> {
    const grid = dayGrid(range)
    const days = new Set<string>()
    for (const event of events) {
        if (sharesZone(event, range)) markDays(days, grid, event)
        else markDaysBySegment(days, event, range)
    }
    return days
}

interface DayGrid {
    readonly keys: readonly string[]
    readonly bounds: readonly number[]
    readonly startMs: number
    readonly endMs: number
}

function dayGrid(range: DateRange): DayGrid {
    const starts = eachDay(range)
    const last = starts[starts.length - 1]
    return {
        keys: starts.map(isoDate),
        bounds: [...starts, endOfDay(last)].map(toMs),
        startMs: toMs(range.start),
        endMs: toMs(range.end)
    }
}

function sharesZone(event: SchedulerEvent, range: DateRange): boolean {
    const zone = range.start.timeZone
    return event.start.timeZone === zone && event.end.timeZone === zone
}

function markDays(days: Set<string>, grid: DayGrid, event: SchedulerEvent): void {
    const start = Math.max(toMs(event.start), grid.startMs)
    const end = Math.min(toMs(event.end), grid.endMs)
    if (start >= end) return
    for (let i = dayAt(grid.bounds, start); i < grid.keys.length && grid.bounds[i] < end; i++) {
        days.add(grid.keys[i])
    }
}

function dayAt(bounds: readonly number[], ms: number): number {
    let low = 0
    let high = bounds.length - 2
    while (low < high) {
        const middle = (low + high + 1) >> 1
        if (bounds[middle] <= ms) low = middle
        else high = middle - 1
    }
    return low
}

function markDaysBySegment(days: Set<string>, event: SchedulerEvent, range: DateRange): void {
    const visible = intersect({ start: event.start, end: event.end }, range)
    if (!visible) return
    for (const segment of splitByDay(visible)) days.add(isoDate(segment.dayStart))
}

function toMs(date: ZonedDateTime): number {
    return date.toDate().getTime()
}
