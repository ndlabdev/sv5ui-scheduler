import type { ZonedDateTime } from '@internationalized/date'
import type { SchedulerEvent } from './event.types.js'
import type { PositionedEvent } from './extension.types.js'

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
