import {
    now,
    parseAbsolute,
    parseDate,
    parseDateTime,
    parseZonedDateTime,
    toTimeZone,
    toZoned as zonedFromCalendar,
    type ZonedDateTime
} from '@internationalized/date'
import type { DateInput, TimeZoneId } from '../../types/range.types.js'

const ZONE_SUFFIX = /\[[^\]]+\]$/
const OFFSET_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/
const MIDNIGHT = { hour: 0, minute: 0, second: 0, millisecond: 0 }
const MS_PER_MINUTE = 60000

export function toZoned(input: DateInput, timeZone: TimeZoneId): ZonedDateTime {
    if (typeof input !== 'string') {
        return input.timeZone === timeZone ? input : toTimeZone(input, timeZone)
    }
    if (ZONE_SUFFIX.test(input)) return toTimeZone(parseZonedDateTime(input), timeZone)
    if (DATE_ONLY.test(input)) return zonedFromCalendar(parseDate(input), timeZone)
    if (OFFSET_SUFFIX.test(input)) return parseAbsolute(input, timeZone)
    return zonedFromCalendar(parseDateTime(input), timeZone)
}

export function nowIn(timeZone: TimeZoneId): ZonedDateTime {
    return now(timeZone)
}

export function startOfDay(date: ZonedDateTime): ZonedDateTime {
    return date.set(MIDNIGHT)
}

export function endOfDay(date: ZonedDateTime): ZonedDateTime {
    return startOfDay(date.add({ days: 1 }))
}

export function minutesBetween(from: ZonedDateTime, to: ZonedDateTime): number {
    return (to.toDate().getTime() - from.toDate().getTime()) / MS_PER_MINUTE
}

export function minutesFromDayStart(date: ZonedDateTime): number {
    return minutesBetween(startOfDay(date), date)
}

export function dayLengthMinutes(dayStart: ZonedDateTime): number {
    return minutesBetween(dayStart, endOfDay(dayStart))
}

export function isSameDay(a: ZonedDateTime, b: ZonedDateTime): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day
}

export function isBefore(a: ZonedDateTime, b: ZonedDateTime): boolean {
    return a.compare(b) < 0
}

export function isAfter(a: ZonedDateTime, b: ZonedDateTime): boolean {
    return a.compare(b) > 0
}

export function min(a: ZonedDateTime, b: ZonedDateTime): ZonedDateTime {
    return isBefore(b, a) ? b : a
}

export function max(a: ZonedDateTime, b: ZonedDateTime): ZonedDateTime {
    return isAfter(b, a) ? b : a
}
