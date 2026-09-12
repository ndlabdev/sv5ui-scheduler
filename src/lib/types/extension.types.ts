import type { ZonedDateTime } from '@internationalized/date'
import type { Component, Snippet } from 'svelte'
import type { Attachment } from 'svelte/attachments'
import type { SchedulerEvent } from './event.types.js'
import type { SchedulerLabels } from './labels.types.js'
import type { EventPatch, Mutation } from './mutation.types.js'
import type { BusinessHours, DateRange, Holiday, TimeZoneId, WeekDay } from './range.types.js'
import type { CellSnippetProps, EventSnippetProps, HeaderSnippetProps } from './snippet.types.js'

/**
 * Maps instants to pixels along a time axis and back. One instance per
 * rendered range; views, layouts and interactions share it so a pixel means
 * the same minute everywhere.
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
     * Pixel offset of `date` from the start of its day column. Uses real
     * zoned differences, so a 23 or 25 hour day maps without drift.
     */
    toPixel(date: ZonedDateTime, dayStart: ZonedDateTime): number

    /**
     * Inverse of `toPixel`, rounded to the nearest slot.
     */
    toDate(pixel: number, dayStart: ZonedDateTime): ZonedDateTime

    /**
     * Total height of a day column that starts at `dayStart`.
     */
    dayHeight(dayStart: ZonedDateTime): number
}

/**
 * Settings shared by every view, layout and interaction of one scheduler
 * instance. Read-only from the receiver's side.
 */
export interface SchedulerContext {
    timeZone: TimeZoneId

    locale: string

    weekStartsOn: WeekDay

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
}

/**
 * Everything a view component receives. A view is a plain component driven by
 * these props; it does not read scheduler context on its own, so it can be
 * rendered and tested on its own.
 */
export interface ViewProps<T = unknown> {
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
     * Attachments to spread on the view's interactive surfaces. `grid` goes on
     * the element that receives pointer and keyboard input; `event` returns
     * one for each rendered event segment.
     */
    interactions: {
        grid: Attachment<HTMLElement>
        event: (position: PositionedEvent<T>) => Attachment<HTMLElement>
    }

    selectedEventId: string | null

    onSelectEvent: (eventId: string | null) => void
}

/**
 * Registers a named view. The built-in `month`, `week`, `day` and `agenda`
 * are defined the same way.
 */
export interface ViewDefinition {
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

    component: Component<ViewProps>
}

/**
 * Wraps the store's `apply`. Receives the next link in the chain and returns
 * the function the store will call. Runs in registration order.
 */
export type StoreMiddleware = (next: (patch: StorePatch) => void) => (patch: StorePatch) => void

/**
 * Alias kept separate from `EventPatch` so middleware signatures stay stable
 * if the patch shape widens.
 */
export type StorePatch = EventPatch

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

    scale: TimeScale

    scheduler: SchedulerContext

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
 * Adds a pointer or keyboard behaviour to the grid. `attach` is called inside
 * the view component, so the returned attachment may use hooks that rely on
 * component lifecycle.
 */
export interface InteractionPlugin {
    name: string

    /**
     * Attachment for the grid element. Receives the node when it mounts and
     * may return a cleanup.
     */
    attach: (context: InteractionContext) => Attachment<HTMLElement>

    /**
     * Optional attachment for each rendered event segment.
     */
    attachEvent?: (
        context: InteractionContext,
        position: PositionedEvent
    ) => Attachment<HTMLElement>
}
