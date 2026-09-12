import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { isoWeek, startOfWeek, weekDayOf } from './week.js'

const at = (iso: string) => parseZonedDateTime(`${iso}T12:00[UTC]`)

describe('weekDayOf', () => {
    it('uses Sunday as 0', () => {
        expect(weekDayOf(at('2026-09-13'))).toBe(0)
        expect(weekDayOf(at('2026-09-14'))).toBe(1)
        expect(weekDayOf(at('2026-09-12'))).toBe(6)
    })
})

describe('startOfWeek', () => {
    it('honours weekStartsOn', () => {
        const saturday = at('2026-09-12')
        expect(startOfWeek(saturday, 1).toString()).toBe('2026-09-07T00:00:00+00:00[UTC]')
        expect(startOfWeek(saturday, 0).toString()).toBe('2026-09-06T00:00:00+00:00[UTC]')
        expect(startOfWeek(saturday, 6).toString()).toBe('2026-09-12T00:00:00+00:00[UTC]')
    })

    it('returns the same day at midnight when already on the start day', () => {
        expect(startOfWeek(at('2026-09-14'), 1).toString()).toBe('2026-09-14T00:00:00+00:00[UTC]')
    })
})

describe('isoWeek', () => {
    it.each([
        ['2021-01-01', 53, 2020],
        ['2021-01-04', 1, 2021],
        ['2024-12-30', 1, 2025],
        ['2024-12-29', 52, 2024],
        ['2026-01-01', 1, 2026],
        ['2026-09-12', 37, 2026],
        ['2027-01-03', 53, 2026]
    ])('%s is week %i of %i', (date, week, year) => {
        expect(isoWeek(at(date))).toEqual({ week, year })
    })
})
