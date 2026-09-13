import type { ZonedDateTime } from '@internationalized/date'
import type { DateInput } from './range.types.js'
import type { RecurrenceRule, RecurrenceRuleInput } from './recurrence.types.js'

/**
 * Colour role an event is drawn with. Each maps to a Material 3 token pair
 * from the sv5ui theme, so dark mode and custom themes follow automatically.
 */
export type EventColor =
    'primary' | 'secondary' | 'tertiary' | 'success' | 'warning' | 'error' | 'info' | 'surface'

/**
 * An event as held by the scheduler. Times are always `ZonedDateTime`; use
 * `EventInput` when supplying data from outside.
 *
 * `T` is the shape of `data`, an opaque payload the scheduler stores and hands
 * back but never reads.
 */
export interface SchedulerEvent<T = unknown> {
    /**
     * Stable identity. Mutations are keyed by it, so it must not change while
     * the event exists.
     */
    id: string

    title: string

    start: ZonedDateTime

    /**
     * Exclusive end. Must be after `start`; an all-day event ending on the
     * same day it starts has `end` at the start of the following day.
     */
    end: ZonedDateTime

    /**
     * Rendered in the all-day row and month cells rather than on the time grid.
     * @default false
     */
    allDay?: boolean

    /**
     * Identifier of a resource such as a room or a person. Stored and returned
     * unchanged; the built-in views do not group by resource.
     */
    resourceId?: string

    /**
     * Identifier of the `SchedulerCalendar` the event belongs to. Events of a
     * hidden calendar are not shown, and the calendar colour applies when
     * `color` is unset.
     */
    calendarId?: string

    /**
     * Repetition rule. See `RecurrenceRule` for what the built-in engine
     * evaluates. An event with a rule is a series; what the views show are
     * its occurrences, each carrying `seriesId`.
     */
    recurrence?: RecurrenceRule

    /**
     * Set on an occurrence of a recurring series: the id of the event that
     * holds the rule. Occurrences are derived, never stored, and the built-in
     * engine renders them read-only.
     */
    seriesId?: string

    /**
     * Whether the event may be moved, resized or deleted through the UI.
     * @default true
     */
    editable?: boolean

    /**
     * Rendered as a translucent block behind other events, without a title
     * chip. Background events are never editable through the UI.
     * @default false
     */
    background?: boolean

    /**
     * Colour role used by the default chip. Ignored when the `event` snippet
     * renders its own markup.
     * @default 'primary'
     */
    color?: EventColor

    /**
     * Arbitrary application payload. The scheduler never reads it.
     */
    data?: T
}

/**
 * `SchedulerEvent` as accepted at the public boundary. Times may be ISO
 * strings; they are normalised to the scheduler's time zone on the way in.
 */
export type EventInput<T = unknown> = Omit<SchedulerEvent<T>, 'start' | 'end' | 'recurrence'> & {
    start: DateInput
    end: DateInput
    recurrence?: RecurrenceRuleInput
}

/**
 * A named group of events, such as Work or Personal. Events join one through
 * `calendarId`.
 */
export interface SchedulerCalendar {
    id: string

    title: string

    /**
     * Colour of the chips of events that set no `color` of their own.
     * @default 'primary'
     */
    color?: EventColor
}
