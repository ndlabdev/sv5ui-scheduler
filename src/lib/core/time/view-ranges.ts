import type { ZonedDateTime } from '@internationalized/date'
import type { DateRange, WeekDay } from '../../types/range.types.js'
import { createRange } from './range.js'
import { startOfWeek } from './week.js'
import { endOfDay, startOfDay } from './zone.js'

const DAYS_PER_WEEK = 7

export function dayRange(anchor: ZonedDateTime): DateRange {
    return { start: startOfDay(anchor), end: endOfDay(anchor) }
}

export function daysRange(anchor: ZonedDateTime, days: number): DateRange {
    const start = startOfDay(anchor)
    return createRange(start, startOfDay(start.add({ days: Math.floor(days) })))
}

export function weekRange(anchor: ZonedDateTime, weekStartsOn: WeekDay): DateRange {
    const start = startOfWeek(anchor, weekStartsOn)
    return { start, end: startOfDay(start.add({ days: DAYS_PER_WEEK })) }
}

export function monthRange(anchor: ZonedDateTime, weekStartsOn: WeekDay): DateRange {
    const firstOfMonth = startOfDay(anchor.set({ day: 1 }))
    const start = startOfWeek(firstOfMonth, weekStartsOn)
    const firstOfNext = startOfDay(firstOfMonth.add({ months: 1 }))
    const end = startOfWeek(firstOfNext.add({ days: DAYS_PER_WEEK - 1 }), weekStartsOn)
    return { start, end }
}

export function stepDays(anchor: ZonedDateTime, days: number): ZonedDateTime {
    return anchor.add({ days })
}

export function stepMonths(anchor: ZonedDateTime, months: number): ZonedDateTime {
    return anchor.add({ months })
}

export function calendarMonthRange(anchor: ZonedDateTime): DateRange {
    const start = startOfDay(anchor.set({ day: 1 }))
    return { start, end: startOfDay(start.add({ months: 1 })) }
}

export function yearRange(anchor: ZonedDateTime): DateRange {
    const start = startOfDay(anchor.set({ month: 1, day: 1 }))
    return { start, end: startOfDay(start.add({ years: 1 })) }
}

export function stepYears(anchor: ZonedDateTime, years: number): ZonedDateTime {
    return anchor.add({ years })
}
