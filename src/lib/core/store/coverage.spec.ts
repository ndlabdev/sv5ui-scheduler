import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { cover, covers, EMPTY_COVERAGE, uncovered } from './coverage.js'

const at = (day: string) => parseZonedDateTime(`2026-09-${day}T00:00[UTC]`)
const range = (start: string, end: string) => ({ start: at(start), end: at(end) })
const days = (ranges: readonly { start: { day: number }; end: { day: number } }[]) =>
    ranges.map((r) => [r.start.day, r.end.day])

describe('cover', () => {
    it('adds a range to empty coverage', () => {
        expect(days(cover(EMPTY_COVERAGE, range('07', '14')))).toEqual([[7, 14]])
    })

    it('merges touching and overlapping ranges', () => {
        let coverage = cover(EMPTY_COVERAGE, range('07', '14'))
        coverage = cover(coverage, range('14', '21'))
        expect(days(coverage)).toEqual([[7, 21]])
        coverage = cover(coverage, range('18', '25'))
        expect(days(coverage)).toEqual([[7, 25]])
    })

    it('keeps disjoint ranges apart and sorted', () => {
        let coverage = cover(EMPTY_COVERAGE, range('20', '22'))
        coverage = cover(coverage, range('01', '03'))
        expect(days(coverage)).toEqual([
            [1, 3],
            [20, 22]
        ])
    })

    it('bridges a gap that a new range fills', () => {
        let coverage = cover(EMPTY_COVERAGE, range('01', '03'))
        coverage = cover(coverage, range('05', '07'))
        coverage = cover(coverage, range('03', '05'))
        expect(days(coverage)).toEqual([[1, 7]])
    })
})

describe('uncovered', () => {
    const coverage = cover(cover(EMPTY_COVERAGE, range('07', '10')), range('12', '14'))

    it('returns the whole range when nothing is covered', () => {
        expect(days(uncovered(EMPTY_COVERAGE, range('01', '05')))).toEqual([[1, 5]])
    })

    it('returns nothing when the range is fully covered', () => {
        expect(uncovered(coverage, range('08', '09'))).toEqual([])
        expect(covers(coverage, range('07', '10'))).toBe(true)
    })

    it('returns the gaps around and between covered parts', () => {
        expect(days(uncovered(coverage, range('05', '16')))).toEqual([
            [5, 7],
            [10, 12],
            [14, 16]
        ])
    })

    it('clips gaps to the requested range', () => {
        expect(days(uncovered(coverage, range('09', '13')))).toEqual([[10, 12]])
        expect(covers(coverage, range('09', '13'))).toBe(false)
    })
})
