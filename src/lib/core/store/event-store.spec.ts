import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { StoreMiddleware } from '../../types/extension.types.js'
import { createRange } from '../time/range.js'
import { EventStore } from './event-store.svelte.js'

const at = (iso: string) => parseZonedDateTime(`2026-09-12T${iso}[UTC]`)
const event = (id: string, start = '09:00', end = '10:00'): SchedulerEvent => ({
    id,
    title: id,
    start: at(start),
    end: at(end)
})

describe('EventStore', () => {
    it('starts empty at version 0', () => {
        const store = new EventStore()
        expect(store.size).toBe(0)
        expect(store.version).toBe(0)
        expect(store.all()).toEqual([])
    })

    it('bumps the version once per effective patch', () => {
        const store = new EventStore()
        store.apply({ type: 'upsert', event: event('a') })
        store.apply({ type: 'upsert', event: event('b') })
        expect(store.version).toBe(2)
        expect(store.size).toBe(2)
    })

    it('does not bump the version for a patch that changes nothing', () => {
        const store = new EventStore()
        store.apply({ type: 'remove', eventId: 'missing' })
        expect(store.version).toBe(0)
    })

    it('reads by id and by range', () => {
        const store = new EventStore()
        store.apply({ type: 'upsert', event: event('a', '09:00', '10:00') })
        store.apply({ type: 'upsert', event: event('b', '14:00', '15:00') })
        expect(store.get('a')?.title).toBe('a')
        expect(store.has('zzz')).toBe(false)
        expect(store.query(createRange(at('08:00'), at('12:00'))).map((e) => e.id)).toEqual(['a'])
    })

    it('restores a snapshot and bumps the version so readers refresh', () => {
        const store = new EventStore()
        store.apply({ type: 'upsert', event: event('a') })
        const snapshot = store.snapshot()
        store.apply({ type: 'upsert', event: event('b') })
        store.apply({ type: 'remove', eventId: 'a' })
        expect(store.all().map((e) => e.id)).toEqual(['b'])

        store.restore(snapshot)
        expect(store.all().map((e) => e.id)).toEqual(['a'])
        expect(store.version).toBe(4)
    })

    it('leaves a snapshot untouched by later patches', () => {
        const store = new EventStore()
        store.apply({ type: 'upsert', event: event('a') })
        const snapshot = store.snapshot()
        store.apply({ type: 'remove', eventId: 'a' })
        expect(snapshot.index.byId.has('a')).toBe(true)
    })

    it('routes every patch through the middleware chain', () => {
        const seen = vi.fn()
        const observe: StoreMiddleware = (next) => (patch) => {
            seen(patch.type)
            next(patch)
        }
        const blockRemoves: StoreMiddleware = (next) => (patch) => {
            if (patch.type !== 'remove') next(patch)
        }
        const store = new EventStore([observe, blockRemoves])
        store.apply({ type: 'upsert', event: event('a') })
        store.apply({ type: 'remove', eventId: 'a' })
        expect(seen.mock.calls.map(([type]) => type)).toEqual(['upsert', 'remove'])
        expect(store.has('a')).toBe(true)
    })
})
