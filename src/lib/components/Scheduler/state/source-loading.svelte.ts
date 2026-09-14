import type { EventStore } from '../../../core/store/event-store.svelte.js'
import type { SourceLoader } from '../../../core/store/sources.js'
import type { DateRange } from '../../../types/range.types.js'

export interface SourceLoadingOptions<T> {
    readonly loader: () => SourceLoader<T> | null
    readonly range: () => DateRange
    readonly store: EventStore<T>
    readonly onError: (error: unknown) => void
}

export class SourceLoading<T> {
    loading = $state(false)

    constructor(options: SourceLoadingOptions<T>) {
        $effect(() => {
            const current = options.loader()
            const visible = options.range()
            if (!current) return
            this.loading = true
            current.load(visible).then(
                (result) => {
                    if (result.status === 'superseded') return
                    this.loading = false
                    options.store.apply({ type: 'reset', events: result.events })
                },
                (error) => {
                    this.loading = false
                    options.onError(error)
                }
            )
        })
    }
}
