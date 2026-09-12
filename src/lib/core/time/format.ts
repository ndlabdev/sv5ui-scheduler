import type { ZonedDateTime } from '@internationalized/date'
import type { DateRange } from '../../types/range.types.js'

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(locale: string, options: Intl.DateTimeFormatOptions, timeZone: string) {
    const key = `${locale}|${timeZone}|${JSON.stringify(options)}`
    let cached = formatters.get(key)
    if (!cached) {
        cached = new Intl.DateTimeFormat(locale, { ...options, timeZone })
        formatters.set(key, cached)
    }
    return cached
}

function format(date: ZonedDateTime, locale: string, options: Intl.DateTimeFormatOptions): string {
    return formatter(locale, options, date.timeZone).format(date.toDate())
}

export function formatTime(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { hour: 'numeric', minute: '2-digit' })
}

export function formatTimeRange(start: ZonedDateTime, end: ZonedDateTime, locale: string): string {
    return formatter(locale, { hour: 'numeric', minute: '2-digit' }, start.timeZone).formatRange(
        start.toDate(),
        end.toDate()
    )
}

export function formatHour(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { hour: 'numeric' })
}

export function formatWeekday(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'short' })
}

export function formatDayNumber(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { day: 'numeric' })
}

export function formatLongDate(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatMonthYear(date: ZonedDateTime, locale: string): string {
    return format(date, locale, { month: 'long', year: 'numeric' })
}

export function formatDayRange(range: DateRange, locale: string): string {
    const last = range.end.subtract({ days: 1 })
    return formatter(
        locale,
        { month: 'short', day: 'numeric', year: 'numeric' },
        range.start.timeZone
    ).formatRange(range.start.toDate(), last.toDate())
}
