import type { ZonedDateTime } from '@internationalized/date'
import type { SchedulerContext } from './context.types.js'
import type { SchedulerEvent } from './event.types.js'
import type { DateRange } from './range.types.js'

/**
 * Maps wall-clock time to pixels along a day column and back. One instance
 * per rendered range; views, layouts and interactions share it so a pixel
 * means the same clock time in every column.
 *
 * The axis is wall clock, not elapsed time: 09:00 sits at the same pixel on
 * every day, including the days a time zone skips or repeats an hour. On such
 * a day an event crossing the change is drawn by its clock times, which is
 * what calendars users already know do.
 */
export interface TimeScale {
    /**
     * Minutes per grid slot. Snapping rounds to multiples of this.
     */
    readonly slotMinutes: number

    /**
     * Height of one slot in pixels.
     */
    readonly slotHeight: number

    /**
     * Height of every day column: 24 hours of slots.
     */
    readonly dayHeight: number

    /**
     * Pixel offset of `date` inside its day column, from its clock time.
     */
    toPixel(date: ZonedDateTime): number

    /**
     * Clock time at `pixel` on the day of `dayStart`, rounded to the nearest
     * slot. A skipped time resolves forward; a repeated time resolves to its
     * first occurrence.
     */
    toDate(pixel: number, dayStart: ZonedDateTime): ZonedDateTime
}

/**
 * Placement of one event segment in the time grid, in one day column.
 * `top` and `height` are pixels from `TimeScale`; `left` and `width` are
 * fractions of the column width so columns can resize without relayout.
 */
export interface TimePosition<T = unknown> {
    kind: 'time'

    event: SchedulerEvent<T>

    /**
     * Index of the day column inside the rendered range.
     */
    dayIndex: number

    /**
     * Start of this segment, clipped to the day. Equals `event.start` unless
     * the event began on an earlier day.
     */
    segmentStart: ZonedDateTime

    /**
     * Exclusive end of this segment, clipped to the day.
     */
    segmentEnd: ZonedDateTime

    top: number

    height: number

    left: number

    width: number

    /**
     * Column assigned by the overlap solver, `0` first.
     */
    column: number

    /**
     * Number of columns in this segment's overlap cluster.
     */
    columns: number
}

/**
 * Placement of one event segment across whole-day cells: a row of the month
 * grid or the all-day row of the time grid. Columns are day indexes inside
 * the row; `lane` is the vertical slot within the row.
 */
export interface SpanPosition<T = unknown> {
    kind: 'span'

    event: SchedulerEvent<T>

    row: number

    lane: number

    startColumn: number

    /**
     * Exclusive.
     */
    endColumn: number

    /**
     * The event started before this row.
     */
    continuesBefore: boolean

    /**
     * The event ends after this row.
     */
    continuesAfter: boolean
}

/**
 * Output of a `LayoutStrategy`: every visible segment with its placement.
 */
export type PositionedEvent<T = unknown> = TimePosition<T> | SpanPosition<T>

/**
 * What a `LayoutStrategy` receives besides the events.
 */
export interface LayoutContext {
    scale: TimeScale

    /**
     * Start of each rendered day column, in order.
     */
    days: ZonedDateTime[]

    /**
     * How many of `days` form one row. The month grid uses `7`; the time grid
     * puts all of its days in one row.
     */
    columnsPerRow: number

    /**
     * Maximum lanes a whole-day row shows before collapsing into "+N more".
     * `Infinity` disables collapsing.
     */
    maxLanes: number

    scheduler: SchedulerContext
}

/**
 * Turns events for a range into placements. Implementations must be pure:
 * same inputs, same output, no DOM access.
 */
export interface LayoutStrategy {
    name: string

    layout<T>(
        events: SchedulerEvent<T>[],
        range: DateRange,
        context: LayoutContext
    ): PositionedEvent<T>[]
}
