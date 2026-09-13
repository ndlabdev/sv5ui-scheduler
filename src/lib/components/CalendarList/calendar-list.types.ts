import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { SchedulerCalendar } from '../../types/event.types.js'
import type { SchedulerLabels } from '../../types/labels.types.js'
import type { CalendarListSlots } from './calendar-list.variants.js'

/**
 * Argument of the `item` snippet of `CalendarList`, rendered once per calendar.
 */
export interface CalendarListItemProps {
    calendar: SchedulerCalendar

    /**
     * The calendar is not listed in `hiddenCalendars`.
     */
    visible: boolean

    /**
     * Show the calendar if hidden, hide it otherwise.
     */
    toggle: () => void
}

/**
 * Props of `CalendarList`, a checklist that shows and hides calendars. Bind
 * `hiddenCalendars` to the scheduler's prop of the same name.
 */
export type CalendarListProps = Omit<HTMLAttributes<HTMLElement>, 'class'> & {
    /**
     * Bindable reference to the root element.
     */
    ref?: HTMLElement | null

    calendars: SchedulerCalendar[]

    /**
     * Ids of the calendars that are unchecked. Bindable.
     * @default []
     */
    hiddenCalendars?: string[]

    /**
     * Heading above the list; `null` renders none.
     * @default labels.calendars
     */
    title?: string | null

    /**
     * Display strings; only `calendars` is read.
     */
    labels?: Pick<SchedulerLabels, 'calendars'>

    /**
     * Replaces the default row of one calendar.
     */
    item?: Snippet<[CalendarListItemProps]>

    /**
     * Per-slot class overrides.
     */
    ui?: Partial<Record<CalendarListSlots, ClassNameValue>>

    class?: ClassNameValue
}
