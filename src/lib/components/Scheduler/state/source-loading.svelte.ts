import type { EventStore } from '../../../core/store/event-store.svelte.js'
import type { SourceLoader } from '../../../core/store/sources.js'
import type { DateRange } from '../../../types/range.types.js'

export interface SourceLoadingOptions<T> {
    readonly loader: () => SourceLoader<T> | null
    readonly range: () => DateRange
    readonly store: EventStore<T>
    readonly onError: (error: unknown) => void
}

const SHOW_AFTER_MS = 150

export class SourceLoading<T> {
    #pending = $state(false)
    loading = $state(false)

    get pending(): boolean {
        return this.#pending
    }

    constructor(options: SourceLoadingOptions<T>) {
        $effect(() => {
            const current = options.loader()
            const visible = options.range()
            if (!current) return
            this.#pending = true
            current.load(visible).then(
                (result) => {
                    if (result.status === 'superseded') return
                    this.#pending = false
                    options.store.apply({ type: 'reset', events: result.events })
                },
                (error) => {
                    this.#pending = false
                    options.onError(error)
                }
            )
        })
        $effect(() => {
            if (!this.#pending) {
                this.loading = false
                return
            }
            const timer = setTimeout(() => (this.loading = true), SHOW_AFTER_MS)
            return () => clearTimeout(timer)
        })
    }
}
