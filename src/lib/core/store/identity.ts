import type { SchedulerEvent } from '../../types/event.types.js'
import { sameZonedValue } from '../time/zone.js'
import { sameRule } from './normalize.js'

export function isUnchanged<T>(previous: SchedulerEvent<T>, next: SchedulerEvent<T>): boolean {
    if (previous === next) return true
    const before = new Map(Object.entries(previous))
    const after = Object.entries(next)
    if (before.size !== after.length) return false
    if (!sameRule(previous.recurrence, next.recurrence)) return false
    return after.every(
        ([key, value]) =>
            key === 'recurrence' || (before.has(key) && sameZonedValue(before.get(key), value))
    )
}

export function keepUnchanged<T>(
    next: readonly SchedulerEvent<T>[],
    previous: ReadonlyMap<string, SchedulerEvent<T>>
): SchedulerEvent<T>[] {
    return next.map((event) => {
        const kept = previous.get(event.id)
        return kept && isUnchanged(kept, event) ? kept : event
    })
}
