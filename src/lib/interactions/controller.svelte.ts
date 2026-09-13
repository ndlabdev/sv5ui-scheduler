import type { SchedulerEvent } from '../types/event.types.js'
import type { InteractionContext } from '../types/extension.types.js'
import type { MutationKind } from '../types/mutation.types.js'
import { announceMutation } from '../core/a11y/announce.js'
import {
    applyDraft,
    createDraft,
    isUnchanged,
    moveDraft,
    resizeDraft,
    type DraftRange,
    type GestureMode,
    type GesturePoint,
    type ResizeEdge
} from './gesture.js'

export interface GestureSession<T = unknown> {
    readonly mode: GestureMode
    readonly anchor: GesturePoint
    readonly event: SchedulerEvent<T>
    readonly edge: ResizeEdge | null
    readonly draft: DraftRange
    readonly moved: boolean
}

export interface GestureOptions {
    readonly defaultMinutes?: number
}

const MUTATION_KIND: Record<GestureMode, MutationKind> = {
    create: 'create',
    move: 'move',
    resize: 'resize'
}

export class GestureController<T = unknown> {
    #session = $state.raw<GestureSession<T> | null>(null)
    readonly #context: () => InteractionContext<T>
    readonly #options: () => GestureOptions

    constructor(context: () => InteractionContext<T>, options: () => GestureOptions = () => ({})) {
        this.#context = context
        this.#options = options
    }

    get session(): GestureSession<T> | null {
        return this.#session
    }

    get active(): boolean {
        return this.#session !== null
    }

    beginCreate(anchor: GesturePoint): void {
        const context = this.#context()
        const draft = createDraft(anchor, anchor, context.scale.slotMinutes)
        const event: SchedulerEvent<T> = {
            id: context.newEventId(),
            title: context.scheduler.labels.newEvent,
            start: draft.start,
            end: draft.end,
            allDay: draft.allDay
        }
        this.#start({ mode: 'create', anchor, event, edge: null, draft, moved: false })
    }

    beginMove(event: SchedulerEvent<T>, anchor: GesturePoint): boolean {
        if (!isEditable(event)) return false
        const draft = moveDraft(event, anchor, anchor, this.#moveOptions())
        this.#start({ mode: 'move', anchor, event, edge: null, draft, moved: false })
        return true
    }

    beginResize(event: SchedulerEvent<T>, edge: ResizeEdge, anchor: GesturePoint): boolean {
        if (!isEditable(event)) return false
        const draft = resizeDraft(event, edge, anchor, this.#context().scale.slotMinutes)
        this.#start({ mode: 'resize', anchor, event, edge, draft, moved: false })
        return true
    }

    update(current: GesturePoint): void {
        const session = this.#session
        if (!session) return
        const draft = this.#draftFor(session, current)
        this.#session = { ...session, draft, moved: true }
        this.#context().setPreview({ kind: session.mode, event: applyDraft(session.event, draft) })
    }

    commit(): boolean {
        const session = this.#session
        if (!session) return false
        this.#finish()
        if (!session.moved) return false
        if (session.mode !== 'create' && isUnchanged(session.event, session.draft)) return false
        const after = applyDraft(session.event, session.draft)
        const context = this.#context()
        context.commit({
            kind: MUTATION_KIND[session.mode],
            eventId: session.event.id,
            before: session.mode === 'create' ? null : session.event,
            after
        })
        const message = announceMutation(
            {
                id: '',
                kind: MUTATION_KIND[session.mode],
                eventId: after.id,
                before: session.mode === 'create' ? null : session.event,
                after
            },
            {
                labels: context.scheduler.labels,
                locale: context.scheduler.locale,
                hour12: context.scheduler.hour12
            }
        )
        if (message) context.announce(message)
        return true
    }

    createAt(point: GesturePoint): void {
        this.beginCreate(point)
        const session = this.#session
        if (!session) return
        this.#session = { ...session, moved: true }
        this.commit()
    }

    cancel(): void {
        const session = this.#session
        if (!session) return
        this.#finish()
        this.#context().announce(this.#context().scheduler.labels.announce.cancelled)
    }

    #start(session: GestureSession<T>): void {
        this.#session = session
        this.#context().setPreview({
            kind: session.mode,
            event: applyDraft(session.event, session.draft)
        })
    }

    #finish(): void {
        this.#session = null
        this.#context().setPreview(null)
    }

    #draftFor(session: GestureSession<T>, current: GesturePoint): DraftRange {
        const slotMinutes = this.#context().scale.slotMinutes
        if (session.mode === 'create') return createDraft(session.anchor, current, slotMinutes)
        if (session.mode === 'move')
            return moveDraft(session.event, session.anchor, current, this.#moveOptions())
        return resizeDraft(session.event, session.edge ?? 'end', current, slotMinutes)
    }

    #moveOptions() {
        return {
            slotMinutes: this.#context().scale.slotMinutes,
            defaultMinutes: this.#options().defaultMinutes
        }
    }
}

function isEditable(event: SchedulerEvent): boolean {
    return event.editable !== false && event.background !== true
}
