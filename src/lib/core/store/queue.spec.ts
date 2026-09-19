import { describe, expect, it } from 'vitest'
import { createKeyedQueue } from './queue.js'

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

describe('createKeyedQueue', () => {
    it('runs tasks with the same key one after another', async () => {
        const queue = createKeyedQueue()
        const first = deferred<string>()
        const order: string[] = []

        const a = queue.enqueue('x', async () => {
            order.push('a:start')
            const value = await first.promise
            order.push('a:end')
            return value
        })
        const b = queue.enqueue('x', async () => {
            order.push('b:start')
            return 'b'
        })
        await tick()
        expect(order).toEqual(['a:start'])

        first.resolve('a')
        expect(await a).toEqual({ status: 'done', value: 'a' })
        expect(await b).toEqual({ status: 'done', value: 'b' })
        expect(order).toEqual(['a:start', 'a:end', 'b:start'])
    })

    it('runs tasks with different keys concurrently', async () => {
        const queue = createKeyedQueue()
        const gate = deferred<void>()
        const started: string[] = []

        const a = queue.enqueue('a', async () => {
            started.push('a')
            await gate.promise
        })
        const b = queue.enqueue('b', async () => {
            started.push('b')
        })
        await tick()
        expect(started).toEqual(['a', 'b'])
        expect(await b).toEqual({ status: 'done', value: undefined })

        gate.resolve()
        expect(await a).toEqual({ status: 'done', value: undefined })
    })

    it('keeps the lane moving after a task rejects', async () => {
        const queue = createKeyedQueue()
        const failing = queue.enqueue('x', async () => {
            throw new Error('boom')
        })
        const following = queue.enqueue('x', async () => 'ok')

        await expect(failing).rejects.toThrow('boom')
        expect(await following).toEqual({ status: 'done', value: 'ok' })
    })

    it('skips tasks that were waiting when the key is cancelled', async () => {
        const queue = createKeyedQueue()
        const gate = deferred<void>()
        const ran: string[] = []

        const running = queue.enqueue('x', async () => {
            ran.push('running')
            await gate.promise
        })
        const waiting = queue.enqueue('x', async () => {
            ran.push('waiting')
        })
        await tick()
        expect(queue.pending('x')).toBe(2)

        expect(queue.cancelPending('x')).toBe(1)
        gate.resolve()

        expect(await running).toEqual({ status: 'done', value: undefined })
        expect(await waiting).toEqual({ status: 'skipped' })
        expect(ran).toEqual(['running'])
    })

    it('runs tasks enqueued after a cancellation', async () => {
        const queue = createKeyedQueue()
        queue.cancelPending('x')
        const later = queue.enqueue('x', async () => 'later')
        expect(await later).toEqual({ status: 'done', value: 'later' })
    })

    it('forgets a lane once it drains', async () => {
        const queue = createKeyedQueue()
        await queue.enqueue('x', async () => 1)
        await queue.enqueue('y', async () => 2)
        await tick()
        expect(queue.keys).toBe(0)
        expect(queue.pending('x')).toBe(0)
    })

    it('does not forget a lane that still has work', async () => {
        const queue = createKeyedQueue()
        const gate = deferred<void>()
        const first = queue.enqueue('x', () => gate.promise)
        const second = queue.enqueue('x', async () => 1)
        await tick()
        expect(queue.keys).toBe(1)
        expect(queue.pending('x')).toBe(2)

        gate.resolve()
        await first
        await second
        await tick()
        expect(queue.keys).toBe(0)
    })
})
