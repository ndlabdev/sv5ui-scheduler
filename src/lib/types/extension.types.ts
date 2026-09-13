import type { ZonedDateTime } from '@internationalized/date'
import type { Component, Snippet } from 'svelte'
import type { Attachment } from 'svelte/attachments'
import type { SchedulerEvent } from './event.types.js'
import type { SchedulerLabels } from './labels.types.js'
import type { EventPatch, Mutation } from './mutation.types.js'
import type { BusinessHours, DateRange, Holiday, TimeZoneId, WeekDay } from './range.types.js'
import type { CellSnippetProps, EventSnippetProps, HeaderSnippetProps } from './snippet.types.js'

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
 * Settings shared by every view, layout and interaction of one scheduler
 * instance. Read-only from the receiver's side.
 */
export interface SchedulerContext {
    timeZone: TimeZoneId

    locale: string

    weekStartsOn: WeekDay

    /**
     * Force 12 or 24 hour clocks. `undefined` follows the locale.
     */
    hour12?: boolean

    businessHours?: BusinessHours

    holidays: Holiday[]

    labels: SchedulerLabels

    /**
     * Current instant, refreshed once a minute. Read this instead of
     * constructing your own so tests can freeze it.
     */
    now: ZonedDateTime
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

/**
 * Snippets an application may pass to override default rendering. Views
 * receive the same object and render whichever they support.
 */
export interface ViewSnippets<T = unknown> {
    event?: Snippet<[EventSnippetProps<T>]>

    cell?: Snippet<[CellSnippetProps]>

    header?: Snippet<[HeaderSnippetProps]>

    /**
     * Replaces the message a view shows when the range holds no events.
     */
    empty?: Snippet
}

/**
 * Everything a view component receives. A view is a plain component driven by
 * these props; it does not read scheduler context on its own, so it can be
 * rendered and tested on its own.
 */
export interface ViewProps<T = unknown> {
    /**
     * Name of the view being rendered, as registered.
     */
    view: string

    /**
     * Date the range was computed from, usually the day the user navigated to.
     */
    anchor: ZonedDateTime

    range: DateRange

    /**
     * Events overlapping `range`, already normalised and expanded.
     */
    events: SchedulerEvent<T>[]

    scheduler: SchedulerContext

    scale: TimeScale

    /**
     * Placements produced by the view's layout strategy.
     */
    positioned: PositionedEvent<T>[]

    snippets: ViewSnippets<T>

    /**
     * Keyboard focus to draw, or `null` when the grid is not focused.
     */
    focus: GridFocus | null

    /**
     * Attachments to spread on the view's interactive surfaces. `grid` goes on
     * the element that receives pointer and keyboard input; `event` returns
     * one for each rendered event segment.
     */
    interactions: {
        grid: Attachment<HTMLElement>
        event: (position: PositionedEvent<T>) => Attachment<HTMLElement>
    }

    /**
     * Gesture in progress, to render as a ghost. `null` when idle.
     */
    preview: ViewPreview<T> | null

    selectedEventId: string | null

    onSelectEvent: (eventId: string | null) => void
}

/**
 * Registers a named view. The built-in `month`, `week`, `day` and `agenda`
 * are defined the same way.
 */
export interface ViewDefinition<T = unknown> {
    /**
     * Value of the scheduler's `view` prop that activates this view, and the
     * key looked up in `labels`.
     */
    name: string

    /**
     * Range to display for an anchor date.
     */
    range: (anchor: ZonedDateTime, context: SchedulerContext) => DateRange

    /**
     * Anchor to move to when the user navigates one step.
     */
    step: (anchor: ZonedDateTime, direction: 1 | -1, context: SchedulerContext) => ZonedDateTime

    /**
     * Name of the `LayoutStrategy` to run before rendering.
     */
    layout: string

    /**
     * Days per row handed to the layout. The month view uses `7`.
     * @default every day of the range in one row
     */
    columnsPerRow?: number

    /**
     * Title the toolbar shows for the current range. Falls back to the
     * formatted range when omitted.
     */
    title?: (anchor: ZonedDateTime, range: DateRange, context: SchedulerContext) => string

    component: Component<ViewProps<T>>
}

/**
 * Wraps the store's `apply`. Receives the next link in the chain and returns
 * the function the store will call. Runs in registration order.
 */
export type StoreMiddleware<T = unknown> = (
    next: (patch: EventPatch<T>) => void
) => (patch: EventPatch<T>) => void

/**
 * Where keyboard focus sits inside a grid: a day column and, in the time
 * views, the minutes from midnight of the focused slot. `null` minutes means
 * a whole-day cell.
 */
export interface GridFocus {
    dayIndex: number

    minutes: number | null
}

/**
 * What a pointer or keyboard position resolves to.
 */
export interface HitTarget {
    date: ZonedDateTime

    dayIndex: number

    /**
     * The whole-day area was hit rather than a time slot.
     */
    allDay: boolean

    eventId: string | null
}

/**
 * Handle given to an interaction plugin. Everything an interaction needs to
 * read the grid and commit a change, without touching the store directly.
 */
export interface InteractionContext<T = unknown> {
    view: string

    range: DateRange

    /**
     * Start of each rendered day, in order. Index into it with
     * `HitTarget.dayIndex` and `GridFocus.dayIndex`.
     */
    days: ZonedDateTime[]

    scale: TimeScale

    scheduler: SchedulerContext

    selectedEventId: string | null

    select: (eventId: string | null) => void

    focus: GridFocus | null

    setFocus: (focus: GridFocus | null) => void

    /**
     * Navigate one period back or forward, as the toolbar arrows do.
     */
    step: (direction: 1 | -1) => void

    /**
     * Identifier for an event the interaction is about to create.
     */
    newEventId: () => string

    /**
     * Resolve client coordinates to a grid position, or `null` outside the grid.
     */
    hitTest: (clientX: number, clientY: number) => HitTarget | null

    /**
     * Round a date to the nearest slot boundary.
     */
    snap: (date: ZonedDateTime) => ZonedDateTime

    getEvent: (eventId: string) => SchedulerEvent<T> | undefined

    /**
     * Send a change through the mutation pipeline. Optimistic application,
     * queueing and rollback happen behind this call.
     */
    commit: (mutation: Omit<Mutation<T>, 'id'>) => void

    /**
     * Preview state read by views while a gesture is in progress. Set to
     * `null` when the gesture ends or is cancelled.
     */
    setPreview: (preview: InteractionPreview<T> | null) => void

    announce: (message: string) => void
}

/**
 * Temporary state of an in-progress gesture, rendered by views as a ghost
 * without mutating the store.
 */
export interface InteractionPreview<T = unknown> {
    kind: 'create' | 'move' | 'resize'

    event: SchedulerEvent<T>
}

/**
 * `InteractionPreview` with its placement already computed by the active
 * layout, so a view draws the ghost the same way it draws events.
 */
export interface ViewPreview<T = unknown> extends InteractionPreview<T> {
    positioned: PositionedEvent<T>[]
}

/**
 * Adds a pointer or keyboard behaviour to the grid. `attach` is called inside
 * the view component, so the returned attachment may use hooks that rely on
 * component lifecycle.
 */
export interface InteractionPlugin<T = unknown> {
    name: string

    /**
     * Attachment for the grid element. Receives the node when it mounts and
     * may return a cleanup.
     */
    attach: (context: InteractionContext<T>) => Attachment<HTMLElement>

    /**
     * Optional attachment for each rendered event segment.
     */
    attachEvent?: (
        context: InteractionContext<T>,
        position: PositionedEvent<T>
    ) => Attachment<HTMLElement>
}
