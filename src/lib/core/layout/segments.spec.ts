import { describe, expect, it } from 'vitest'
import { eachDay } from '../time/range.js'
import { event, week } from '../../../tests/fixtures/layout.js'
import { isWholeDay, segmentsInRange } from './segments.js'

const range = week('2026-09-07')
const days = eachDay(range)

describe('isWholeDay', () => {
    it('is true for allDay events and for anything lasting a day or more', () => {
        expect(
            isWholeDay(event('a', '2026-09-08T09:00', '2026-09-08T10:00', { allDay: true }))
        ).toBe(true)
        expect(isWholeDay(event('b', '2026-09-08T09:00', '2026-09-09T09:00'))).toBe(true)
        expect(isWholeDay(event('c', '2026-09-08T09:00', '2026-09-09T08:59'))).toBe(false)
    })
})

describe('segmentsInRange', () => {
    it('maps a same-day event to its day index', () => {
        const [segment] = segmentsInRange(
            [event('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            range,
            days
        )
        expect(segment.dayIndex).toBe(2)
        expect(segment.continuesBefore).toBe(false)
        expect(segment.continuesAfter).toBe(false)
    })

    it('splits an event crossing midnight into two segments', () => {
        const segments = segmentsInRange(
            [event('a', '2026-09-09T23:00', '2026-09-10T01:00')],
            range,
            days
        )
        expect(segments.map((s) => s.dayIndex)).toEqual([2, 3])
        expect(segments[0].continuesAfter).toBe(true)
        expect(segments[1].continuesBefore).toBe(true)
    })

    it('clips an event that starts before the range and flags it', () => {
        const segments = segmentsInRange(
            [event('a', '2026-09-05T09:00', '2026-09-07T10:00')],
            range,
            days
        )
        expect(segments).toHaveLength(1)
        expect(segments[0].dayIndex).toBe(0)
        expect(segments[0].start.toString()).toBe(range.start.toString())
        expect(segments[0].continuesBefore).toBe(true)
    })

    it('clips an event that ends after the range and flags it', () => {
        const segments = segmentsInRange(
            [event('a', '2026-09-13T22:00', '2026-09-15T10:00')],
            range,
            days
        )
        expect(segments).toHaveLength(1)
        expect(segments[0].dayIndex).toBe(6)
        expect(segments[0].continuesAfter).toBe(true)
    })

    it('drops events entirely outside the range', () => {
        const segments = segmentsInRange(
            [
                event('before', '2026-09-01T09:00', '2026-09-01T10:00'),
                event('touching', '2026-09-06T23:00', '2026-09-07T00:00'),
                event('after', '2026-09-14T00:00', '2026-09-14T01:00')
            ],
            range,
            days
        )
        expect(segments).toEqual([])
    })

    it('keeps the event reference on every segment', () => {
        const e = event('a', '2026-09-09T23:00', '2026-09-10T01:00')
        const segments = segmentsInRange([e], range, days)
        expect(segments.every((s) => s.event === e)).toBe(true)
    })

    it('ignores days the context does not list', () => {
        const weekend = [days[5], days[6]]
        const segments = segmentsInRange(
            [
                event('mon', '2026-09-07T09:00', '2026-09-07T10:00'),
                event('sat', '2026-09-12T09:00', '2026-09-12T10:00')
            ],
            range,
            weekend
        )
        expect(segments.map((s) => [s.event.id, s.dayIndex])).toEqual([['sat', 0]])
    })
})
