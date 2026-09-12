import type { ZonedDateTime } from '@internationalized/date'
import type { DateInput, WeekDay } from './range.types.js'

/**
 * Repetition unit of a recurrence rule, as in RFC 5545 `FREQ`.
 */
export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly'

/**
 * A weekday qualified by its position inside the month or year, as in RFC 5545
 * `BYDAY` with an ordinal such as `-1MO` for the last Monday.
 *
 * The built-in engine does not evaluate ordinals. It warns once in development
 * and treats the entry as the plain weekday.
 */
export interface OrdinalWeekDay {
    day: WeekDay

    /**
     * `1` is the first occurrence in the period, `-1` the last.
     */
    ordinal: number
}

/**
 * Recurrence rule modelled on RFC 5545 `RRULE`. The type describes the full
 * grammar so stored data never has to change shape; the built-in engine
 * evaluates the subset documented on each field and ignores the rest with a
 * development-only warning. It never throws on an unsupported field.
 */
export interface RecurrenceRule {
    freq: RecurrenceFrequency

    /**
     * Number of `freq` units between occurrences.
     * @default 1
     */
    interval?: number

    /**
     * Weekdays the rule applies to. Plain weekdays are evaluated by the
     * built-in engine; ordinal entries are not.
     */
    byDay?: Array<WeekDay | OrdinalWeekDay>

    /**
     * Total number of occurrences, including the first. Mutually exclusive
     * with `until`; when both are set `count` wins.
     */
    count?: number

    /**
     * Last instant an occurrence may start at, inclusive.
     */
    until?: ZonedDateTime

    /**
     * Occurrences to remove from the series, compared by instant.
     */
    exDates?: ZonedDateTime[]

    /**
     * Extra occurrences to add to the series, as in RFC 5545 `RDATE`.
     * Not evaluated by the built-in engine.
     */
    rDates?: ZonedDateTime[]

    /**
     * Selects the nth occurrence from the set produced by the other `by*`
     * fields, as in RFC 5545 `BYSETPOS`. Not evaluated by the built-in engine.
     */
    bySetPos?: number[]

    /**
     * Days of the month, `1` to `31` or negative from the end.
     * Not evaluated by the built-in engine.
     */
    byMonthDay?: number[]

    /**
     * Months of the year, `1` to `12`. Not evaluated by the built-in engine.
     */
    byMonth?: number[]

    /**
     * ISO 8601 week numbers, `1` to `53` or negative from the end.
     * Not evaluated by the built-in engine.
     */
    byWeekNo?: number[]

    /**
     * Days of the year, `1` to `366` or negative from the end.
     * Not evaluated by the built-in engine.
     */
    byYearDay?: number[]

    /**
     * First day of the week for `weekly` rules with an `interval` above `1`,
     * as in RFC 5545 `WKST`.
     * @default the scheduler's `weekStartsOn`
     */
    weekStart?: WeekDay
}

/**
 * `RecurrenceRule` as accepted at the public boundary, with dates given as
 * `DateInput`. Normalised to `RecurrenceRule` together with the event.
 */
export type RecurrenceRuleInput = Omit<RecurrenceRule, 'until' | 'exDates' | 'rDates'> & {
    until?: DateInput
    exDates?: DateInput[]
    rDates?: DateInput[]
}
