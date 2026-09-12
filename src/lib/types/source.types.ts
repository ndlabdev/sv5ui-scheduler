import type { EventInput } from './event.types.js'
import type { DateRange, TimeZoneId } from './range.types.js'

/**
 * What an `EventSourceFn` receives for each load.
 */
export interface LoadContext {
    /**
     * Range the scheduler is about to display. Return every event that
     * overlaps it; events entirely outside are discarded.
     */
    range: DateRange

    timeZone: TimeZoneId

    /**
     * Aborted when the range changes before this load settles. Pass it to
     * `fetch` so stale requests are cancelled.
     */
    signal: AbortSignal
}

/**
 * Loads events for a range on demand. Called once per visible range; results
 * are cached by range so navigating back does not refetch.
 */
export type EventSourceFn<T = unknown> = (
    context: LoadContext
) => EventInput<T>[] | Promise<EventInput<T>[]>

/**
 * Where events come from: a static array, or a function that loads them for
 * the visible range.
 */
export type EventSource<T = unknown> = EventInput<T>[] | EventSourceFn<T>
