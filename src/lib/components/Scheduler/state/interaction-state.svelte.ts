import type { ZonedDateTime } from '@internationalized/date'
import type { EventStore } from '../../../core/store/event-store.svelte.js'
import type { MutationRequest } from '../../../core/store/mutations.svelte.js'
import { GestureController } from '../../../interactions/engine/controller.svelte.js'
import {
    collectColumnRects,
    resolveHit,
    type ColumnRect
} from '../../../interactions/engine/hit-test.js'
import { snapToSlot } from '../../../interactions/engine/snap.js'
import type {
    GridFocus,
    HitTarget,
    InteractionContext,
    InteractionPreview,
    SlotSelection
} from '../../../types/interaction.types.js'
import type { SchedulerContext } from '../../../types/context.types.js'
import type { TimeScale } from '../../../types/layout.types.js'
import type { DateRange } from '../../../types/range.types.js'

export interface InteractionStateOptions<T> {
    readonly root: () => HTMLElement | null
    readonly view: () => string
    readonly viewLabel: () => string
    readonly range: () => DateRange
    readonly days: () => ZonedDateTime[]
    readonly columnsPerRow: () => number
    readonly scale: () => TimeScale
    readonly scheduler: () => SchedulerContext
    readonly slotMinutes: () => number
    readonly creatable: () => boolean
    readonly proposeCreate: () => boolean
    readonly selectSlot: (point: Pick<HitTarget, 'date' | 'allDay'>) => void
    readonly selectRange: (selection: SlotSelection) => void
    readonly store: EventStore<T>
    readonly commit: (request: MutationRequest<T>) => void
    readonly step: (direction: 1 | -1) => void
    readonly navigate: (date: ZonedDateTime, view?: string) => void
    readonly announce: (message: string) => void
}

export class InteractionState<T> {
    selectedEventId = $state<string | null>(null)
    focus = $state.raw<GridFocus | null>(null)
    preview = $state.raw<InteractionPreview<T> | null>(null)
    readonly gesture: GestureController<T>
    readonly context: InteractionContext<T>
    readonly #options: InteractionStateOptions<T>
    #columns: ColumnRect[] | null = null
    #created = 0

    constructor(options: InteractionStateOptions<T>) {
        this.#options = options
        this.gesture = new GestureController<T>(
            () => this.context,
            () => ({
                defaultMinutes: options.slotMinutes() * 2,
                creatable: options.creatable(),
                proposeCreate: options.proposeCreate()
            })
        )
        this.context = createInteractionContext(this, options)
    }

    hitTest(clientX: number, clientY: number): HitTarget | null {
        const root = this.#options.root()
        if (!root) return null
        if (!this.gesture.active || !this.#columns) this.#columns = collectColumnRects(root)
        return resolveHit({
            clientX,
            clientY,
            columns: this.#columns,
            days: this.#options.days(),
            scale: this.#options.scale()
        })
    }

    setPreview(next: InteractionPreview<T> | null): void {
        this.preview = next
        if (!next) this.#columns = null
    }

    invalidateColumns(): void {
        this.#columns = null
    }

    nextEventId(): string {
        this.#created += 1
        return `event-${Date.now().toString(36)}-${this.#created}`
    }
}

function createInteractionContext<T>(
    state: InteractionState<T>,
    options: InteractionStateOptions<T>
): InteractionContext<T> {
    return {
        get view() {
            return options.view()
        },
        get viewLabel() {
            return options.viewLabel()
        },
        get range() {
            return options.range()
        },
        get days() {
            return options.days()
        },
        get columnsPerRow() {
            return options.columnsPerRow()
        },
        get scale() {
            return options.scale()
        },
        get scheduler() {
            return options.scheduler()
        },
        get selectedEventId() {
            return state.selectedEventId
        },
        get focus() {
            return state.focus
        },
        select: (eventId) => (state.selectedEventId = eventId),
        setFocus: (next) => (state.focus = next),
        step: (direction) => options.step(direction),
        navigate: (date, view) => options.navigate(date, view),
        selectSlot: (point) => options.selectSlot(point),
        selectRange: (selection) => options.selectRange(selection),
        newEventId: () => state.nextEventId(),
        hitTest: (clientX, clientY) => state.hitTest(clientX, clientY),
        snap: (value) => snapToSlot(value, options.slotMinutes()),
        getEvent: (eventId) => options.store.get(eventId),
        commit: (request) => options.commit(request),
        setPreview: (next) => state.setPreview(next),
        announce: (message) => options.announce(message)
    }
}
