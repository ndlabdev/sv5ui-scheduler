import type { EventInput, SchedulerEvent } from './event.types.js'

/**
 * What a mutation did. `move` and `resize` are `update`s that changed only
 * `start` and `end`, kept distinct so handlers can react to them differently.
 */
export type MutationKind = 'create' | 'update' | 'delete' | 'move' | 'resize'

/**
 * One change to one event, as reported to `MutationHandlers`.
 */
export interface Mutation<T = unknown> {
    /**
     * Unique per mutation. Retries of the same change carry the same id.
     */
    id: string

    kind: MutationKind

    eventId: string

    /**
     * State before the change. `null` when `kind` is `'create'`.
     */
    before: SchedulerEvent<T> | null

    /**
     * State after the change. `null` when `kind` is `'delete'`.
     */
    after: SchedulerEvent<T> | null
}

/**
 * Which side wins when the server returns something other than what was sent.
 */
export type ConflictResolution = 'keep-server' | 'keep-local'

/**
 * What `onMutate` may return. `void` confirms the optimistic state; an event
 * is the server's version and is compared against `after` to detect a conflict.
 */
export type MutationResult<T = unknown> = void | EventInput<T>

/**
 * Callbacks around the mutation pipeline. All are optional; without
 * `onMutate` every change commits locally and immediately.
 */
export interface MutationHandlers<T = unknown> {
    /**
     * Persist one mutation. The change is already applied optimistically when
     * this runs. Throwing or rejecting rolls the event back to `before` with
     * an animation. Returning an event triggers conflict detection.
     */
    onMutate?: (mutation: Mutation<T>) => MutationResult<T> | Promise<MutationResult<T>>

    /**
     * Decide what to keep when `onMutate` returned an event that differs from
     * `mutation.after`.
     * @default 'keep-server'
     */
    onConflict?: (mutation: Mutation<T>, server: SchedulerEvent<T>) => ConflictResolution

    /**
     * Called after a rollback, with whatever `onMutate` threw or rejected with.
     */
    onError?: (mutation: Mutation<T>, error: unknown) => void
}

/**
 * A change applied to the event store. `upsert` and `remove` are what
 * mutations produce; `reset` replaces the whole set when the source changes.
 */
export type EventPatch<T = unknown> =
    | { type: 'upsert'; event: SchedulerEvent<T> }
    | { type: 'remove'; eventId: string }
    | { type: 'reset'; events: SchedulerEvent<T>[] }
