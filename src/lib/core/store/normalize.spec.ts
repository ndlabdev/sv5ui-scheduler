import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { isSameEvent, normalizeEvent, normalizeEvents, sameEventList } from './normalize.js'

const ZONE = 'Asia/Ho_Chi_Minh'

describe('normalizeEvent', () => {
    it('turns ISO strings into zoned times and keeps every other field', () => {
        const event = normalizeEvent(
            {
                id: 'a',
                title: 'Standup',
                start: '2026-09-12T09:00',
                end: '2026-09-12T09:30',
                allDay: false,
                color: 'success',
                data: { room: 'B' }
            },
            ZONE
        )
        expect(event.start.toString()).toBe('2026-09-12T09:00:00+07:00[Asia/Ho_Chi_Minh]')
        expect(event.end.toString()).toBe('2026-09-12T09:30:00+07:00[Asia/Ho_Chi_Minh]')
        expect(event.color).toBe('success')
        expect(event.data).toEqual({ room: 'B' })
        expect('recurrence' in event).toBe(false)
    })

    it('keeps zoned input as is', () => {
        const start = parseZonedDateTime('2026-09-12T09:00[Asia/Ho_Chi_Minh]')
        const event = normalizeEvent(
            { id: 'a', title: 'x', start, end: start.add({ hours: 1 }) },
            ZONE
        )
        expect(event.start).toBe(start)
    })

    it('normalises recurrence dates too', () => {
        const event = normalizeEvent(
            {
                id: 'a',
                title: 'x',
                start: '2026-09-12T09:00',
                end: '2026-09-12T10:00',
                recurrence: {
                    freq: 'weekly',
                    until: '2026-12-31T00:00',
                    exDates: ['2026-09-19T09:00'],
                    byDay: [6]
                }
            },
            ZONE
        )
        expect(event.recurrence?.until?.toString()).toBe(
            '2026-12-31T00:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
        expect(event.recurrence?.exDates?.[0].day).toBe(19)
        expect(event.recurrence?.byDay).toEqual([6])
    })

    it('rejects an event that does not end after it starts', () => {
        expect(() =>
            normalizeEvent(
                { id: 'a', title: 'x', start: '2026-09-12T09:00', end: '2026-09-12T09:00' },
                ZONE
            )
        ).toThrow(RangeError)
    })

    it('normalises a list', () => {
        const events = normalizeEvents(
            [
                { id: 'a', title: 'a', start: '2026-09-12T09:00', end: '2026-09-12T10:00' },
                { id: 'b', title: 'b', start: '2026-09-12', end: '2026-09-13' }
            ],
            ZONE
        )
        expect(events.map((e) => e.id)).toEqual(['a', 'b'])
        expect(events[1].start.hour).toBe(0)
    })
})

describe('isSameEvent', () => {
    const base = normalizeEvent(
        { id: 'a', title: 'x', start: '2026-09-12T09:00', end: '2026-09-12T10:00', data: { n: 1 } },
        ZONE
    )

    it('compares by instant, not by zone', () => {
        const inUtc = normalizeEvent(
            { id: 'a', title: 'x', start: '2026-09-12T02:00', end: '2026-09-12T03:00' },
            'UTC'
        )
        expect(isSameEvent(base, inUtc)).toBe(true)
    })

    it('ignores the data payload', () => {
        expect(isSameEvent(base, { ...base, data: { n: 2 } })).toBe(true)
    })

    it('detects a changed time, title or flag', () => {
        expect(isSameEvent(base, { ...base, end: base.end.add({ minutes: 1 }) })).toBe(false)
        expect(isSameEvent(base, { ...base, title: 'y' })).toBe(false)
        expect(isSameEvent(base, { ...base, allDay: true })).toBe(false)
        expect(isSameEvent(base, { ...base, id: 'b' })).toBe(false)
    })
})

describe('sameEventList', () => {
    const zoned = normalizeEvents(
        [
            { id: 'a', title: 'A', start: '2026-09-09T09:00', end: '2026-09-09T10:00' },
            { id: 'b', title: 'B', start: '2026-09-10T09:00', end: '2026-09-10T10:00' }
        ],
        'UTC'
    )

    it('matches the same events in any order', () => {
        expect(sameEventList(zoned, [...zoned].reverse())).toBe(true)
    })

    it('differs on length, on a changed field, and on a new data object', () => {
        expect(sameEventList(zoned, zoned.slice(1))).toBe(false)
        expect(sameEventList(zoned, [{ ...zoned[0], title: 'Changed' }, zoned[1]])).toBe(false)
        expect(sameEventList(zoned, [{ ...zoned[0], data: {} }, zoned[1]])).toBe(false)
    })
})
