import {
    CalendarDate,
    getDayOfWeek,
    toCalendarDate,
    type ZonedDateTime
} from '@internationalized/date'
import type { WeekDay } from '../../types/range.types.js'
import { startOfDay } from './zone.js'

const DAYS_PER_WEEK = 7
const THURSDAY = 4

export interface IsoWeek {
    week: number
    year: number
}

export function weekDayOf(date: ZonedDateTime): WeekDay {
    return getDayOfWeek(date, 'en-US') as WeekDay
}

export function startOfWeek(date: ZonedDateTime, weekStartsOn: WeekDay): ZonedDateTime {
    const offset = (weekDayOf(date) - weekStartsOn + DAYS_PER_WEEK) % DAYS_PER_WEEK
    return startOfDay(date.subtract({ days: offset }))
}

export function isoWeek(date: ZonedDateTime): IsoWeek {
    const calendar = toCalendarDate(date)
    const isoDay = ((getDayOfWeek(calendar, 'en-US') + 6) % DAYS_PER_WEEK) + 1
    const thursday = calendar.add({ days: THURSDAY - isoDay })
    const dayOfYear = thursday.compare(new CalendarDate(thursday.year, 1, 1)) + 1
    return { week: Math.floor((dayOfYear - 1) / DAYS_PER_WEEK) + 1, year: thursday.year }
}
