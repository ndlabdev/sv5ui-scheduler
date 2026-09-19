import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import { applyPatch } from './patch.js'
import { emptyIndex, indexFrom } from './sorted-index.js'

const at = (iso: string) => parseZonedDateTime(`2026-09-12T${iso}[UTC]`)
const event = (id: string, start = '09:00', end = '10:00'): SchedulerEvent => ({
    id,
    title: id,
    start: at(start),
    end: at(end)
})

describe('applyPatch', () => {
    const base = indexFrom([event('a'), event('b', '11:00', '12:00')])

    it('upserts without mutating the input index', () => {
        const next = applyPatch(base, { type: 'upsert', event: event('c', '13:00', '14:00') })
        expect(next.byId.size).toBe(3)
        expect(base.byId.size).toBe(2)
    })

    it('removes by id', () => {
        const next = applyPatch(base, { type: 'remove', eventId: 'a' })
        expect([...next.byId.keys()]).toEqual(['b'])
    })

    it('resets to a new set', () => {
        const next = applyPatch(base, { type: 'reset', events: [event('z')] })
        expect([...next.byId.keys()]).toEqual(['z'])
    })

    it('resets an empty index to an empty index', () => {
        const next = applyPatch(emptyIndex(), { type: 'reset', events: [] })
        expect(next.byId.size).toBe(0)
    })
})
