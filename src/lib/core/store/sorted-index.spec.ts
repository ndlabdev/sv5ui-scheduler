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
const expansion = { weekStartsOn: 1 as const }

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
        expect(ids(queryIndex(index, range, expansion)).sort()).toEqual(
            ['covering', 'overlap-start', 'inside', 'overlap-end'].sort()
        )
    })

    it('excludes events that only touch the boundaries', () => {
        const found = ids(queryIndex(index, range, expansion))
        expect(found).not.toContain('touching-start')
        expect(found).not.toContain('touching-end')
    })

    it('returns results in start order', () => {
        expect(ids(queryIndex(index, range, expansion))).toEqual([
            'covering',
            'overlap-start',
            'inside',
            'overlap-end'
        ])
    })

    it('finds a long event that started well before the range', () => {
        const found = queryIndex(index, createRange(at('13:00'), at('13:30')), expansion)
        expect(ids(found)).toEqual(['covering'])
    })

    it('returns nothing for an empty index or a range with no events', () => {
        expect(queryIndex(emptyIndex(), range, expansion)).toEqual([])
        expect(queryIndex(index, createRange(at('15:00'), at('16:00')), expansion)).toEqual([])
    })
})

describe('recurring series in the index', () => {
    const daily = (id: string): SchedulerEvent => ({
        ...event(id, '09:00', '10:00'),
        recurrence: { freq: 'daily', count: 5 }
    })

    it('keeps a series out of the sorted array but reachable by id', () => {
        const index = indexFrom([event('a', '09:00', '10:00'), daily('s')])
        expect(index.sorted.map((i) => i.event.id)).toEqual(['a'])
        expect(index.series.map((s) => s.id)).toEqual(['s'])
        expect(index.byId.has('s')).toBe(true)
    })

    it('expands the series into the query result, merged in start order', () => {
        const index = indexFrom([event('a', '09:30', '10:30'), daily('s')])
        const day = createRange(at('00:00'), at('23:59'))
        expect(ids(queryIndex(index, day, expansion))).toEqual(['s@2026-09-12T09:00:00.000Z', 'a'])
        const tomorrow = createRange(at('00:00').add({ days: 1 }), at('23:59').add({ days: 1 }))
        expect(ids(queryIndex(index, tomorrow, expansion))).toEqual(['s@2026-09-13T09:00:00.000Z'])
    })

    it('moves an event between the two halves when its rule appears or disappears', () => {
        const base = indexFrom([event('a', '09:00', '10:00')])
        const promoted = upsertIntoIndex(base, daily('a'))
        expect(promoted.sorted).toEqual([])
        expect(promoted.series).toHaveLength(1)
        const demoted = upsertIntoIndex(promoted, event('a', '09:00', '10:00'))
        expect(demoted.series).toEqual([])
        expect(demoted.sorted).toHaveLength(1)
    })

    it('removes a series by id', () => {
        const index = removeFromIndex(indexFrom([daily('s')]), 's')
        expect(index.series).toEqual([])
        expect(index.byId.size).toBe(0)
    })
})
