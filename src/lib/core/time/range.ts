import type { ZonedDateTime } from '@internationalized/date'
import type { DateRange } from '../../types/range.types.js'
import { endOfDay, isAfter, isBefore, max, min, startOfDay } from './zone.js'

export interface DaySegment {
    dayStart: ZonedDateTime
    start: ZonedDateTime
    end: ZonedDateTime
    continuesBefore: boolean
    continuesAfter: boolean
}

export function createRange(start: ZonedDateTime, end: ZonedDateTime): DateRange {
    if (!isAfter(end, start)) {
        throw new RangeError(`Range end ${end.toString()} must be after start ${start.toString()}`)
    }
    return { start, end }
}

export function contains(range: DateRange, date: ZonedDateTime): boolean {
    return !isBefore(date, range.start) && isBefore(date, range.end)
}

export function overlaps(a: DateRange, b: DateRange): boolean {
    return isBefore(a.start, b.end) && isBefore(b.start, a.end)
}

export function intersect(a: DateRange, b: DateRange): DateRange | null {
    if (!overlaps(a, b)) return null
    return { start: max(a.start, b.start), end: min(a.end, b.end) }
}

export function eachDay(range: DateRange): ZonedDateTime[] {
    const days: ZonedDateTime[] = []
    for (let day = startOfDay(range.start); isBefore(day, range.end); day = endOfDay(day)) {
        days.push(day)
    }
    return days
}

export function splitByDay(range: DateRange): DaySegment[] {
    return eachDay(range).map((dayStart) => {
        const dayEnd = endOfDay(dayStart)
        return {
            dayStart,
            start: max(dayStart, range.start),
            end: min(dayEnd, range.end),
            continuesBefore: isBefore(range.start, dayStart),
            continuesAfter: isAfter(range.end, dayEnd)
        }
    })
}
