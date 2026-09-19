import type { EventInput, SchedulerEvent } from '../../types/event.types.js'
import type { EventPatch } from '../../types/mutation.types.js'
import type { DateRange, TimeZoneId } from '../../types/range.types.js'
import type { EventSource, EventSourceFn } from '../../types/source.types.js'
import { overlaps } from '../time/range.js'
import { cover, EMPTY_COVERAGE, uncovered, type Coverage } from './coverage.js'
import { normalizeEvents } from './normalize.js'

export type LoadResult<T = unknown> =
    { status: 'loaded'; events: SchedulerEvent<T>[] } | { status: 'superseded' }

export interface SourceLoader<T = unknown> {
    load(range: DateRange): Promise<LoadResult<T>>
    apply(patch: EventPatch<T>): void
    invalidate(): void
}

const SUPERSEDED: LoadResult<never> = { status: 'superseded' }

export function createSourceLoader<T>(
    source: EventSource<T>,
    timeZone: () => TimeZoneId
): SourceLoader<T> {
    return Array.isArray(source)
        ? createArrayLoader(source, timeZone)
        : createFunctionLoader(source, timeZone)
}

function createArrayLoader<T>(
    inputs: readonly EventInput<T>[],
    timeZone: () => TimeZoneId
): SourceLoader<T> {
    const zoned = createZonedCache<T>(timeZone)
    return {
        async load() {
            return { status: 'loaded', events: zoned.normalize(inputs) }
        },
        apply() {
            return
        },
        invalidate() {
            zoned.clear()
        }
    }
}

interface ZonedCache<T> {
    normalize(inputs: readonly EventInput<T>[]): SchedulerEvent<T>[]
    clear(): void
}

function createZonedCache<T>(timeZone: () => TimeZoneId): ZonedCache<T> {
    let zone: TimeZoneId | null = null
    let events: SchedulerEvent<T>[] | null = null
    return {
        normalize(inputs) {
            const current = timeZone()
            if (!events || zone !== current) {
                zone = current
                events = normalizeEvents(inputs, current)
            }
            return events
        },
        clear() {
            events = null
        }
    }
}

function createFunctionLoader<T>(
    fetch: EventSourceFn<T>,
    timeZone: () => TimeZoneId
): SourceLoader<T> {
    const inputs = new Map<string, EventInput<T>>()
    const zoned = createZonedCache<T>(timeZone)
    let coverage: Coverage = EMPTY_COVERAGE
    let inflight: {
        key: string
        controller: AbortController
        promise: Promise<LoadResult<T>>
    } | null = null

    function cached(range: DateRange): SchedulerEvent<T>[] {
        return zoned
            .normalize([...inputs.values()])
            .filter((event) => event.recurrence !== undefined || overlaps(event, range))
    }

    function remember(batch: readonly EventInput<T>[]): void {
        for (const input of batch) inputs.set(input.id, input)
        zoned.clear()
    }

    return {
        load(range) {
            const gaps = uncovered(coverage, range)
            if (gaps.length === 0)
                return Promise.resolve({ status: 'loaded', events: cached(range) })
            const key = rangeKey(range)
            if (inflight?.key === key) return inflight.promise

            inflight?.controller.abort()
            const controller = new AbortController()
            const requests = gaps.map(
                (gap) =>
                    new Promise<EventInput<T>[]>((resolve) =>
                        resolve(
                            fetch({ range: gap, timeZone: timeZone(), signal: controller.signal })
                        )
                    )
            )
            const promise = Promise.all(requests).then(
                (batches) => {
                    if (controller.signal.aborted) return SUPERSEDED
                    for (const [i, batch] of batches.entries()) {
                        remember(batch)
                        coverage = cover(coverage, gaps[i])
                    }
                    if (inflight?.controller === controller) inflight = null
                    return { status: 'loaded' as const, events: cached(range) }
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
        apply(patch) {
            if (patch.type === 'upsert') inputs.set(patch.event.id, patch.event)
            if (patch.type === 'remove') inputs.delete(patch.eventId)
            if (patch.type !== 'reset') zoned.clear()
        },
        invalidate() {
            inputs.clear()
            zoned.clear()
            coverage = EMPTY_COVERAGE
            inflight?.controller.abort()
            inflight = null
        }
    }
}

function rangeKey(range: DateRange): string {
    return `${range.start.toDate().getTime()}:${range.end.toDate().getTime()}`
}
