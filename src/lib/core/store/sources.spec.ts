import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import type { EventInput } from '../../types/event.types.js'
import type { EventSourceFn, LoadContext } from '../../types/source.types.js'
import { createRange } from '../time/range.js'
import { createSourceLoader } from './sources.js'

const ZONE = 'UTC'
const at = (iso: string) => parseZonedDateTime(`${iso}[UTC]`)
const week = createRange(at('2026-09-07T00:00'), at('2026-09-14T00:00'))
const nextWeek = createRange(at('2026-09-14T00:00'), at('2026-09-21T00:00'))
const input = (id: string): EventInput => ({
    id,
    title: id,
    start: '2026-09-08T09:00',
    end: '2026-09-08T10:00'
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

describe('array source', () => {
    it('normalises once and returns the same events for any range', async () => {
        const loader = createSourceLoader([input('a'), input('b')], ZONE)
        const first = await loader.load(week)
        const second = await loader.load(nextWeek)
        expect(first.status).toBe('loaded')
        if (first.status !== 'loaded' || second.status !== 'loaded') throw new Error('unreachable')
        expect(first.events.map((e) => e.id)).toEqual(['a', 'b'])
        expect(first.events[0].start.timeZone).toBe('UTC')
        expect(second.events).toBe(first.events)
    })

    it('normalises again after invalidate', async () => {
        const loader = createSourceLoader([input('a')], ZONE)
        const first = await loader.load(week)
        loader.invalidate()
        const second = await loader.load(week)
        expect(second).not.toBe(first)
    })
})

describe('function source', () => {
    it('calls the function with the range, zone and a signal', async () => {
        const fetch = vi.fn<EventSourceFn>(async () => [input('a')])
        const loader = createSourceLoader(fetch, ZONE)
        const result = await loader.load(week)
        expect(result).toMatchObject({ status: 'loaded' })
        const context = fetch.mock.calls[0][0]
        expect(context.range).toEqual(week)
        expect(context.timeZone).toBe('UTC')
        expect(context.signal.aborted).toBe(false)
    })

    it('accepts a synchronous return value', async () => {
        const loader = createSourceLoader(() => [input('a')], ZONE)
        expect(await loader.load(week)).toMatchObject({ status: 'loaded' })
    })

    it('serves a repeated range from cache without calling again', async () => {
        const fetch = vi.fn<EventSourceFn>(async () => [input('a')])
        const loader = createSourceLoader(fetch, ZONE)
        await loader.load(week)
        await loader.load(nextWeek)
        await loader.load(week)
        expect(fetch).toHaveBeenCalledTimes(2)
    })

    it('shares one in-flight request for concurrent loads of the same range', async () => {
        const gate = deferred<EventInput[]>()
        const fetch = vi.fn<EventSourceFn>(() => gate.promise)
        const loader = createSourceLoader(fetch, ZONE)
        const a = loader.load(week)
        const b = loader.load(week)
        expect(fetch).toHaveBeenCalledTimes(1)
        gate.resolve([input('a')])
        expect(await a).toMatchObject({ status: 'loaded' })
        expect(await b).toMatchObject({ status: 'loaded' })
    })

    it('aborts the previous request when the range changes', async () => {
        const first = deferred<EventInput[]>()
        const contexts: LoadContext[] = []
        const fetch: EventSourceFn = (context) => {
            contexts.push(context)
            return contexts.length === 1 ? first.promise : [input('b')]
        }
        const loader = createSourceLoader(fetch, ZONE)
        const stale = loader.load(week)
        const fresh = loader.load(nextWeek)

        expect(contexts[0].signal.aborted).toBe(true)
        expect(await fresh).toMatchObject({ status: 'loaded' })

        first.resolve([input('a')])
        expect(await stale).toEqual({ status: 'superseded' })
    })

    it('reports a superseded request even when it rejects after being aborted', async () => {
        const first = deferred<EventInput[]>()
        let calls = 0
        const loader = createSourceLoader(() => (calls++ === 0 ? first.promise : []), ZONE)
        const stale = loader.load(week)
        await loader.load(nextWeek)
        first.reject(new Error('aborted by fetch'))
        expect(await stale).toEqual({ status: 'superseded' })
    })

    it('turns a synchronous throw into a rejection', async () => {
        const loader = createSourceLoader(() => {
            throw new Error('bad config')
        }, ZONE)
        await expect(loader.load(week)).rejects.toThrow('bad config')
    })

    it('propagates a failure of the current request', async () => {
        const loader = createSourceLoader(() => Promise.reject(new Error('502')), ZONE)
        await expect(loader.load(week)).rejects.toThrow('502')
    })

    it('does not cache a failed request', async () => {
        let calls = 0
        const loader = createSourceLoader(() => {
            calls += 1
            return calls === 1 ? Promise.reject(new Error('502')) : [input('a')]
        }, ZONE)
        await expect(loader.load(week)).rejects.toThrow()
        expect(await loader.load(week)).toMatchObject({ status: 'loaded' })
        expect(calls).toBe(2)
    })

    it('forgets the cache and aborts in-flight work on invalidate', async () => {
        const gate = deferred<EventInput[]>()
        const contexts: LoadContext[] = []
        const fetch: EventSourceFn = (context) => {
            contexts.push(context)
            return contexts.length === 1 ? gate.promise : [input('b')]
        }
        const loader = createSourceLoader(fetch, ZONE)
        const stale = loader.load(week)
        loader.invalidate()
        expect(contexts[0].signal.aborted).toBe(true)
        gate.resolve([input('a')])
        expect(await stale).toEqual({ status: 'superseded' })
        expect(await loader.load(week)).toMatchObject({ status: 'loaded' })
        expect(contexts).toHaveLength(2)
    })
})

describe('coverage based cache', () => {
    const day = createRange(at('2026-09-09T00:00'), at('2026-09-10T00:00'))
    const rangesOf = (fetch: ReturnType<typeof vi.fn<EventSourceFn>>) =>
        fetch.mock.calls.map(([context]) => [context.range.start.day, context.range.end.day])

    it('fetches only the parts of a range it has not loaded yet', async () => {
        const fetch = vi.fn<EventSourceFn>(async () => [])
        const loader = createSourceLoader(fetch, ZONE)
        await loader.load(day)
        await loader.load(week)
        expect(rangesOf(fetch)).toEqual([
            [9, 10],
            [7, 9],
            [10, 14]
        ])
    })

    it('serves a range inside loaded coverage without fetching', async () => {
        const fetch = vi.fn<EventSourceFn>(async () => [input('a')])
        const loader = createSourceLoader(fetch, ZONE)
        await loader.load(week)
        const result = await loader.load(day)
        expect(fetch).toHaveBeenCalledTimes(1)
        expect(result).toMatchObject({ status: 'loaded' })
    })

    it('returns only the cached events overlapping the requested range', async () => {
        const fetch = vi.fn<EventSourceFn>(async ({ range }) =>
            range.start.day === 7
                ? [input('a')]
                : [{ ...input('b'), start: '2026-09-16T09:00', end: '2026-09-16T10:00' }]
        )
        const loader = createSourceLoader(fetch, ZONE)
        await loader.load(week)
        await loader.load(nextWeek)
        const result = await loader.load(week)
        if (result.status !== 'loaded') throw new Error('unreachable')
        expect(result.events.map((e) => e.id)).toEqual(['a'])
    })

    it('always returns recurring series regardless of the range', async () => {
        const fetch = vi.fn<EventSourceFn>(async ({ range }) =>
            range.start.day === 7 ? [{ ...input('s'), recurrence: { freq: 'daily' } }] : []
        )
        const loader = createSourceLoader(fetch, ZONE)
        await loader.load(week)
        const result = await loader.load(nextWeek)
        if (result.status !== 'loaded') throw new Error('unreachable')
        expect(result.events.map((e) => e.id)).toEqual(['s'])
    })

    it('reflects applied mutations on the next read from cache', async () => {
        const fetch = vi.fn<EventSourceFn>(async () => [input('a')])
        const loader = createSourceLoader(fetch, ZONE)
        const first = await loader.load(week)
        if (first.status !== 'loaded') throw new Error('unreachable')
        const moved = {
            ...first.events[0],
            start: at('2026-09-11T09:00'),
            end: at('2026-09-11T10:00')
        }
        loader.apply({ type: 'upsert', event: moved })
        loader.apply({ type: 'upsert', event: { ...moved, id: 'new', title: 'new' } })
        loader.apply({ type: 'remove', eventId: 'gone' })

        const second = await loader.load(week)
        if (second.status !== 'loaded') throw new Error('unreachable')
        expect(second.events.map((e) => [e.id, e.start.day])).toEqual([
            ['a', 11],
            ['new', 11]
        ])
        expect(fetch).toHaveBeenCalledTimes(1)

        loader.apply({ type: 'remove', eventId: 'new' })
        const third = await loader.load(week)
        if (third.status !== 'loaded') throw new Error('unreachable')
        expect(third.events.map((e) => e.id)).toEqual(['a'])
    })

    it('ignores reset patches, which come from its own loads', async () => {
        const loader = createSourceLoader(async () => [input('a')], ZONE)
        await loader.load(week)
        loader.apply({ type: 'reset', events: [] })
        const result = await loader.load(week)
        if (result.status !== 'loaded') throw new Error('unreachable')
        expect(result.events).toHaveLength(1)
    })

    it('does not extend coverage when a load is superseded', async () => {
        const first = deferred<EventInput[]>()
        let calls = 0
        const fetch = vi.fn<EventSourceFn>(() => (calls++ === 0 ? first.promise : []))
        const loader = createSourceLoader(fetch, ZONE)
        const stale = loader.load(week)
        await loader.load(nextWeek)
        first.resolve([input('a')])
        expect(await stale).toEqual({ status: 'superseded' })
        await loader.load(week)
        expect(rangesOf(fetch)).toEqual([
            [7, 14],
            [14, 21],
            [7, 14]
        ])
    })

    it('forgets coverage on invalidate', async () => {
        const fetch = vi.fn<EventSourceFn>(async () => [])
        const loader = createSourceLoader(fetch, ZONE)
        await loader.load(week)
        loader.invalidate()
        await loader.load(week)
        expect(fetch).toHaveBeenCalledTimes(2)
    })
})
