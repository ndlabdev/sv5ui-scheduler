import { describe, expect, it } from 'vitest'
import type { DateRange } from '../../types/range.types.js'
import { at, contextFor, event } from '../../../tests/fixtures/layout.js'
import { countByCell, layoutSpans, overflowByCell } from './spans.js'

const monthRange: DateRange = { start: at('2026-08-31T00:00'), end: at('2026-10-12T00:00') }
const month = contextFor(monthRange, 7)
const find = (positions: ReturnType<typeof layoutSpans>, id: string) =>
    positions.filter((p) => p.event.id === id)

describe('layoutSpans', () => {
    it('places a single-day event in its row and column', () => {
        const [p] = layoutSpans(
            [event('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            monthRange,
            month
        )
        expect(p).toMatchObject({ row: 1, startColumn: 2, endColumn: 3, lane: 0 })
        expect(p.continuesBefore).toBe(false)
        expect(p.continuesAfter).toBe(false)
    })

    it('merges the days of a multi-day event into one span per row', () => {
        const positions = layoutSpans(
            [event('trip', '2026-09-09T00:00', '2026-09-12T00:00', { allDay: true })],
            monthRange,
            month
        )
        expect(positions).toHaveLength(1)
        expect(positions[0]).toMatchObject({ row: 1, startColumn: 2, endColumn: 5 })
    })

    it('breaks a span at the row boundary and flags both sides', () => {
        const positions = find(
            layoutSpans(
                [event('long', '2026-09-12T00:00', '2026-09-16T00:00', { allDay: true })],
                monthRange,
                month
            ),
            'long'
        )
        expect(positions.map((p) => [p.row, p.startColumn, p.endColumn])).toEqual([
            [1, 5, 7],
            [2, 0, 2]
        ])
        expect(positions[0]).toMatchObject({ continuesBefore: false, continuesAfter: true })
        expect(positions[1]).toMatchObject({ continuesBefore: true, continuesAfter: false })
    })

    it('flags a span clipped by the range', () => {
        const [p] = layoutSpans(
            [event('a', '2026-08-25T00:00', '2026-09-02T00:00', { allDay: true })],
            monthRange,
            month
        )
        expect(p).toMatchObject({ row: 0, startColumn: 0, endColumn: 2, continuesBefore: true })
    })

    it('stacks overlapping spans into lanes, longest first', () => {
        const positions = layoutSpans(
            [
                event('short', '2026-09-09T09:00', '2026-09-09T10:00'),
                event('long', '2026-09-08T00:00', '2026-09-11T00:00', { allDay: true }),
                event('other', '2026-09-11T09:00', '2026-09-11T10:00')
            ],
            monthRange,
            month
        )
        expect(find(positions, 'long')[0].lane).toBe(0)
        expect(find(positions, 'short')[0].lane).toBe(1)
        expect(find(positions, 'other')[0].lane).toBe(0)
    })

    it('assigns lanes per row independently', () => {
        const positions = layoutSpans(
            [
                event('w1', '2026-09-09T09:00', '2026-09-09T10:00'),
                event('w2', '2026-09-16T09:00', '2026-09-16T10:00')
            ],
            monthRange,
            month
        )
        expect(positions.map((p) => p.lane)).toEqual([0, 0])
    })

    it('treats a time grid week as a single row of all-day columns', () => {
        const range: DateRange = { start: at('2026-09-07T00:00'), end: at('2026-09-14T00:00') }
        const positions = layoutSpans(
            [event('a', '2026-09-09T00:00', '2026-09-11T00:00', { allDay: true })],
            range,
            contextFor(range)
        )
        expect(positions[0]).toMatchObject({ row: 0, startColumn: 2, endColumn: 4 })
    })
})

describe('overflowByCell', () => {
    it('counts hidden spans per cell across the columns they cover', () => {
        const positions = layoutSpans(
            [
                event('a', '2026-09-09T08:00', '2026-09-09T09:00'),
                event('b', '2026-09-09T09:00', '2026-09-09T10:00'),
                event('c', '2026-09-09T10:00', '2026-09-09T11:00'),
                event('d', '2026-09-09T00:00', '2026-09-11T00:00', { allDay: true })
            ],
            monthRange,
            month
        )
        const overflow = overflowByCell(positions, 2, 7)
        expect(overflow.get(1 * 7 + 2)).toBe(2)
        expect(overflow.get(1 * 7 + 3)).toBeUndefined()
    })

    it('is empty when everything fits', () => {
        const positions = layoutSpans(
            [event('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            monthRange,
            month
        )
        expect(overflowByCell(positions, 3, 7).size).toBe(0)
    })
})

describe('countByCell', () => {
    it('counts every span covering a cell, whatever its lane', () => {
        const positions = layoutSpans(
            [
                event('a', '2026-09-09T08:00', '2026-09-09T09:00'),
                event('b', '2026-09-09T00:00', '2026-09-11T00:00', { allDay: true })
            ],
            monthRange,
            month
        )
        const counts = countByCell(positions, 7)
        expect(counts.get(1 * 7 + 2)).toBe(2)
        expect(counts.get(1 * 7 + 3)).toBe(1)
        expect(counts.get(1 * 7 + 4)).toBeUndefined()
    })
})
