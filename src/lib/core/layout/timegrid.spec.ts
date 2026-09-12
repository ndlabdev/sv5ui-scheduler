import { describe, expect, it } from 'vitest'
import { at, contextFor, event, week } from '../../../tests/fixtures/layout.js'
import { layoutTimeGrid } from './timegrid.js'

const range = week('2026-09-07')
const context = contextFor(range)
const byId = (positions: ReturnType<typeof layoutTimeGrid>, id: string) =>
    positions.filter((p) => p.event.id === id)

describe('layoutTimeGrid', () => {
    it('positions a timed event by minutes from its day start', () => {
        const [p] = layoutTimeGrid(
            [event('a', '2026-09-09T09:00', '2026-09-09T10:30')],
            range,
            context
        )
        expect(p.dayIndex).toBe(2)
        expect(p.top).toBe(18 * 20)
        expect(p.height).toBe(3 * 20)
        expect(p.left).toBe(0)
        expect(p.width).toBe(1)
    })

    it('splits an event crossing midnight into two positions', () => {
        const positions = layoutTimeGrid(
            [event('a', '2026-09-09T23:00', '2026-09-10T01:00')],
            range,
            context
        )
        expect(positions).toHaveLength(2)
        expect(positions[0]).toMatchObject({ dayIndex: 2, top: 46 * 20, height: 2 * 20 })
        expect(positions[1]).toMatchObject({ dayIndex: 3, top: 0, height: 2 * 20 })
    })

    it('shares a column cluster only within one day', () => {
        const positions = layoutTimeGrid(
            [
                event('mon-a', '2026-09-07T09:00', '2026-09-07T10:00'),
                event('mon-b', '2026-09-07T09:30', '2026-09-07T10:30'),
                event('tue', '2026-09-08T09:00', '2026-09-08T10:00')
            ],
            range,
            context
        )
        expect(byId(positions, 'mon-a')[0]).toMatchObject({ left: 0, width: 0.5 })
        expect(byId(positions, 'mon-b')[0]).toMatchObject({ left: 0.5, width: 0.5 })
        expect(byId(positions, 'tue')[0]).toMatchObject({ left: 0, width: 1 })
    })

    it('leaves whole-day events to the all-day row', () => {
        const positions = layoutTimeGrid(
            [
                event('allday', '2026-09-09T00:00', '2026-09-10T00:00', { allDay: true }),
                event('long', '2026-09-09T09:00', '2026-09-10T09:00'),
                event('timed', '2026-09-09T09:00', '2026-09-09T10:00')
            ],
            range,
            context
        )
        expect(positions.map((p) => p.event.id)).toEqual(['timed'])
    })

    it('draws background events full width without taking a column', () => {
        const positions = layoutTimeGrid(
            [
                event('lunch', '2026-09-09T12:00', '2026-09-09T13:00', { background: true }),
                event('a', '2026-09-09T12:00', '2026-09-09T13:00'),
                event('b', '2026-09-09T12:30', '2026-09-09T13:30')
            ],
            range,
            context
        )
        expect(byId(positions, 'lunch')[0]).toMatchObject({ left: 0, width: 1, columns: 1 })
        expect(byId(positions, 'a')[0].columns).toBe(2)
        expect(byId(positions, 'b')[0].columns).toBe(2)
    })

    it('places 09:00 on a DST day at the same pixel as on any other day', () => {
        const dst = week('2026-03-08')
        const [p] = layoutTimeGrid(
            [event('a', '2026-03-08T09:00', '2026-03-08T10:00')],
            dst,
            contextFor(dst)
        )
        expect(p.top).toBe(18 * 20)
        expect(p.height).toBe(2 * 20)
    })

    it('draws an event across the skipped hour by its clock times', () => {
        const dst = week('2026-03-08')
        const [p] = layoutTimeGrid(
            [event('a', '2026-03-08T01:30', '2026-03-08T03:30')],
            dst,
            contextFor(dst)
        )
        expect(p.top).toBe(3 * 20)
        expect(p.height).toBe(4 * 20)
    })

    it('extends a segment that crosses midnight to the bottom of its column', () => {
        const positions = layoutTimeGrid(
            [event('a', '2026-09-09T23:00', '2026-09-10T01:00')],
            range,
            context
        )
        expect(positions[0].top + positions[0].height).toBe(context.scale.dayHeight)
    })

    it('clips to the range and keeps the clipped segment times', () => {
        const [p] = layoutTimeGrid(
            [event('a', '2026-09-06T23:00', '2026-09-07T01:00')],
            range,
            context
        )
        expect(p.dayIndex).toBe(0)
        expect(p.segmentStart.toString()).toBe(at('2026-09-07T00:00').toString())
        expect(p.top).toBe(0)
        expect(p.height).toBe(2 * 20)
    })

    it('returns nothing for an empty input', () => {
        expect(layoutTimeGrid([], range, context)).toEqual([])
    })
})
