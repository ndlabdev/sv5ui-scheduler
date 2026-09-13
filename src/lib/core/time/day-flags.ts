import type { ZonedDateTime } from '@internationalized/date'
import type { BusinessHours, Holiday } from '../../types/range.types.js'
import { weekDayOf } from './week.js'

const ISO_DATE_LENGTH = 10

export function isoDate(day: ZonedDateTime): string {
    return day.toString().slice(0, ISO_DATE_LENGTH)
}

export function isWeekend(day: ZonedDateTime): boolean {
    const weekDay = weekDayOf(day)
    return weekDay === 0 || weekDay === 6
}

export function isBusinessDay(day: ZonedDateTime, hours: BusinessHours | undefined): boolean {
    return hours ? hours.days.includes(weekDayOf(day)) : !isWeekend(day)
}

export interface DayFlags {
    readonly isWeekend: boolean
    readonly isHoliday: boolean
    readonly isBusinessHours: boolean
}

export function dayFlags(
    day: ZonedDateTime,
    holidays: ReadonlyMap<string, Holiday>,
    hours: BusinessHours | undefined
): DayFlags {
    const isHoliday = holidays.has(isoDate(day))
    return {
        isWeekend: isWeekend(day),
        isHoliday,
        isBusinessHours: !isHoliday && isBusinessDay(day, hours)
    }
}

export function holidaysByDate(holidays: readonly Holiday[]): Map<string, Holiday> {
    return new Map(holidays.map((holiday) => [holiday.date, holiday]))
}

export function parseClock(value: string): { hour: number; minute: number } {
    const [hour, minute] = value.split(':').map(Number)
    return { hour, minute }
}
