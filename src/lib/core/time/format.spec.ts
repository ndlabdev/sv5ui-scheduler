import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import {
    formatDayNumber,
    formatDayRange,
    formatHour,
    formatLongDate,
    formatMonthYear,
    formatTime,
    formatTimeRange,
    formatWeekday
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
        expect(formatHour(at('2026-09-12T09:00'), 'en-US')).toBe('9 AM')
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
