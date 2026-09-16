import type { ZonedDateTime } from '@internationalized/date'

/**
 * IANA time zone identifier, for example `'Asia/Ho_Chi_Minh'` or `'America/New_York'`.
 */
export type TimeZoneId = string

/**
 * A point in time accepted at the public boundary: an ISO 8601 string or an
 * already zoned value. Every input is normalised to `ZonedDateTime` before it
 * reaches the store; the scheduler never works with strings internally.
 */
export type DateInput = string | ZonedDateTime

/**
 * Day of the week, `0` is Sunday and `6` is Saturday, matching `Date.getDay()`.
 */
export type WeekDay = 0 | 1 | 2 | 3 | 4 | 5 | 6

/**
 * Half open interval `[start, end)`. An event ending exactly at `start` is
 * outside the range; an event starting exactly at `end` is outside as well.
 */
export interface DateRange {
    start: ZonedDateTime
    end: ZonedDateTime
}

/**
 * Wall clock hours during which the calendar is considered open. Slots outside
 * them are drawn muted; interactions are not restricted by them.
 */
export interface BusinessHours {
    /**
     * Opening time in 24 hour `HH:mm` form, such as `'09:00'`.
     */
    start: string

    /**
     * Closing time in 24 hour `HH:mm` form, exclusive, such as `'17:00'`.
     */
    end: string

    /**
     * Days the hours apply to, such as `[1, 2, 3, 4, 5]` for Monday to Friday.
     */
    days: WeekDay[]
}

/**
 * A whole day marked as a holiday. The day is tinted and treated as outside
 * business hours in every grid view, and reported to cell snippets through
 * `isHoliday`.
 */
export interface Holiday {
    /**
     * Calendar date in `YYYY-MM-DD` form, interpreted in the scheduler's time zone.
     */
    date: string

    /**
     * Shown in the day header, the month cell and the agenda day heading, and
     * read by screen readers.
     */
    title?: string
}
