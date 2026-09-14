import type { StoreMiddleware } from '../../types/mutation.types.js'
import type { EventPatch } from '../../types/mutation.types.js'

export type PatchSink<T = unknown> = (patch: EventPatch<T>) => void

export function composeMiddleware<T>(
    middleware: readonly StoreMiddleware<T>[],
    sink: PatchSink<T>
): PatchSink<T> {
    return middleware.reduceRight<PatchSink<T>>((next, wrap) => wrap(next), sink)
}
