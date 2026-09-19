import type { SchedulerEvent } from '../../types/event.types.js'
import type { DateRange } from '../../types/range.types.js'
import { expandSeries, type ExpandOptions } from '../recurrence/expand.js'

export interface IndexedEvent<T = unknown> {
    readonly event: SchedulerEvent<T>
    readonly startMs: number
    readonly endMs: number
}

export interface EventIndex<T = unknown> {
    readonly byId: ReadonlyMap<string, SchedulerEvent<T>>
    readonly sorted: readonly IndexedEvent<T>[]
    readonly series: readonly SchedulerEvent<T>[]
    readonly maxDurationMs: number
}

const EMPTY: EventIndex<never> = { byId: new Map(), sorted: [], series: [], maxDurationMs: 0 }

const isSeries = (event: SchedulerEvent): boolean => event.recurrence !== undefined

export function emptyIndex<T>(): EventIndex<T> {
    return EMPTY
}

export function indexFrom<T>(events: Iterable<SchedulerEvent<T>>): EventIndex<T> {
    const byId = new Map<string, SchedulerEvent<T>>()
    for (const event of events) byId.set(event.id, event)
    const all = [...byId.values()]
    const sorted = all
        .filter((event) => !isSeries(event))
        .map(toIndexed)
        .sort(compareIndexed)
    return { byId, sorted, series: all.filter(isSeries), maxDurationMs: longestDuration(sorted) }
}

export function upsertIntoIndex<T>(index: EventIndex<T>, event: SchedulerEvent<T>): EventIndex<T> {
    const byId = new Map(index.byId)
    byId.set(event.id, event)
    const withoutSorted = index.byId.has(event.id)
        ? index.sorted.filter((item) => item.event.id !== event.id)
        : index.sorted
    const withoutSeries = index.series.filter((item) => item.id !== event.id)
    const sorted = isSeries(event) ? withoutSorted : insertSorted(withoutSorted, toIndexed(event))
    const series = isSeries(event) ? [...withoutSeries, event] : withoutSeries
    return { byId, sorted, series, maxDurationMs: longestDuration(sorted) }
}

export function removeFromIndex<T>(index: EventIndex<T>, eventId: string): EventIndex<T> {
    if (!index.byId.has(eventId)) return index
    const byId = new Map(index.byId)
    byId.delete(eventId)
    const sorted = index.sorted.filter((item) => item.event.id !== eventId)
    const series = index.series.filter((item) => item.id !== eventId)
    return { byId, sorted, series, maxDurationMs: longestDuration(sorted) }
}

export function queryIndex<T>(
    index: EventIndex<T>,
    range: DateRange,
    expansion: ExpandOptions
): SchedulerEvent<T>[] {
    const rangeStartMs = range.start.toDate().getTime()
    const rangeEndMs = range.end.toDate().getTime()
    const { sorted } = index
    const results: SchedulerEvent<T>[] = []
    for (let i = lowerBound(sorted, rangeStartMs - index.maxDurationMs); i < sorted.length; i++) {
        const item = sorted[i]
        if (item.startMs >= rangeEndMs) break
        if (item.endMs > rangeStartMs) results.push(item.event)
    }
    for (const series of index.series) results.push(...expandSeries(series, range, expansion))
    return results.sort(compareEvents)
}

function compareEvents(a: SchedulerEvent, b: SchedulerEvent): number {
    return a.start.compare(b.start) || a.id.localeCompare(b.id)
}

function toIndexed<T>(event: SchedulerEvent<T>): IndexedEvent<T> {
    return {
        event,
        startMs: event.start.toDate().getTime(),
        endMs: event.end.toDate().getTime()
    }
}

function compareIndexed(a: IndexedEvent, b: IndexedEvent): number {
    return a.startMs - b.startMs || a.event.id.localeCompare(b.event.id)
}

function duration(item: IndexedEvent): number {
    return item.endMs - item.startMs
}

function longestDuration(sorted: readonly IndexedEvent[]): number {
    let longest = 0
    for (const item of sorted) longest = Math.max(longest, duration(item))
    return longest
}

function insertSorted<T>(
    sorted: readonly IndexedEvent<T>[],
    entry: IndexedEvent<T>
): IndexedEvent<T>[] {
    let low = 0
    let high = sorted.length
    while (low < high) {
        const mid = (low + high) >>> 1
        if (compareIndexed(sorted[mid], entry) < 0) low = mid + 1
        else high = mid
    }
    return [...sorted.slice(0, low), entry, ...sorted.slice(low)]
}

function lowerBound(sorted: readonly IndexedEvent[], startMs: number): number {
    let low = 0
    let high = sorted.length
    while (low < high) {
        const mid = (low + high) >>> 1
        if (sorted[mid].startMs < startMs) low = mid + 1
        else high = mid
    }
    return low
}
