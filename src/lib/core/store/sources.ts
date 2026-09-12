import type { EventInput, SchedulerEvent } from '../../types/event.types.js'
import type { DateRange, TimeZoneId } from '../../types/range.types.js'
import type { EventSource, EventSourceFn } from '../../types/source.types.js'
import { normalizeEvents } from './normalize.js'

export type LoadResult<T = unknown> =
    { status: 'loaded'; events: SchedulerEvent<T>[] } | { status: 'superseded' }

export interface SourceLoader<T = unknown> {
    load(range: DateRange): Promise<LoadResult<T>>
    invalidate(): void
}

const SUPERSEDED: LoadResult<never> = { status: 'superseded' }

export function createSourceLoader<T>(
    source: EventSource<T>,
    timeZone: TimeZoneId
): SourceLoader<T> {
    return Array.isArray(source)
        ? createArrayLoader(source, timeZone)
        : createFunctionLoader(source, timeZone)
}

function createArrayLoader<T>(
    inputs: readonly EventInput<T>[],
    timeZone: TimeZoneId
): SourceLoader<T> {
    let events: SchedulerEvent<T>[] | null = null
    return {
        async load() {
            events ??= normalizeEvents(inputs, timeZone)
            return { status: 'loaded', events }
        },
        invalidate() {
            events = null
        }
    }
}

function createFunctionLoader<T>(fetch: EventSourceFn<T>, timeZone: TimeZoneId): SourceLoader<T> {
    const cache = new Map<string, SchedulerEvent<T>[]>()
    let inflight: {
        key: string
        controller: AbortController
        promise: Promise<LoadResult<T>>
    } | null = null

    return {
        load(range) {
            const key = rangeKey(range)
            const cached = cache.get(key)
            if (cached) return Promise.resolve({ status: 'loaded', events: cached })
            if (inflight?.key === key) return inflight.promise

            inflight?.controller.abort()
            const controller = new AbortController()
            const promise = new Promise<EventInput<T>[]>((resolve) =>
                resolve(fetch({ range, timeZone, signal: controller.signal }))
            ).then(
                (inputs) => {
                    if (controller.signal.aborted) return SUPERSEDED
                    const events = normalizeEvents(inputs, timeZone)
                    cache.set(key, events)
                    if (inflight?.controller === controller) inflight = null
                    return { status: 'loaded' as const, events }
                },
                (error) => {
                    if (inflight?.controller === controller) inflight = null
                    if (controller.signal.aborted) return SUPERSEDED
                    throw error
                }
            )
            inflight = { key, controller, promise }
            return promise
        },
        invalidate() {
            cache.clear()
            inflight?.controller.abort()
            inflight = null
        }
    }
}

function rangeKey(range: DateRange): string {
    return `${range.start.toDate().getTime()}:${range.end.toDate().getTime()}`
}
