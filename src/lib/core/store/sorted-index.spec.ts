import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import { createRange } from '../time/range.js'
import {
    emptyIndex,
    indexFrom,
    queryIndex,
    removeFromIndex,
    upsertIntoIndex
} from './sorted-index.js'

const at = (iso: string) => parseZonedDateTime(`2026-09-12T${iso}[UTC]`)
const event = (id: string, start: string, end: string): SchedulerEvent => ({
    id,
    title: id,
    start: at(start),
    end: at(end)
})
const ids = (events: SchedulerEvent[]) => events.map((e) => e.id)

describe('emptyIndex', () => {
    it('has nothing in it', () => {
        const index = emptyIndex()
        expect(index.byId.size).toBe(0)
        expect(index.sorted).toEqual([])
        expect(index.maxDurationMs).toBe(0)
    })
})

describe('indexFrom', () => {
    it('sorts by start, then by id for a stable order', () => {
        const index = indexFrom([
            event('c', '10:00', '11:00'),
            event('a', '09:00', '10:00'),
            event('b', '10:00', '12:00')
        ])
        expect(index.sorted.map((i) => i.event.id)).toEqual(['a', 'b', 'c'])
    })

    it('keeps the last event when ids repeat', () => {
        const index = indexFrom([event('a', '09:00', '10:00'), event('a', '11:00', '12:00')])
        expect(index.byId.size).toBe(1)
        expect(index.byId.get('a')?.start.hour).toBe(11)
    })

    it('tracks the longest duration', () => {
        const index = indexFrom([event('a', '09:00', '10:00'), event('b', '09:00', '12:00')])
        expect(index.maxDurationMs).toBe(3 * 3600000)
    })
})

describe('upsertIntoIndex', () => {
    const base = indexFrom([event('a', '09:00', '10:00'), event('c', '11:00', '12:00')])

    it('inserts a new event in sorted position without touching the original', () => {
        const next = upsertIntoIndex(base, event('b', '10:00', '11:00'))
        expect(next.sorted.map((i) => i.event.id)).toEqual(['a', 'b', 'c'])
        expect(base.sorted.map((i) => i.event.id)).toEqual(['a', 'c'])
        expect(base.byId.has('b')).toBe(false)
    })

    it('moves an existing event when its start changes', () => {
        const next = upsertIntoIndex(base, event('a', '13:00', '14:00'))
        expect(next.sorted.map((i) => i.event.id)).toEqual(['c', 'a'])
        expect(next.byId.size).toBe(2)
    })

    it('grows the longest duration', () => {
        const next = upsertIntoIndex(base, event('long', '00:00', '23:00'))
        expect(next.maxDurationMs).toBe(23 * 3600000)
    })

    it('shrinks the longest duration when the longest event gets shorter', () => {
        const grown = upsertIntoIndex(base, event('long', '00:00', '23:00'))
        const shrunk = upsertIntoIndex(grown, event('long', '00:00', '00:30'))
        expect(shrunk.maxDurationMs).toBe(3600000)
    })
})

describe('removeFromIndex', () => {
    const base = indexFrom([event('a', '09:00', '10:00'), event('long', '00:00', '23:00')])

    it('drops the event and recomputes the longest duration', () => {
        const next = removeFromIndex(base, 'long')
        expect(next.byId.has('long')).toBe(false)
        expect(next.sorted.map((i) => i.event.id)).toEqual(['a'])
        expect(next.maxDurationMs).toBe(3600000)
    })

    it('returns the same index when the id is unknown', () => {
        expect(removeFromIndex(base, 'nope')).toBe(base)
    })
})

describe('queryIndex', () => {
    const index = indexFrom([
        event('before', '07:00', '08:00'),
        event('touching-start', '08:00', '09:00'),
        event('overlap-start', '08:30', '09:30'),
        event('inside', '09:30', '10:30'),
        event('overlap-end', '10:30', '11:30'),
        event('touching-end', '11:00', '12:00'),
        event('after', '12:00', '13:00'),
        event('covering', '06:00', '14:00')
    ])
    const range = createRange(at('09:00'), at('11:00'))

    it('returns every event overlapping the range, end exclusive', () => {
        expect(ids(queryIndex(index, range)).sort()).toEqual(
            ['covering', 'overlap-start', 'inside', 'overlap-end'].sort()
        )
    })

    it('excludes events that only touch the boundaries', () => {
        const found = ids(queryIndex(index, range))
        expect(found).not.toContain('touching-start')
        expect(found).not.toContain('touching-end')
    })

    it('returns results in start order', () => {
        expect(ids(queryIndex(index, range))).toEqual([
            'covering',
            'overlap-start',
            'inside',
            'overlap-end'
        ])
    })

    it('finds a long event that started well before the range', () => {
        const found = queryIndex(index, createRange(at('13:00'), at('13:30')))
        expect(ids(found)).toEqual(['covering'])
    })

    it('returns nothing for an empty index or a range with no events', () => {
        expect(queryIndex(emptyIndex(), range)).toEqual([])
        expect(queryIndex(index, createRange(at('15:00'), at('16:00')))).toEqual([])
    })
})
