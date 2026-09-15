import type { ZonedDateTime } from '@internationalized/date'
import type { Attachment } from 'svelte/attachments'
import type { SchedulerContext } from './context.types.js'
import type { EventInput, SchedulerEvent } from './event.types.js'
import type { PositionedEvent, TimeScale } from './layout.types.js'
import type { Mutation } from './mutation.types.js'
import type { DateRange } from './range.types.js'

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

    /**
     * The whole-day cell stands for a calendar day, as in the month grid, so
     * a timed event dropped on it keeps its clock time and only changes day.
     * `false` for the all-day row of the time grid, which turns it all-day.
     */
    keepsTime: boolean

    eventId: string | null
}

/**
 * An empty slot or day the user picked, as handed to `onSelectSlot`. Times
 * are snapped to the grid; `end` is exclusive.
 */
export interface SlotSelection {
    start: ZonedDateTime

    end: ZonedDateTime

    /**
     * A whole day was picked rather than a time slot.
     */
    allDay: boolean
}

/**
 * Handle given to an interaction plugin. Everything an interaction needs to
 * read the grid and commit a change, without touching the store directly.
 */
export interface InteractionContext<T = unknown> {
    view: string

    /**
     * Display name of the active view, as the view switcher shows it.
     */
    viewLabel: string

    range: DateRange

    /**
     * Start of each rendered day, in order. Index into it with
     * `HitTarget.dayIndex` and `GridFocus.dayIndex`.
     */
    days: ZonedDateTime[]

    /**
     * How many of `days` form one row, as the active view declared it.
     */
    columnsPerRow: number

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
     * Move the scheduler to `date`, switching to `view` when given.
     */
    navigate: (date: ZonedDateTime, view?: string) => void

    /**
     * Report an empty slot or day the user picked to the application's
     * `onSelectSlot`. The slot is widened to one grid slot or one day.
     */
    selectSlot: (point: Pick<HitTarget, 'date' | 'allDay'>) => void

    /**
     * Report a range the user selected by dragging over empty slots. Reaches
     * `onSelectSlot` and opens `createPanel` when the scheduler has one.
     */
    selectRange: (selection: SlotSelection) => void

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
 * What an element outside the scheduler carries when it is dragged onto a
 * grid with `dragSource`. Dropping it creates an event at the pointer; the
 * scheduler fills in `start`, `end` and, when omitted, `id`.
 */
export type DragSourceData<T = unknown> = Omit<
    EventInput<T>,
    'id' | 'start' | 'end' | 'recurrence'
> & {
    /**
     * Identity of the created event.
     * @default generated
     */
    id?: string

    /**
     * Length of the event when dropped on a time slot. Ignored when dropped
     * on a whole-day cell.
     * @default two grid slots
     */
    durationMinutes?: number
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
