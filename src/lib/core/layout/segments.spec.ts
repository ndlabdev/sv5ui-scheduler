import { describe, expect, it } from 'vitest'
import { parseZonedDateTime, toTimeZone } from '@internationalized/date'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { DateRange } from '../../types/range.types.js'
import { isoDate } from '../time/day-flags.js'
import { eachDay, intersect, splitByDay } from '../time/range.js'
import { event, week } from '../../../tests/fixtures/layout.js'
import { daysWithEvents, isWholeDay, segmentsInRange } from './segments.js'

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

describe('daysWithEvents', () => {
    it('lists every calendar day an event touches inside the range', () => {
        const days = daysWithEvents(
            [
                event('a', '2026-09-09T23:00', '2026-09-10T01:00'),
                event('b', '2026-09-12T09:00', '2026-09-12T10:00'),
                event('outside', '2026-10-01T09:00', '2026-10-01T10:00')
            ],
            range
        )
        expect([...days].sort()).toEqual(['2026-09-09', '2026-09-10', '2026-09-12'])
    })
})

describe('daysWithEvents against splitting every event by day', () => {
    function bySegments(events: SchedulerEvent[], within: DateRange): string[] {
        const found = new Set<string>()
        for (const item of events) {
            const visible = intersect({ start: item.start, end: item.end }, within)
            if (!visible) continue
            for (const segment of splitByDay(visible)) found.add(isoDate(segment.dayStart))
        }
        return [...found].sort()
    }

    function seeded(seed: number) {
        let state = seed
        return (limit: number) => {
            state = (state * 1103515245 + 12345) % 2147483648
            return state % limit
        }
    }

    function randomEvents(zone: string, from: string, count: number, seed = 1): SchedulerEvent[] {
        const next = seeded(seed * 7919 + count + from.length)
        const origin = parseZonedDateTime(`${from}T00:00[${zone}]`)
        return Array.from({ length: count }, (_, i) => {
            const minutes = i % 2 === 0
            const unit = minutes ? 1 : 60
            const start = origin.add({
                minutes: (next((60 * 24 * 50) / unit) - (60 * 24 * 5) / unit) * unit
            })
            const end = start.add({ minutes: (1 + next((60 * 24 * 4) / unit)) * unit })
            return { id: `e${i}`, title: `e${i}`, start, end }
        })
    }

    const cases: Array<[string, string, string, { months?: number; hours?: number }]> = [
        ['America/New_York', '2026-03-01', '2026-03-01', { months: 1 }],
        ['America/New_York', '2026-11-01', '2026-11-01', { months: 1 }],
        ['Australia/Sydney', '2026-04-01', '2026-04-01', { months: 1 }],
        ['Australia/Sydney', '2026-10-01', '2026-10-01', { months: 1 }],
        ['Europe/London', '2026-01-01', '2026-01-01', { months: 12 }],
        ['Asia/Ho_Chi_Minh', '2026-09-07', '2026-09-07', { hours: 24 * 7 + 13 }]
    ]

    it.each(cases)('matches in %s from %s', (zone, from, start, length) => {
        const rangeStart = parseZonedDateTime(`${start}T00:00[${zone}]`).add({
            hours: length.hours ? 5 : 0
        })
        const within = { start: rangeStart, end: rangeStart.add(length) }
        for (let seed = 1; seed <= 20; seed++) {
            const events = randomEvents(zone, from, 60, seed)
            expect([...daysWithEvents(events, within)].sort()).toEqual(bySegments(events, within))
        }
    })

    it('leaves out a day an event only touches at midnight or at the range end', () => {
        const within = week('2026-09-07')
        const events = [
            event('to-midnight', '2026-09-08T20:00', '2026-09-09T00:00'),
            event('from-midnight', '2026-09-11T00:00', '2026-09-11T01:00'),
            event('to-range-end', '2026-09-13T22:00', '2026-09-14T00:00'),
            event('before-range', '2026-09-06T22:00', '2026-09-07T00:00')
        ]
        expect([...daysWithEvents(events, within)].sort()).toEqual([
            '2026-09-08',
            '2026-09-11',
            '2026-09-13'
        ])
        expect([...daysWithEvents(events, within)].sort()).toEqual(bySegments(events, within))
    })

    it('matches for events kept in another time zone', () => {
        const within = week('2026-09-07')
        const events = randomEvents('America/New_York', '2026-09-05', 300).map((item, i) =>
            i % 3 === 0
                ? {
                      ...item,
                      start: toTimeZone(item.start, 'Asia/Tokyo'),
                      end: toTimeZone(item.end, 'Asia/Tokyo')
                  }
                : item
        )
        expect([...daysWithEvents(events, within)].sort()).toEqual(bySegments(events, within))
    })
})
