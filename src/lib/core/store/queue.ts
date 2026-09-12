export type QueueResult<R> = { status: 'done'; value: R } | { status: 'skipped' }

export interface KeyedQueue {
    enqueue<R>(key: string, task: () => Promise<R>): Promise<QueueResult<R>>
    cancelPending(key: string): number
    pending(key: string): number
    readonly keys: number
}

interface Lane {
    tail: Promise<void>
    waiting: number
    running: boolean
    generation: number
}

const SKIPPED: QueueResult<never> = { status: 'skipped' }

export function createKeyedQueue(): KeyedQueue {
    const lanes = new Map<string, Lane>()

    function laneFor(key: string): Lane {
        let lane = lanes.get(key)
        if (!lane) {
            lane = { tail: Promise.resolve(), waiting: 0, running: false, generation: 0 }
            lanes.set(key, lane)
        }
        return lane
    }

    function release(key: string, lane: Lane, tail: Promise<void>): void {
        if (lane.waiting === 0 && !lane.running && lanes.get(key) === lane && lane.tail === tail) {
            lanes.delete(key)
        }
    }

    return {
        enqueue(key, task) {
            const lane = laneFor(key)
            const generation = lane.generation
            lane.waiting += 1

            const run = lane.tail.then(async () => {
                lane.waiting -= 1
                if (lane.generation !== generation) return SKIPPED
                lane.running = true
                try {
                    return { status: 'done' as const, value: await task() }
                } finally {
                    lane.running = false
                }
            })
            const tail = run.then(
                () => undefined,
                () => undefined
            )
            lane.tail = tail
            tail.then(() => release(key, lane, tail))
            return run
        },
        cancelPending(key) {
            const lane = lanes.get(key)
            if (!lane) return 0
            lane.generation += 1
            return lane.waiting
        },
        pending(key) {
            const lane = lanes.get(key)
            return lane ? lane.waiting + (lane.running ? 1 : 0) : 0
        },
        get keys() {
            return lanes.size
        }
    }
}
