import { parseZonedDateTime } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { RecurrenceRule } from '../../types/recurrence.types.js'
import { resetWarnings } from '../dev.js'
import { expandSeries, unsupportedFields } from './expand.js'

const ZONE = 'America/New_York'
const at = (iso: string) => parseZonedDateTime(`${iso}[${ZONE}]`)
const iso = (date: { toString(): string }) => date.toString().slice(0, 16)
const series = (
    rule: RecurrenceRule,
    start = '2026-09-07T09:00',
    end = '2026-09-07T10:00'
): SchedulerEvent => ({
    id: 's',
    title: 'Standup',
    start: at(start),
    end: at(end),
    recurrence: rule
})
const range = (start: string, end: string) => ({ start: at(start), end: at(end) })
const options = { weekStartsOn: 1 as const }
const startsOf = (events: SchedulerEvent[]) => events.map((e) => iso(e.start))

afterEach(() => {
    resetWarnings()
    vi.restoreAllMocks()
})

describe('daily', () => {
    it('produces one occurrence per day inside the range', () => {
        const out = expandSeries(
            series({ freq: 'daily' }),
            range('2026-09-07T00:00', '2026-09-10T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-08T09:00', '2026-09-09T09:00'])
    })

    it('honours the interval', () => {
        const out = expandSeries(
            series({ freq: 'daily', interval: 3 }),
            range('2026-09-07T00:00', '2026-09-14T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-10T09:00', '2026-09-13T09:00'])
    })

    it('keeps the clock time across a DST change', () => {
        const out = expandSeries(
            series({ freq: 'daily' }, '2026-03-07T09:00', '2026-03-07T10:00'),
            range('2026-03-07T00:00', '2026-03-10T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-03-07T09:00', '2026-03-08T09:00', '2026-03-09T09:00'])
        expect(out.map((e) => iso(e.end))).toEqual([
            '2026-03-07T10:00',
            '2026-03-08T10:00',
            '2026-03-09T10:00'
        ])
    })

    it('starts inside the range even when the series began long before', () => {
        const out = expandSeries(
            series({ freq: 'daily' }),
            range('2026-09-20T00:00', '2026-09-22T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-20T09:00', '2026-09-21T09:00'])
    })

    it('includes an occurrence that started before the range but still overlaps it', () => {
        const out = expandSeries(
            series({ freq: 'daily' }, '2026-09-07T23:00', '2026-09-08T01:00'),
            range('2026-09-08T00:00', '2026-09-08T12:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T23:00'])
    })
})

describe('bounds', () => {
    it('stops at count, counting the first occurrence', () => {
        const out = expandSeries(
            series({ freq: 'daily', count: 3 }),
            range('2026-09-01T00:00', '2026-10-01T00:00'),
            options
        )
        expect(out).toHaveLength(3)
    })

    it('stops at until, inclusive of an occurrence starting exactly then', () => {
        const out = expandSeries(
            series({ freq: 'daily', until: at('2026-09-09T09:00') }),
            range('2026-09-01T00:00', '2026-10-01T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-08T09:00', '2026-09-09T09:00'])
    })

    it('lets count win over until when both are set', () => {
        const out = expandSeries(
            series({ freq: 'daily', count: 2, until: at('2026-12-31T00:00') }),
            range('2026-09-01T00:00', '2026-10-01T00:00'),
            options
        )
        expect(out).toHaveLength(2)
    })

    it('drops excluded dates without counting them out of the series', () => {
        const out = expandSeries(
            series({ freq: 'daily', count: 3, exDates: [at('2026-09-08T09:00')] }),
            range('2026-09-01T00:00', '2026-10-01T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-09T09:00'])
    })

    it('never runs away on a huge range', () => {
        const out = expandSeries(
            series({ freq: 'daily' }),
            range('2026-01-01T00:00', '2126-01-01T00:00'),
            { ...options, limit: 50 }
        )
        expect(out).toHaveLength(50)
    })

    it('treats a zero or negative interval as one', () => {
        const out = expandSeries(
            series({ freq: 'daily', interval: 0 }),
            range('2026-09-07T00:00', '2026-09-09T00:00'),
            options
        )
        expect(out).toHaveLength(2)
    })
})

describe('series that began long ago', () => {
    it('reaches a range years after a daily start without exhausting the limit', () => {
        const old = series({ freq: 'daily' }, '2020-01-01T09:00', '2020-01-01T10:00')
        const out = expandSeries(old, range('2026-09-07T00:00', '2026-09-14T00:00'), {
            ...options,
            limit: 50
        })
        expect(out).toHaveLength(7)
        expect(iso(out[0].start)).toBe('2026-09-07T09:00')
    })

    it('keeps every weekday of a weekly rule after fast forwarding', () => {
        const old = series(
            { freq: 'weekly', byDay: [1, 3, 5] },
            '2020-01-01T09:00',
            '2020-01-01T10:00'
        )
        const out = expandSeries(old, range('2026-09-07T00:00', '2026-09-14T00:00'), {
            ...options,
            limit: 20
        })
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-09T09:00', '2026-09-11T09:00'])
    })

    it('keeps the interval phase after fast forwarding', () => {
        const old = series({ freq: 'daily', interval: 3 }, '2026-09-01T09:00', '2026-09-01T10:00')
        const out = expandSeries(old, range('2026-09-20T00:00', '2026-09-30T00:00'), {
            ...options,
            limit: 5
        })
        expect(startsOf(out)).toEqual(['2026-09-22T09:00', '2026-09-25T09:00', '2026-09-28T09:00'])
    })

    it('reaches a far range for monthly and yearly rules', () => {
        const monthlyOut = expandSeries(
            series({ freq: 'monthly' }, '2000-01-31T09:00', '2000-01-31T10:00'),
            range('2026-03-01T00:00', '2026-06-01T00:00'),
            { ...options, limit: 10 }
        )
        expect(startsOf(monthlyOut)).toEqual(['2026-03-31T09:00', '2026-05-31T09:00'])
        const yearlyOut = expandSeries(
            series({ freq: 'yearly', interval: 2 }, '2000-09-07T09:00', '2000-09-07T10:00'),
            range('2026-01-01T00:00', '2027-01-01T00:00'),
            { ...options, limit: 3 }
        )
        expect(startsOf(yearlyOut)).toEqual(['2026-09-07T09:00'])
    })

    it('still walks from the start when count bounds the series', () => {
        const old = series({ freq: 'daily', count: 30 }, '2020-01-01T09:00', '2020-01-01T10:00')
        expect(expandSeries(old, range('2026-09-07T00:00', '2026-09-14T00:00'), options)).toEqual(
            []
        )
    })
})

describe('weekly', () => {
    it('repeats on the start weekday when byDay is omitted', () => {
        const out = expandSeries(
            series({ freq: 'weekly' }),
            range('2026-09-01T00:00', '2026-09-30T00:00'),
            options
        )
        expect(startsOf(out)).toEqual([
            '2026-09-07T09:00',
            '2026-09-14T09:00',
            '2026-09-21T09:00',
            '2026-09-28T09:00'
        ])
    })

    it('repeats on every listed weekday, in calendar order', () => {
        const out = expandSeries(
            series({ freq: 'weekly', byDay: [5, 1, 3] }),
            range('2026-09-07T00:00', '2026-09-14T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-09T09:00', '2026-09-11T09:00'])
    })

    it('never yields a weekday earlier than the start in the first week', () => {
        const out = expandSeries(
            series({ freq: 'weekly', byDay: [1, 3] }, '2026-09-09T09:00', '2026-09-09T10:00'),
            range('2026-09-07T00:00', '2026-09-21T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-09T09:00', '2026-09-14T09:00', '2026-09-16T09:00'])
    })

    it('skips weeks by interval, measured from the configured week start', () => {
        const out = expandSeries(
            series(
                { freq: 'weekly', interval: 2, byDay: [0] },
                '2026-09-13T09:00',
                '2026-09-13T10:00'
            ),
            range('2026-09-01T00:00', '2026-10-15T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-13T09:00', '2026-09-27T09:00', '2026-10-11T09:00'])
    })

    it('uses the rule week start over the scheduler one', () => {
        const sunday = expandSeries(
            series(
                { freq: 'weekly', interval: 2, byDay: [0], weekStart: 0 },
                '2026-09-13T09:00',
                '2026-09-13T10:00'
            ),
            range('2026-09-01T00:00', '2026-10-15T00:00'),
            options
        )
        expect(startsOf(sunday)).toEqual([
            '2026-09-13T09:00',
            '2026-09-27T09:00',
            '2026-10-11T09:00'
        ])
    })
})

describe('monthly and yearly', () => {
    it('repeats on the same day of month', () => {
        const out = expandSeries(
            series({ freq: 'monthly' }, '2026-01-15T09:00', '2026-01-15T10:00'),
            range('2026-01-01T00:00', '2026-05-01T00:00'),
            options
        )
        expect(startsOf(out)).toEqual([
            '2026-01-15T09:00',
            '2026-02-15T09:00',
            '2026-03-15T09:00',
            '2026-04-15T09:00'
        ])
    })

    it('skips months that lack the day instead of clamping', () => {
        const out = expandSeries(
            series({ freq: 'monthly' }, '2026-01-31T09:00', '2026-01-31T10:00'),
            range('2026-01-01T00:00', '2026-06-01T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-01-31T09:00', '2026-03-31T09:00', '2026-05-31T09:00'])
    })

    it('repeats yearly and skips February 29 in common years', () => {
        const out = expandSeries(
            series({ freq: 'yearly' }, '2024-02-29T09:00', '2024-02-29T10:00'),
            range('2024-01-01T00:00', '2029-01-01T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2024-02-29T09:00', '2028-02-29T09:00'])
    })

    it('honours a yearly interval', () => {
        const out = expandSeries(
            series({ freq: 'yearly', interval: 2 }, '2026-09-07T09:00', '2026-09-07T10:00'),
            range('2026-01-01T00:00', '2031-01-01T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2028-09-07T09:00', '2030-09-07T09:00'])
    })
})

describe('occurrences', () => {
    it('carry the series id, a unique id, no rule, and are not editable', () => {
        const [first, second] = expandSeries(
            series({ freq: 'daily' }),
            range('2026-09-07T00:00', '2026-09-09T00:00'),
            options
        )
        expect(first.seriesId).toBe('s')
        expect(first.id).not.toBe(second.id)
        expect(first.recurrence).toBeUndefined()
        expect(first.editable).toBe(false)
        expect(first.title).toBe('Standup')
    })

    it('keep a multi-day duration', () => {
        const out = expandSeries(
            series({ freq: 'weekly' }, '2026-09-07T22:00', '2026-09-09T02:00'),
            range('2026-09-14T00:00', '2026-09-21T00:00'),
            options
        )
        expect(iso(out[0].start)).toBe('2026-09-14T22:00')
        expect(iso(out[0].end)).toBe('2026-09-16T02:00')
    })

    it('pass a plain event through untouched', () => {
        const plain: SchedulerEvent = {
            id: 'p',
            title: 'p',
            start: at('2026-09-08T09:00'),
            end: at('2026-09-08T10:00')
        }
        expect(expandSeries(plain, range('2026-09-07T00:00', '2026-09-14T00:00'), options)).toEqual(
            [plain]
        )
        expect(expandSeries(plain, range('2026-10-07T00:00', '2026-10-14T00:00'), options)).toEqual(
            []
        )
    })
})

describe('unsupported fields', () => {
    it('are listed by name', () => {
        expect(unsupportedFields({ freq: 'monthly', byMonthDay: [1], bySetPos: [-1] })).toEqual([
            'bySetPos',
            'byMonthDay'
        ])
        expect(unsupportedFields({ freq: 'weekly', byDay: [{ day: 1, ordinal: -1 }] })).toEqual([
            'byDay ordinals'
        ])
        expect(unsupportedFields({ freq: 'daily' })).toEqual([])
    })

    it('are warned about once per series in development and otherwise ignored', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const rule: RecurrenceRule = { freq: 'monthly', byMonthDay: [1, 15] }
        expandSeries(
            series(rule, '2026-01-15T09:00', '2026-01-15T10:00'),
            range('2026-01-01T00:00', '2026-03-01T00:00'),
            options
        )
        expandSeries(
            series(rule, '2026-01-15T09:00', '2026-01-15T10:00'),
            range('2026-01-01T00:00', '2026-03-01T00:00'),
            options
        )
        expect(warn).toHaveBeenCalledTimes(1)
        expect(warn.mock.calls[0][0]).toContain('byMonthDay')
    })

    it('fall back to the plain weekday when byDay holds only ordinals', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        const out = expandSeries(
            series({ freq: 'weekly', byDay: [{ day: 3, ordinal: 1 }] }),
            range('2026-09-07T00:00', '2026-09-21T00:00'),
            options
        )
        expect(startsOf(out)).toEqual(['2026-09-07T09:00', '2026-09-14T09:00'])
    })
})
