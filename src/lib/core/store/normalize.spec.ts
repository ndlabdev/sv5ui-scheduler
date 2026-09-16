import { parseZonedDateTime } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { resetWarnings } from '../utils/dev.js'
import { isSameEvent, normalizeEvent, normalizeEvents, sameEventList } from './normalize.js'

afterEach(resetWarnings)

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

describe('zoned inputs', () => {
    const sydney = parseZonedDateTime('2026-03-02T09:00[Australia/Sydney]')

    it('keeps the time zone of a recurring series given as a zoned date', () => {
        const event = normalizeEvent(
            {
                id: 's',
                title: 'Sydney standup',
                start: sydney,
                end: sydney.add({ minutes: 30 }),
                recurrence: { freq: 'weekly', byDay: [1] }
            },
            ZONE
        )
        expect(event.start.timeZone).toBe('Australia/Sydney')
        expect(event.end.timeZone).toBe('Australia/Sydney')
    })

    it('still moves a single event into the display zone', () => {
        const event = normalizeEvent(
            { id: 's', title: 'Call', start: sydney, end: sydney.add({ minutes: 30 }) },
            ZONE
        )
        expect(event.start.timeZone).toBe(ZONE)
    })
})

describe('invalid inputs', () => {
    it('skips an event it cannot read, warns once and keeps the rest', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const events = normalizeEvents(
            [
                { id: 'ok', title: 'ok', start: '2026-09-09T09:00', end: '2026-09-09T10:00' },
                { id: 'bad', title: 'bad', start: 'not a date', end: '2026-09-09T10:00' },
                { id: 'flip', title: 'flip', start: '2026-09-09T10:00', end: '2026-09-09T09:00' }
            ],
            'UTC'
        )
        expect(events.map((event) => event.id)).toEqual(['ok'])
        normalizeEvents(
            [{ id: 'bad', title: 'bad', start: 'not a date', end: '2026-09-09T10:00' }],
            'UTC'
        )
        expect(warn).toHaveBeenCalledTimes(2)
        expect(String(warn.mock.calls[0][0])).toContain('bad')
        warn.mockRestore()
    })
})

describe('recurrence dates of a series that keeps its own zone', () => {
    const start = parseZonedDateTime('2026-03-02T09:00[Australia/Sydney]')

    it('reads naive until and exDates in the zone of the series', () => {
        const event = normalizeEvent(
            {
                id: 'standup',
                title: 'Standup',
                start,
                end: start.add({ hours: 1 }),
                recurrence: {
                    freq: 'weekly',
                    until: '2026-03-30T09:00',
                    exDates: ['2026-03-09T09:00']
                }
            },
            'America/New_York'
        )
        expect(event.recurrence?.exDates?.[0].timeZone).toBe('Australia/Sydney')
        expect(event.recurrence?.exDates?.[0].hour).toBe(9)
        expect(event.recurrence?.until?.timeZone).toBe('Australia/Sydney')
        expect(event.recurrence?.until?.hour).toBe(9)
    })

    it('reads them in the calendar zone when the series start is a string', () => {
        const event = normalizeEvent(
            {
                id: 'standup',
                title: 'Standup',
                start: '2026-03-02T09:00',
                end: '2026-03-02T10:00',
                recurrence: { freq: 'weekly', exDates: ['2026-03-09T09:00'] }
            },
            'America/New_York'
        )
        expect(event.recurrence?.exDates?.[0].timeZone).toBe('America/New_York')
    })
})
