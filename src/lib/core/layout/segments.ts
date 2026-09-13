import type { ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { DateRange } from '../../types/range.types.js'
import { intersect, splitByDay, type DaySegment } from '../time/range.js'

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
    const days = new Set<string>()
    for (const event of events) {
        const visible = intersect({ start: event.start, end: event.end }, range)
        if (!visible) continue
        for (const segment of splitByDay(visible))
            days.add(segment.dayStart.toString().slice(0, 10))
    }
    return days
}
