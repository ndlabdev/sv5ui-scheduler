import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import {
    dayFlags,
    holidaysByDate,
    isBusinessDay,
    isWeekend,
    isoDate,
    parseClock
} from './day-flags.js'

const at = (iso: string) => parseZonedDateTime(`${iso}T12:00[Asia/Ho_Chi_Minh]`)

describe('day flags', () => {
    it('formats the calendar date of a zoned value', () => {
        expect(isoDate(at('2026-09-13'))).toBe('2026-09-13')
    })

    it('knows weekends', () => {
        expect(isWeekend(at('2026-09-12'))).toBe(true)
        expect(isWeekend(at('2026-09-13'))).toBe(true)
        expect(isWeekend(at('2026-09-14'))).toBe(false)
    })

    it('falls back to weekdays when no business hours are given', () => {
        expect(isBusinessDay(at('2026-09-14'), undefined)).toBe(true)
        expect(isBusinessDay(at('2026-09-13'), undefined)).toBe(false)
        const hours = { start: '09:00', end: '17:00', days: [6, 0] as const }
        expect(isBusinessDay(at('2026-09-13'), { ...hours, days: [...hours.days] })).toBe(true)
        expect(isBusinessDay(at('2026-09-14'), { ...hours, days: [...hours.days] })).toBe(false)
    })

    it('marks a holiday as outside business hours whatever the weekday', () => {
        const holidays = holidaysByDate([{ date: '2026-09-14' }])
        expect(dayFlags(at('2026-09-14'), holidays, undefined)).toEqual({
            isWeekend: false,
            isHoliday: true,
            isBusinessHours: false
        })
        expect(dayFlags(at('2026-09-15'), holidays, undefined)).toEqual({
            isWeekend: false,
            isHoliday: false,
            isBusinessHours: true
        })
    })

    it('indexes holidays by date and parses clock strings', () => {
        const map = holidaysByDate([{ date: '2026-09-10', title: 'x' }, { date: '2026-09-11' }])
        expect(map.get('2026-09-10')?.title).toBe('x')
        expect(map.has('2026-09-12')).toBe(false)
        expect(parseClock('09:30')).toEqual({ hour: 9, minute: 30 })
    })
})
