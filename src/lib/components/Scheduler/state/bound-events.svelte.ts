import { untrack } from 'svelte'
import type { EventStore } from '../../../core/store/event-store.svelte.js'
import { normalizeEvents, sameEventList } from '../../../core/store/normalize.js'
import type { EventInput, SchedulerEvent } from '../../../types/event.types.js'
import type { TimeZoneId } from '../../../types/range.types.js'

export interface BoundEventsOptions<T> {
    readonly store: EventStore<T>
    readonly events: () => EventInput<T>[] | undefined
    readonly write: (events: SchedulerEvent<T>[]) => void
    readonly timeZone: () => TimeZoneId
    readonly enabled: () => boolean
}

export function syncBoundEvents<T>(options: BoundEventsOptions<T>): void {
    let mirroredZone = untrack(options.timeZone)
    let mirrored = normalizeEvents(untrack(options.events) ?? [], mirroredZone)
    options.store.apply({ type: 'reset', events: mirrored })

    $effect(() => {
        if (!options.enabled()) return
        const zone = options.timeZone()
        const normalized = normalizeEvents(options.events() ?? [], zone)
        untrack(() => {
            if (zone === mirroredZone && sameEventList(normalized, mirrored)) return
            mirroredZone = zone
            mirrored = normalized
            options.store.apply({ type: 'reset', events: normalized })
        })
    })

    $effect(() => {
        void options.store.version
        if (!options.enabled()) return
        untrack(() => {
            const all = options.store.all()
            if (sameEventList(all, mirrored)) return
            mirrored = all
            options.write(all)
        })
    })
}
