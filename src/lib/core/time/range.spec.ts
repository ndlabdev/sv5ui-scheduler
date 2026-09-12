import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { contains, createRange, eachDay, intersect, overlaps, splitByDay } from './range.js'

const at = (iso: string) => parseZonedDateTime(`${iso}[UTC]`)
const range = (start: string, end: string) => createRange(at(start), at(end))

describe('createRange', () => {
    it('rejects an empty or reversed range', () => {
        expect(() => range('2026-09-12T10:00', '2026-09-12T10:00')).toThrow(RangeError)
        expect(() => range('2026-09-12T11:00', '2026-09-12T10:00')).toThrow(RangeError)
    })
})

describe('contains', () => {
    const r = range('2026-09-12T10:00', '2026-09-12T12:00')

    it('includes the start and excludes the end', () => {
        expect(contains(r, at('2026-09-12T10:00'))).toBe(true)
        expect(contains(r, at('2026-09-12T11:59'))).toBe(true)
        expect(contains(r, at('2026-09-12T12:00'))).toBe(false)
        expect(contains(r, at('2026-09-12T09:59'))).toBe(false)
    })
})

describe('overlaps', () => {
    const r = range('2026-09-12T10:00', '2026-09-12T12:00')

    it('treats touching ranges as disjoint', () => {
        expect(overlaps(r, range('2026-09-12T12:00', '2026-09-12T13:00'))).toBe(false)
        expect(overlaps(r, range('2026-09-12T09:00', '2026-09-12T10:00'))).toBe(false)
    })

    it('detects partial and full overlap in either order', () => {
        const partial = range('2026-09-12T11:00', '2026-09-12T13:00')
        const inside = range('2026-09-12T10:30', '2026-09-12T11:30')
        expect(overlaps(r, partial)).toBe(true)
        expect(overlaps(partial, r)).toBe(true)
        expect(overlaps(r, inside)).toBe(true)
        expect(overlaps(inside, r)).toBe(true)
    })
})

describe('intersect', () => {
    it('returns the common part or null', () => {
        const a = range('2026-09-12T10:00', '2026-09-12T12:00')
        const b = range('2026-09-12T11:00', '2026-09-12T13:00')
        expect(intersect(a, b)).toEqual(range('2026-09-12T11:00', '2026-09-12T12:00'))
        expect(intersect(a, range('2026-09-12T12:00', '2026-09-12T13:00'))).toBeNull()
    })
})

describe('eachDay', () => {
    it('lists every day the range touches, starting at midnight', () => {
        const days = eachDay(range('2026-09-12T22:00', '2026-09-14T01:00'))
        expect(days.map((d) => d.toString())).toEqual([
            '2026-09-12T00:00:00+00:00[UTC]',
            '2026-09-13T00:00:00+00:00[UTC]',
            '2026-09-14T00:00:00+00:00[UTC]'
        ])
    })

    it('does not include a day the range ends exactly at the start of', () => {
        expect(eachDay(range('2026-09-12T22:00', '2026-09-13T00:00'))).toHaveLength(1)
    })
})

describe('splitByDay', () => {
    it('returns one segment for a range within a day', () => {
        const [segment] = splitByDay(range('2026-09-12T10:00', '2026-09-12T12:00'))
        expect(segment.continuesBefore).toBe(false)
        expect(segment.continuesAfter).toBe(false)
        expect(segment.start.toString()).toBe('2026-09-12T10:00:00+00:00[UTC]')
        expect(segment.end.toString()).toBe('2026-09-12T12:00:00+00:00[UTC]')
    })

    it('clips a three day range and flags continuation on both sides', () => {
        const segments = splitByDay(range('2026-09-12T22:00', '2026-09-14T01:00'))
        expect(segments).toHaveLength(3)
        expect(segments.map((s) => [s.continuesBefore, s.continuesAfter])).toEqual([
            [false, true],
            [true, true],
            [true, false]
        ])
        expect(segments[1].start.toString()).toBe('2026-09-13T00:00:00+00:00[UTC]')
        expect(segments[1].end.toString()).toBe('2026-09-14T00:00:00+00:00[UTC]')
    })
})
