import type { SchedulerEvent } from '../../types/event.types.js'
import type { StoreMiddleware } from '../../types/extension.types.js'
import type { EventPatch } from '../../types/mutation.types.js'
import type { DateRange } from '../../types/range.types.js'
import type { ExpandOptions } from '../recurrence/expand.js'
import { composeMiddleware, type PatchSink } from './middleware.js'
import { applyPatch } from './patch.js'
import { emptyIndex, queryIndex, type EventIndex } from './sorted-index.js'

export class EventStore<T = unknown> {
    #index = $state.raw<EventIndex<T>>(emptyIndex())
    #version = $state(0)
    readonly #sink: PatchSink<T>
    readonly #expansion: () => ExpandOptions

    constructor(
        middleware: readonly StoreMiddleware<T>[] = [],
        expansion: () => ExpandOptions = () => ({ weekStartsOn: 1 })
    ) {
        this.#sink = composeMiddleware(middleware, (patch) => this.#commit(patch))
        this.#expansion = expansion
    }

    get version(): number {
        return this.#version
    }

    get size(): number {
        return this.#index.byId.size
    }

    get(eventId: string): SchedulerEvent<T> | undefined {
        return this.#index.byId.get(eventId)
    }

    has(eventId: string): boolean {
        return this.#index.byId.has(eventId)
    }

    all(): SchedulerEvent<T>[] {
        return [...this.#index.sorted.map((item) => item.event), ...this.#index.series]
    }

    query(range: DateRange): SchedulerEvent<T>[] {
        return queryIndex(this.#index, range, this.#expansion())
    }

    series(): SchedulerEvent<T>[] {
        return [...this.#index.series]
    }

    apply(patch: EventPatch<T>): void {
        this.#sink(patch)
    }

    #commit(patch: EventPatch<T>): void {
        const next = applyPatch(this.#index, patch)
        if (next === this.#index) return
        this.#index = next
        this.#version += 1
    }
}
