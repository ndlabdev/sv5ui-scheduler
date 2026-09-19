import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import {
    formatDayNumber,
    formatDayRange,
    formatLongDate,
    formatMonthYear,
    formatTime,
    formatTimeRange,
    formatWeekday,
    formatAgendaDay,
    compactWeekdayFormat,
    formatWeekdayCompact,
    formatHourParts,
    formatMonthName,
    formatPopoverDay,
    formatWeekdayNarrow,
    formatYear
} from './format.js'

const at = (iso: string) => parseZonedDateTime(`${iso}[Asia/Ho_Chi_Minh]`)

describe('format', () => {
    it('formats in the value time zone, not the process zone', () => {
        const utc = parseZonedDateTime('2026-09-12T02:05[UTC]')
        expect(formatTime(utc, 'en-US')).toBe('2:05 AM')
        expect(formatTime(at('2026-09-12T14:05'), 'en-US')).toBe('2:05 PM')
    })

    it('follows the locale', () => {
        expect(formatTime(at('2026-09-12T14:05'), 'vi-VN')).toBe('14:05')
        expect(formatMonthYear(at('2026-09-12T14:05'), 'en-US')).toBe('September 2026')
        expect(formatMonthYear(at('2026-09-12T14:05'), 'vi-VN')).toContain('2026')
    })

    it('formats headers and long dates', () => {
        expect(formatWeekday(at('2026-09-12T09:00'), 'en-US')).toBe('Sat')
        expect(formatDayNumber(at('2026-09-12T09:00'), 'en-US')).toBe('12')
        expect(formatLongDate(at('2026-09-12T09:00'), 'en-US')).toBe('Saturday, September 12, 2026')
    })

    it('formats a time range', () => {
        const text = formatTimeRange(at('2026-09-12T09:00'), at('2026-09-12T10:30'), 'en-US')
        expect(text).toContain('9:00')
        expect(text).toContain('10:30')
    })

    it('formats a day range with the last day inclusive', () => {
        const range = { start: at('2026-09-07T00:00'), end: at('2026-09-14T00:00') }
        const text = formatDayRange(range, 'en-US')
        expect(text).toContain('Sep 7')
        expect(text).toContain('13, 2026')
        expect(text).not.toContain('14')
    })
})

describe('reference formats', () => {
    it('splits an hour label into a strong hour and a faint remainder', () => {
        expect(formatHourParts(at('2026-09-12T07:00'), 'en-US', false)).toEqual({
            hour: '07',
            rest: ':00'
        })
        const twelve = formatHourParts(at('2026-09-12T19:00'), 'en-US', true)
        expect(twelve.hour).toBe('7')
        expect(twelve.rest).toContain(':00')
        expect(twelve.rest).toContain('PM')
    })

    it('keeps a day period that comes before the hour with the hour', () => {
        const date = at('2026-09-12T19:00')
        const korean = formatHourParts(date, 'ko-KR')
        const [period] = new Intl.DateTimeFormat('ko-KR', {
            hour: 'numeric',
            minute: '2-digit',
            timeZone: date.timeZone
        }).formatToParts(date.toDate())
        expect(period.type).toBe('dayPeriod')
        expect(korean.hour.startsWith(period.value)).toBe(true)
        expect(korean.hour.endsWith('7')).toBe(true)
        expect(korean.rest).toBe(':00')
    })

    it('formats agenda, popover, month, weekday and year labels', () => {
        const date = at('2026-09-12T09:00')
        expect(formatAgendaDay(date, 'en-US')).toBe('Saturday, September 12')
        expect(formatPopoverDay(date, 'en-US')).toBe('Saturday, Sep 12')
        expect(formatMonthName(date, 'en-US')).toBe('September')
        expect(formatWeekdayNarrow(date, 'en-US')).toBe('S')
        expect(formatYear(date, 'en-US')).toBe('2026')
    })
})

describe('formatDayNumber in other scripts', () => {
    it('keeps only the digits of the day', () => {
        const day = at('2026-09-14T12:00')
        expect(formatDayNumber(day, 'ja-JP')).toBe('14')
        expect(formatDayNumber(day, 'zh-CN')).toBe('14')
        expect(formatDayNumber(day, 'ar-EG')).toBe('١٤')
    })
})

describe('compactWeekdayFormat', () => {
    it('uses narrow weekday names only when all seven stay distinct', () => {
        expect(compactWeekdayFormat('vi-VN')).toBe('narrow')
        expect(compactWeekdayFormat('ja-JP')).toBe('narrow')
        expect(compactWeekdayFormat('en-US')).toBe('short')
    })
})

describe('formatWeekdayCompact', () => {
    it('shortens weekday names in languages whose short and long names match', () => {
        const monday = at('2026-09-14T12:00')
        expect(formatWeekdayCompact(monday, 'ar-EG')).toHaveLength(1)
        expect(formatWeekdayCompact(monday, 'en-US')).toBe('Mon')
        expect(formatWeekdayCompact(monday, 'vi-VN')).toBe('T2')
    })
})
