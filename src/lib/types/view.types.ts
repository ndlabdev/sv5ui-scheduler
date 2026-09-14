import type { ZonedDateTime } from '@internationalized/date'
import type { Component, Snippet } from 'svelte'
import type { Attachment } from 'svelte/attachments'
import type { SchedulerContext } from './context.types.js'
import type { SchedulerEvent } from './event.types.js'
import type { GridFocus, InteractionPreview } from './interaction.types.js'
import type { PositionedEvent, TimeScale } from './layout.types.js'
import type { DateRange } from './range.types.js'
import type {
    CellSnippetProps,
    EventDetailSnippetProps,
    EventSnippetProps,
    HeaderSnippetProps
} from './snippet.types.js'

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

    /**
     * Extra content under the default details in an event's popover.
     */
    detail?: Snippet<[EventDetailSnippetProps<T>]>
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

    /**
     * Show an event's details in a popover when it is clicked.
     */
    detailPopover: boolean

    /**
     * Delete an event through the mutation pipeline.
     */
    onDeleteEvent: (eventId: string) => void

    /**
     * Move the scheduler to `date`, switching to `view` when given.
     */
    navigate: (date: ZonedDateTime, view?: string) => void
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
     * Text for the view switcher and the grid's accessible name. The built-in
     * views take theirs from `labels`.
     * @default the view's `name`
     */
    label?: string

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
 * `InteractionPreview` with its placement already computed by the active
 * layout, so a view draws the ghost the same way it draws events.
 */
export interface ViewPreview<T = unknown> extends InteractionPreview<T> {
    positioned: PositionedEvent<T>[]
}
