import type { SchedulerEvent } from './event.types.js'

/**
 * Every string the scheduler displays or announces. Supply a full set per
 * locale; `mergeLabels` fills gaps from the default English set.
 */
export interface SchedulerLabels {
    today: string
    previous: string
    next: string
    month: string
    week: string
    day: string
    agenda: string
    allDay: string

    /**
     * Accessible name of the view switcher.
     */
    views: string

    /**
     * Accessible name of the button that toggles the application's sidebar.
     */
    menu: string

    /**
     * Accessible name of the overflow menu.
     */
    actions: string
    noEvents: string
    newEvent: string

    /**
     * Label of the "+N more" link in a full month cell.
     */
    more: (count: number) => string

    /**
     * Accessible name of one day cell in the month grid.
     */
    dayCell: (date: string, count: number) => string

    /**
     * Count shown beside a day heading in the agenda.
     */
    eventCount: (count: number) => string

    /**
     * Total booked time shown beside a day heading in the agenda.
     */
    duration: (hours: number, minutes: number) => string

    /**
     * Accessible name of the grid, read when focus enters it.
     */
    grid: (view: string) => string

    /**
     * Accessible name of one event chip.
     */
    event: (event: SchedulerEvent, start: string, end: string) => string

    /**
     * Live region announcements after a keyboard or pointer action.
     */
    announce: {
        created: (event: SchedulerEvent) => string
        moved: (event: SchedulerEvent, start: string) => string
        resized: (event: SchedulerEvent, end: string) => string
        deleted: (event: SchedulerEvent) => string
        cancelled: string
        reverted: (event: SchedulerEvent) => string
        conflict: (event: SchedulerEvent) => string
    }
}
