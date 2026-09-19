import { parseZonedDateTime } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetWarnings } from '../utils/dev.js'
import { normalizeHiddenDays, visibleColumns, visibleDays, visibleRange } from './hidden-days.js'

const monday = parseZonedDateTime('2026-09-07T00:00[Asia/Ho_Chi_Minh]')
const week = Array.from({ length: 7 }, (_, index) => monday.add({ days: index }))
const iso = (days: { toString(): string }[]) => days.map((day) => day.toString().slice(0, 10))

afterEach(() => {
    resetWarnings()
    vi.restoreAllMocks()
})

describe('normalizeHiddenDays', () => {
    it('keeps each valid week day once, in order', () => {
        expect(normalizeHiddenDays([6, 0, 6, 9, -1, 2.5])).toEqual([0, 6])
    })

    it('ignores a list that hides the whole week and reports it once', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(normalizeHiddenDays([0, 1, 2, 3, 4, 5, 6])).toEqual([])
        normalizeHiddenDays([0, 1, 2, 3, 4, 5, 6])
        expect(warn).toHaveBeenCalledTimes(1)
    })
})

describe('visibleDays', () => {
    it('leaves out hidden week days', () => {
        expect(iso(visibleDays(week, [0, 6]))).toEqual([
            '2026-09-07',
            '2026-09-08',
            '2026-09-09',
            '2026-09-10',
            '2026-09-11'
        ])
    })

    it('keeps the days when hiding would leave none', () => {
        expect(iso(visibleDays([monday.add({ days: 5 })], [0, 6]))).toEqual(['2026-09-12'])
    })
})

describe('visibleColumns', () => {
    it('scales a row of week days by the days that remain', () => {
        expect(visibleColumns(7, 25, 35)).toBe(5)
        expect(visibleColumns(7, 35, 35)).toBe(7)
    })

    it('puts every day in one row when the view sets no row size', () => {
        expect(visibleColumns(undefined, 5, 7)).toBe(5)
    })
})

describe('visibleRange', () => {
    const range = { start: monday, end: monday.add({ days: 7 }) }

    it('spans the first to the last shown day', () => {
        const shown = visibleRange(range, visibleDays(week, [0, 6]))
        expect(iso([shown.start, shown.end])).toEqual(['2026-09-07', '2026-09-12'])
    })

    it('keeps the full range when no day is shown', () => {
        expect(visibleRange(range, [])).toBe(range)
    })
})
