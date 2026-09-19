import type { EventPatch } from '../../types/mutation.types.js'
import { indexFrom, removeFromIndex, upsertIntoIndex, type EventIndex } from './sorted-index.js'

export function applyPatch<T>(index: EventIndex<T>, patch: EventPatch<T>): EventIndex<T> {
    switch (patch.type) {
        case 'upsert':
            return upsertIntoIndex(index, patch.event)
        case 'remove':
            return removeFromIndex(index, patch.eventId)
        case 'reset':
            return indexFrom(patch.events)
    }
}
