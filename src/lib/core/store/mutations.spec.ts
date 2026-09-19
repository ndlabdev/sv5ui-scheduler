import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { Mutation, MutationHandlers } from '../../types/mutation.types.js'
import { EventStore } from './event-store.svelte.js'
import { MutationPipeline, type MutationRequest } from './mutations.svelte.js'

const ZONE = 'UTC'
const at = (iso: string) => parseZonedDateTime(`2026-09-12T${iso}[UTC]`)
const event = (id: string, start = '09:00', end = '10:00', title = id): SchedulerEvent => ({
    id,
    title,
    start: at(start),
    end: at(end)
})

interface Deferred<T> {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (reason: unknown) => void
}

function deferred<T>(): Deferred<T> {
    let resolve!: (value: T) => void
    let reject!: (reason: unknown) => void
    const promise = new Promise<T>((res, rej) => {
        resolve = res
        reject = rej
    })
    return { promise, resolve, reject }
}

const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

function setup(handlers: MutationHandlers = {}) {
    const store = new EventStore()
    const seenOnRevert: (SchedulerEvent | undefined)[] = []
    const seenOnKeepServer: (SchedulerEvent | undefined)[] = []
    const willRevert = vi.fn((mutation: Mutation) => {
        seenOnRevert.push(store.get(mutation.eventId))
    })
    const willKeepServer = vi.fn((mutation: Mutation) => {
        seenOnKeepServer.push(store.get(mutation.eventId))
    })
    const pipeline = new MutationPipeline({
        store,
        timeZone: () => ZONE,
        handlers: () => handlers,
        willRevert,
        willKeepServer
    })
    return { store, pipeline, willRevert, willKeepServer, seenOnRevert, seenOnKeepServer }
}

const create = (after: SchedulerEvent): MutationRequest => ({
    kind: 'create',
    eventId: after.id,
    before: null,
    after
})
const move = (before: SchedulerEvent, after: SchedulerEvent): MutationRequest => ({
    kind: 'move',
    eventId: before.id,
    before,
    after
})
const remove = (before: SchedulerEvent): MutationRequest => ({
    kind: 'delete',
    eventId: before.id,
    before,
    after: null
})

describe('without a persistence handler', () => {
    it('commits immediately and never marks the event pending', async () => {
        const { store, pipeline } = setup()
        const outcome = await pipeline.commit(create(event('a')))
        expect(outcome).toBe('committed')
        expect(store.has('a')).toBe(true)
        expect(pipeline.pending.size).toBe(0)
    })
})

describe('optimistic application', () => {
    it('shows the change before the handler resolves', async () => {
        const gate = deferred<void>()
        const { store, pipeline } = setup({ onMutate: () => gate.promise })
        const moved = event('a', '11:00', '12:00')
        const outcome = pipeline.commit(move(event('a'), moved))

        expect(store.get('a')?.start.hour).toBe(11)
        expect(pipeline.isPending('a')).toBe(true)

        gate.resolve()
        expect(await outcome).toBe('committed')
        expect(pipeline.isPending('a')).toBe(false)
    })

    it('removes an event optimistically on delete', async () => {
        const gate = deferred<void>()
        const { store, pipeline } = setup({ onMutate: () => gate.promise })
        store.apply({ type: 'upsert', event: event('a') })
        const outcome = pipeline.commit(remove(event('a')))
        expect(store.has('a')).toBe(false)
        gate.resolve()
        await outcome
        expect(store.has('a')).toBe(false)
    })

    it('assigns a distinct id to every mutation', async () => {
        const seen: string[] = []
        const { pipeline } = setup({ onMutate: (m) => void seen.push(m.id) })
        await pipeline.commit(create(event('a')))
        await pipeline.commit(create(event('b')))
        expect(new Set(seen).size).toBe(2)
    })
})

describe('rollback', () => {
    it('restores the previous state when the handler throws', async () => {
        const onError = vi.fn()
        const { store, pipeline, willRevert, seenOnRevert } = setup({
            onMutate: () => {
                throw new Error('offline')
            },
            onError
        })
        const before = event('a', '09:00', '10:00')
        store.apply({ type: 'upsert', event: before })

        const outcome = await pipeline.commit(move(before, event('a', '11:00', '12:00')))

        expect(outcome).toBe('reverted')
        expect(store.get('a')?.start.hour).toBe(9)
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'move' }),
            expect.any(Error)
        )
        expect(willRevert).toHaveBeenCalledTimes(1)
        expect(willRevert).toHaveBeenCalledWith(expect.objectContaining({ eventId: 'a' }))
        expect(seenOnRevert.map((e) => e?.start.hour)).toEqual([11])
        expect(pipeline.isPending('a')).toBe(false)
    })

    it('restores the previous state when the handler rejects', async () => {
        const { store, pipeline } = setup({ onMutate: () => Promise.reject(new Error('500')) })
        store.apply({ type: 'upsert', event: event('a', '09:00', '10:00') })
        await pipeline.commit(move(event('a'), event('a', '11:00', '12:00')))
        expect(store.get('a')?.start.hour).toBe(9)
    })

    it('removes a created event that failed to persist', async () => {
        const { store, pipeline, seenOnRevert } = setup({
            onMutate: () => Promise.reject(new Error('nope'))
        })
        await pipeline.commit(create(event('a')))
        expect(store.has('a')).toBe(false)
        expect(seenOnRevert.map((e) => e?.id)).toEqual(['a'])
    })

    it('brings back a deleted event that failed to persist', async () => {
        const { store, pipeline } = setup({ onMutate: () => Promise.reject(new Error('nope')) })
        store.apply({ type: 'upsert', event: event('a') })
        await pipeline.commit(remove(event('a')))
        expect(store.has('a')).toBe(true)
    })

    it('drops queued mutations of the same event and lands on the failed one’s before', async () => {
        const first = deferred<void>()
        const calls: string[] = []
        const { store, pipeline } = setup({
            onMutate: (m) => {
                calls.push(m.id)
                return calls.length === 1 ? first.promise : undefined
            }
        })
        const s0 = event('a', '09:00', '10:00')
        const s1 = event('a', '10:00', '11:00')
        const s2 = event('a', '11:00', '12:00')
        const s3 = event('a', '12:00', '13:00')
        store.apply({ type: 'upsert', event: s0 })

        const m1 = pipeline.commit(move(s0, s1))
        const m2 = pipeline.commit(move(s1, s2))
        const m3 = pipeline.commit(move(s2, s3))
        await tick()
        expect(store.get('a')?.start.hour).toBe(12)
        expect(calls).toHaveLength(1)

        first.reject(new Error('conflict'))

        expect(await m1).toBe('reverted')
        expect(await m2).toBe('skipped')
        expect(await m3).toBe('skipped')
        expect(calls).toHaveLength(1)
        expect(store.get('a')?.start.hour).toBe(9)
        expect(pipeline.isPending('a')).toBe(false)
    })

    it('leaves other events alone when one rolls back', async () => {
        const { store, pipeline } = setup({
            onMutate: (m) => (m.eventId === 'bad' ? Promise.reject(new Error('x')) : undefined)
        })
        store.apply({ type: 'upsert', event: event('bad', '09:00', '10:00') })
        store.apply({ type: 'upsert', event: event('good', '09:00', '10:00') })

        await Promise.all([
            pipeline.commit(move(event('bad'), event('bad', '11:00', '12:00'))),
            pipeline.commit(move(event('good'), event('good', '13:00', '14:00')))
        ])

        expect(store.get('bad')?.start.hour).toBe(9)
        expect(store.get('good')?.start.hour).toBe(13)
    })

    it('reverts and reports when the handler answers with an event that cannot be read', async () => {
        const onError = vi.fn()
        const { store, pipeline, willRevert } = setup({
            onMutate: async () => ({
                id: 'srv-1',
                title: 'a',
                start: '2026-09-12T10:00',
                end: '2026-09-12T09:00'
            }),
            onError
        })

        const outcome = await pipeline.commit(create(event('a')))

        expect(outcome).toBe('reverted')
        expect(store.has('a')).toBe(false)
        expect(store.has('srv-1')).toBe(false)
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'create' }),
            expect.any(RangeError)
        )
        expect(willRevert).toHaveBeenCalledTimes(1)
        expect(pipeline.pending.size).toBe(0)
    })

    it('reverts and reports when the conflict handler throws', async () => {
        const onError = vi.fn()
        const before = event('a', '09:00', '10:00')
        const { store, pipeline } = setup({
            onMutate: async () => event('a', '13:00', '14:00'),
            onConflict: () => {
                throw new Error('undecided')
            },
            onError
        })
        store.apply({ type: 'upsert', event: before })

        const outcome = await pipeline.commit(move(before, event('a', '11:00', '12:00')))

        expect(outcome).toBe('reverted')
        expect(store.get('a')?.start.hour).toBe(9)
        expect(onError).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'move' }),
            expect.any(Error)
        )
    })
})

describe('queueing', () => {
    it('persists mutations of one event strictly in order', async () => {
        const gates = [deferred<void>(), deferred<void>()]
        const started: string[] = []
        const { pipeline } = setup({
            onMutate: (m) => {
                started.push(m.id)
                return gates[started.length - 1]?.promise
            }
        })
        const a = pipeline.commit(move(event('a'), event('a', '11:00', '12:00')))
        const b = pipeline.commit(move(event('a', '11:00', '12:00'), event('a', '13:00', '14:00')))
        await tick()
        expect(started).toEqual(['m1'])

        gates[0].resolve()
        await a
        await tick()
        expect(started).toEqual(['m1', 'm2'])

        gates[1].resolve()
        expect(await b).toBe('committed')
    })

    it('persists mutations of different events concurrently', async () => {
        const gate = deferred<void>()
        const started: string[] = []
        const { pipeline } = setup({
            onMutate: (m) => {
                started.push(m.eventId)
                return gate.promise
            }
        })
        const a = pipeline.commit(move(event('a'), event('a', '11:00', '12:00')))
        const b = pipeline.commit(move(event('b'), event('b', '11:00', '12:00')))
        await tick()
        expect(started).toEqual(['a', 'b'])
        expect([...pipeline.pending].sort()).toEqual(['a', 'b'])

        gate.resolve()
        await Promise.all([a, b])
        expect(pipeline.pending.size).toBe(0)
    })

    it('keeps the event pending until its last queued mutation settles', async () => {
        const gates = [deferred<void>(), deferred<void>()]
        let call = 0
        const { pipeline } = setup({ onMutate: () => gates[call++].promise })
        const a = pipeline.commit(move(event('a'), event('a', '11:00', '12:00')))
        const b = pipeline.commit(move(event('a', '11:00', '12:00'), event('a', '13:00', '14:00')))

        gates[0].resolve()
        await a
        expect(pipeline.isPending('a')).toBe(true)

        gates[1].resolve()
        await b
        expect(pipeline.isPending('a')).toBe(false)
    })
})

describe('conflict detection', () => {
    const before = event('a', '09:00', '10:00')
    const after = event('a', '11:00', '12:00')

    it('commits when the server echoes the same event', async () => {
        const { store, pipeline, willKeepServer } = setup({
            onMutate: (m) => ({ ...(m.after as SchedulerEvent), data: { server: true } })
        })
        expect(await pipeline.commit(move(before, after))).toBe('committed')
        expect(store.get('a')?.start.hour).toBe(11)
        expect(willKeepServer).not.toHaveBeenCalled()
    })

    it('takes the server version by default', async () => {
        const server = { id: 'a', title: 'a', start: '2026-09-12T11:30', end: '2026-09-12T12:30' }
        const { store, pipeline, willKeepServer, seenOnKeepServer } = setup({
            onMutate: () => server
        })
        expect(await pipeline.commit(move(before, after))).toBe('kept-server')
        expect(store.get('a')?.start.minute).toBe(30)
        expect(willKeepServer).toHaveBeenCalledWith(
            expect.objectContaining({ eventId: 'a' }),
            expect.objectContaining({ id: 'a' })
        )
        expect(seenOnKeepServer.map((e) => e?.start.minute)).toEqual([0])
    })

    it('asks onConflict and keeps the local version when told to', async () => {
        const server = { id: 'a', title: 'a', start: '2026-09-12T11:30', end: '2026-09-12T12:30' }
        const onConflict = vi.fn<MutationHandlers['onConflict'] & object>(() => 'keep-local')
        const { store, pipeline, willKeepServer } = setup({ onMutate: () => server, onConflict })
        expect(await pipeline.commit(move(before, after))).toBe('kept-local')
        expect(store.get('a')?.start.minute).toBe(0)
        expect(willKeepServer).not.toHaveBeenCalled()
        expect(onConflict).toHaveBeenCalledWith(
            expect.objectContaining({ eventId: 'a' }),
            expect.objectContaining({ id: 'a' })
        )
    })

    it('ignores a returned event for a delete', async () => {
        const { store, pipeline } = setup({ onMutate: (m) => m.before ?? undefined })
        store.apply({ type: 'upsert', event: before })
        expect(await pipeline.commit(remove(before))).toBe('committed')
        expect(store.has('a')).toBe(false)
    })
})

describe('handlers are read per mutation', () => {
    it('picks up a handler that changed after construction', async () => {
        let handlers: MutationHandlers = {}
        const store = new EventStore()
        const pipeline = new MutationPipeline({
            store,
            timeZone: () => ZONE,
            handlers: () => handlers
        })
        expect(await pipeline.commit(create(event('a')))).toBe('committed')

        const seen: Mutation[] = []
        handlers = { onMutate: (m) => void seen.push(m) }
        await pipeline.commit(create(event('b')))
        expect(seen.map((m) => m.eventId)).toEqual(['b'])
    })
})

describe('answers from the server', () => {
    it('adopts the id the server assigns and drops the client id', async () => {
        const { store, pipeline } = setup({
            onMutate: async (mutation) => ({ ...mutation.after!, id: 'srv-1' })
        })
        const outcome = await pipeline.commit(create(event('tmp-1')))
        expect(outcome).toBe('committed')
        expect(store.has('tmp-1')).toBe(false)
        expect(store.get('srv-1')?.title).toBe('tmp-1')
        expect(store.size).toBe(1)
    })

    it('keeps the confirmed state when the store was reset while the save was in flight', async () => {
        const gate = deferred<void>()
        const before = event('a')
        const after = event('a', '11:00', '12:00')
        const { store, pipeline } = setup({ onMutate: () => gate.promise })
        store.apply({ type: 'reset', events: [before] })
        const outcome = pipeline.commit(move(before, after))
        await tick()
        store.apply({ type: 'reset', events: [before] })
        expect(store.get('a')?.start.hour).toBe(9)
        gate.resolve()
        expect(await outcome).toBe('committed')
        expect(store.get('a')?.start.hour).toBe(11)
    })

    it('removes a deleted event again when a refetch brought it back meanwhile', async () => {
        const gate = deferred<void>()
        const { store, pipeline } = setup({ onMutate: () => gate.promise })
        store.apply({ type: 'reset', events: [event('a')] })
        const outcome = pipeline.commit(remove(event('a')))
        await tick()
        store.apply({ type: 'reset', events: [event('a')] })
        gate.resolve()
        await outcome
        expect(store.has('a')).toBe(false)
    })

    it('leaves the store to a later queued change of the same event', async () => {
        const first = deferred<void>()
        const second = deferred<void>()
        const gates = [first, second]
        const s0 = event('a')
        const s1 = event('a', '11:00', '12:00')
        const s2 = event('a', '13:00', '14:00')
        const { store, pipeline } = setup({ onMutate: () => gates.shift()!.promise })
        store.apply({ type: 'reset', events: [s0] })
        const m1 = pipeline.commit(move(s0, s1))
        const m2 = pipeline.commit(move(s1, s2))
        await tick()
        expect(store.get('a')?.start.hour).toBe(13)
        first.resolve()
        await m1
        expect(store.get('a')?.start.hour).toBe(13)
        second.resolve()
        await m2
        expect(store.get('a')?.start.hour).toBe(13)
    })
})
