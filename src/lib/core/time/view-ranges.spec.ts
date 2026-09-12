import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { eachDay } from './range.js'
import { dayRange, daysRange, monthRange, stepDays, stepMonths, weekRange } from './view-ranges.js'

const at = (iso: string) => parseZonedDateTime(`${iso}[America/New_York]`)
const iso = (date: { toString(): string }) => date.toString().slice(0, 16)

describe('dayRange', () => {
    it('covers the anchor day at midnight boundaries', () => {
        const range = dayRange(at('2026-09-12T15:30'))
        expect(iso(range.start)).toBe('2026-09-12T00:00')
        expect(iso(range.end)).toBe('2026-09-13T00:00')
    })
})

describe('daysRange', () => {
    it('covers a number of days starting on the anchor day', () => {
        const range = daysRange(at('2026-09-12T15:30'), 3)
        expect(eachDay(range)).toHaveLength(3)
    })
})

describe('weekRange', () => {
    it('starts on the configured weekday and spans seven days', () => {
        const monday = weekRange(at('2026-09-12T15:30'), 1)
        expect(iso(monday.start)).toBe('2026-09-07T00:00')
        expect(iso(monday.end)).toBe('2026-09-14T00:00')
        const sunday = weekRange(at('2026-09-12T15:30'), 0)
        expect(iso(sunday.start)).toBe('2026-09-06T00:00')
    })

    it('spans seven days across a DST change', () => {
        const range = weekRange(at('2026-03-10T12:00'), 0)
        expect(eachDay(range)).toHaveLength(7)
        expect(iso(range.start)).toBe('2026-03-08T00:00')
    })
})

describe('monthRange', () => {
    it('starts on the week containing the first and ends after the week containing the last', () => {
        const range = monthRange(at('2026-09-12T12:00'), 1)
        expect(iso(range.start)).toBe('2026-08-31T00:00')
        expect(iso(range.end)).toBe('2026-10-05T00:00')
        expect(eachDay(range)).toHaveLength(35)
    })

    it('needs six rows for a month that spreads over them', () => {
        const range = monthRange(at('2026-08-15T12:00'), 1)
        expect(eachDay(range)).toHaveLength(42)
    })

    it('needs only four rows for a February starting on the week start', () => {
        const range = monthRange(at('2027-02-10T12:00'), 1)
        expect(eachDay(range)).toHaveLength(28)
    })

    it('always yields whole weeks', () => {
        for (const month of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) {
            const range = monthRange(at(`2026-${String(month).padStart(2, '0')}-15T12:00`), 1)
            expect(eachDay(range).length % 7).toBe(0)
        }
    })
})

describe('stepping', () => {
    it('keeps the clock time when stepping days and months', () => {
        expect(iso(stepDays(at('2026-03-07T09:00'), 1))).toBe('2026-03-08T09:00')
        expect(iso(stepDays(at('2026-03-08T09:00'), -1))).toBe('2026-03-07T09:00')
        expect(iso(stepMonths(at('2026-01-31T09:00'), 1))).toBe('2026-02-28T09:00')
    })
})
