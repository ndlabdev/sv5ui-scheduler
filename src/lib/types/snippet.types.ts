import type { ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from './event.types.js'
import type { PositionedEvent } from './layout.types.js'
import type { SchedulerContext } from './context.types.js'
import type { DateRange, Holiday } from './range.types.js'

/**
 * Argument of the `event` snippet, rendered once per visible event segment.
 */
export interface EventSnippetProps<T = unknown> {
    event: SchedulerEvent<T>

    /**
     * Where and how large the segment is. `undefined` in the agenda view,
     * which is a list rather than a grid.
     */
    position?: PositionedEvent<T>

    view: string

    isDragging: boolean

    isResizing: boolean

    isSelected: boolean
}

/**
 * Argument of the `cell` snippet, rendered once per day cell in the month
 * view and once per day column background in the time grid.
 */
export interface CellSnippetProps {
    date: ZonedDateTime

    view: string

    isToday: boolean

    /**
     * The day the scheduler's `date` points at.
     */
    isAnchor: boolean

    isWeekend: boolean

    isHoliday: boolean

    /**
     * Inside business hours, or on a business day for whole-day cells.
     */
    isBusinessHours: boolean

    /**
     * Belongs to the previous or next month in the month view.
     */
    isOutside: boolean
}

/**
 * Argument of the `header` snippet, rendered once per day column header.
 */
export interface HeaderSnippetProps {
    date: ZonedDateTime

    view: string

    /**
     * Formatted label the default header would show.
     */
    label: string

    isToday: boolean

    /**
     * The day the scheduler's `date` points at.
     */
    isAnchor: boolean

    /**
     * The holiday on this day, if any.
     */
    holiday?: Holiday
}

/**
 * Argument of the `toolbar` snippet, which replaces the built-in toolbar so
 * navigation can live anywhere in the page.
 */
export interface ToolbarSnippetProps {
    /**
     * The built-in title for the visible range, such as `Sep 7 – 13, 2026`.
     */
    title: string

    /**
     * Date the visible range is computed from.
     */
    date: ZonedDateTime

    range: DateRange

    view: string

    /**
     * Every registered view with its display name, in switcher order.
     */
    views: { name: string; label: string }[]

    scheduler: SchedulerContext

    /**
     * Move one period back or forward, as the built-in arrows do.
     */
    step: (direction: 1 | -1) => void

    /**
     * Move the range to the current day.
     */
    today: () => void

    /**
     * Move the scheduler to `date`, switching to `view` when given.
     */
    navigate: (date: ZonedDateTime, view?: string) => void

    setView: (view: string) => void

    /**
     * Show or hide the sidebar, or call `onMenu` when there is none.
     */
    toggleSidebar: () => void

    /**
     * Whether the sidebar is currently shown.
     */
    sidebarOpen: boolean
}

/**
 * Argument of the `sidebar` snippet, rendered beside the view or, below the
 * sidebar breakpoint, inside a slide-over panel.
 */
export interface SidebarSnippetProps<T = unknown> {
    /**
     * Date the visible range is computed from.
     */
    date: ZonedDateTime

    view: string

    range: DateRange

    /**
     * Every event the scheduler holds, recurring series unexpanded. Feed it
     * to `DateNavigator` for its dots.
     */
    events: SchedulerEvent<T>[]

    scheduler: SchedulerContext

    /**
     * Move the scheduler to `date`, switching to `view` when given.
     */
    navigate: (date: ZonedDateTime, view?: string) => void

    /**
     * Hide the sidebar: closes the slide-over, or collapses the docked panel.
     */
    close: () => void

    /**
     * `true` while the sidebar sits beside the view, `false` in the slide-over.
     */
    docked: boolean
}

/**
 * Argument of the `eventDetail` snippet, rendered under the default details
 * in the popover an event opens.
 */
export interface EventDetailSnippetProps<T = unknown> {
    event: SchedulerEvent<T>

    /**
     * Closes the popover.
     */
    close: () => void
}
