import type { ZonedDateTime } from '@internationalized/date'
import type { SchedulerCalendar } from './event.types.js'
import type { SchedulerLabels } from './labels.types.js'
import type { BusinessHours, Holiday, TimeZoneId, WeekDay } from './range.types.js'

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

    /**
     * Calendars events may belong to, as passed to the scheduler.
     */
    calendars: SchedulerCalendar[]

    /**
     * Days the week view shows when the application asked for a custom
     * duration. `undefined` means a calendar week.
     */
    dayCount?: number

    /**
     * Show ISO 8601 week numbers beside each week.
     */
    weekNumbers: boolean

    /**
     * Text direction, from the scheduler's `dir` attribute or inherited from
     * the page when it mounts.
     */
    direction: 'ltr' | 'rtl'

    labels: SchedulerLabels

    /**
     * Current instant, refreshed once a minute. Read this instead of
     * constructing your own so tests can freeze it.
     */
    now: ZonedDateTime
}
