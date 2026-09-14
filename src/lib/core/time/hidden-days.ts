import type { ZonedDateTime } from '@internationalized/date'
import type { DateRange, WeekDay } from '../../types/range.types.js'
import { warnOnce } from '../utils/dev.js'
import { weekDayOf } from './week.js'

const DAYS_PER_WEEK = 7

export function normalizeHiddenDays(hidden: readonly number[]): WeekDay[] {
    const days = [...new Set(hidden)]
        .filter((day): day is WeekDay => Number.isInteger(day) && day >= 0 && day < DAYS_PER_WEEK)
        .sort((a, b) => a - b)
    if (days.length < DAYS_PER_WEEK) return days
    warnOnce('hidden-days', 'hiddenDays hides every day of the week; showing all of them.')
    return []
}

export function visibleDays(
    days: readonly ZonedDateTime[],
    hidden: readonly WeekDay[]
): ZonedDateTime[] {
    const shown = days.filter((day) => !hidden.includes(weekDayOf(day)))
    return shown.length > 0 ? shown : [...days]
}

export function visibleColumns(
    columnsPerRow: number | undefined,
    shown: number,
    total: number
): number {
    if (columnsPerRow === undefined || total === 0) return shown
    return Math.max(Math.round((columnsPerRow * shown) / total), 1)
}

export function visibleRange(range: DateRange, days: readonly ZonedDateTime[]): DateRange {
    const last = days[days.length - 1]
    if (!last) return range
    return { start: days[0], end: last.add({ days: 1 }) }
}
