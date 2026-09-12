import type { SchedulerEvent } from '../../types/event.types.js'
import type { Mutation, MutationHandlers } from '../../types/mutation.types.js'
import type { TimeZoneId } from '../../types/range.types.js'
import type { EventStore } from './event-store.svelte.js'
import { emptyIdSet, withId, withoutId } from './id-set.js'
import { isSameEvent, normalizeEvent } from './normalize.js'
import { createKeyedQueue, type KeyedQueue } from './queue.js'

export type MutationRequest<T = unknown> = Omit<Mutation<T>, 'id'>

export type MutationOutcome = 'committed' | 'reverted' | 'skipped' | 'kept-server' | 'kept-local'

export interface MutationPipelineOptions<T = unknown> {
    store: EventStore<T>
    timeZone: TimeZoneId
    handlers: () => MutationHandlers<T>
    onRevert?: (mutation: Mutation<T>) => void
}

export class MutationPipeline<T = unknown> {
    #pending = $state.raw(emptyIdSet())
    readonly #store: EventStore<T>
    readonly #queue: KeyedQueue = createKeyedQueue()
    readonly #options: MutationPipelineOptions<T>
    #sequence = 0

    constructor(options: MutationPipelineOptions<T>) {
        this.#store = options.store
        this.#options = options
    }

    get pending(): ReadonlySet<string> {
        return this.#pending
    }

    isPending(eventId: string): boolean {
        return this.#pending.has(eventId)
    }

    async commit(request: MutationRequest<T>): Promise<MutationOutcome> {
        const mutation: Mutation<T> = { id: this.#nextId(), ...request }
        this.#applyOptimistic(mutation)

        const handlers = this.#options.handlers()
        if (!handlers.onMutate) return 'committed'

        this.#pending = withId(this.#pending, mutation.eventId)
        try {
            const result = await this.#queue.enqueue(mutation.eventId, () =>
                this.#persist(mutation, handlers)
            )
            return result.status === 'skipped' ? 'skipped' : result.value
        } finally {
            if (this.#queue.pending(mutation.eventId) === 0) {
                this.#pending = withoutId(this.#pending, mutation.eventId)
            }
        }
    }

    async #persist(mutation: Mutation<T>, handlers: MutationHandlers<T>): Promise<MutationOutcome> {
        let result
        try {
            result = await handlers.onMutate?.(mutation)
        } catch (error) {
            this.#revert(mutation)
            handlers.onError?.(mutation, error)
            return 'reverted'
        }
        if (!result || !mutation.after) return 'committed'
        const server = normalizeEvent(result, this.#options.timeZone)
        return this.#reconcile(mutation, mutation.after, server, handlers)
    }

    #reconcile(
        mutation: Mutation<T>,
        local: SchedulerEvent<T>,
        server: SchedulerEvent<T>,
        handlers: MutationHandlers<T>
    ): MutationOutcome {
        if (isSameEvent(server, local)) return 'committed'
        const resolution = handlers.onConflict?.(mutation, server) ?? 'keep-server'
        if (resolution === 'keep-local') return 'kept-local'
        this.#store.apply({ type: 'upsert', event: server })
        return 'kept-server'
    }

    #applyOptimistic(mutation: Mutation<T>): void {
        if (mutation.after) this.#store.apply({ type: 'upsert', event: mutation.after })
        else this.#store.apply({ type: 'remove', eventId: mutation.eventId })
    }

    #revert(mutation: Mutation<T>): void {
        this.#queue.cancelPending(mutation.eventId)
        if (mutation.before) this.#store.apply({ type: 'upsert', event: mutation.before })
        else this.#store.apply({ type: 'remove', eventId: mutation.eventId })
        this.#options.onRevert?.(mutation)
    }

    #nextId(): string {
        this.#sequence += 1
        return `m${this.#sequence}`
    }
}
