import { useEventListener } from 'sv5ui'
import type { Attachment } from 'svelte/attachments'
import type { SchedulerEvent } from '../types/event.types.js'
import type {
    DragSourceData,
    HitTarget,
    InteractionContext,
    InteractionPlugin
} from '../types/extension.types.js'
import type { GestureController } from './controller.svelte.js'
import { pointerDrag } from './pointer.js'

const DROP_TARGET = 'data-sch-drop-target'
const EVENT_NAME = 'sch-external-drag'
const SLOTS_PER_EVENT = 2

type Phase = 'move' | 'leave' | 'drop'

interface ExternalDetail {
    phase: Phase
    clientX: number
    clientY: number
    data: () => DragSourceData
}

export function dragSource<T>(data: () => DragSourceData<T>): Attachment<HTMLElement> {
    return (node) => {
        let over: HTMLElement | null = null
        const cursor = getComputedStyle(node).cursor
        if (cursor === 'auto' || cursor === 'default') node.style.cursor = 'grab'
        const detail = () => data() as DragSourceData

        const send = (target: HTMLElement | null, phase: Phase, x: number, y: number) => {
            target?.dispatchEvent(
                new CustomEvent<ExternalDetail>(EVENT_NAME, {
                    detail: { phase, clientX: x, clientY: y, data: detail }
                })
            )
        }
        const track = (x: number, y: number) => {
            const target = dropTargetAt(node.ownerDocument, x, y)
            if (target !== over) send(over, 'leave', x, y)
            over = target
            send(over, 'move', x, y)
        }
        const finish = (phase: Phase, x: number, y: number) => {
            send(over, phase, x, y)
            over = null
            delete node.dataset.schDragging
        }

        const stop = pointerDrag(node, {
            onStart: ({ event }) => {
                if (event.button !== 0) return false
                node.dataset.schDragging = ''
                return true
            },
            onMove: ({ x, y }) => track(x, y),
            onEnd: ({ x, y }) => finish('drop', x, y)
        })
        useEventListener(node.ownerDocument, 'keydown', (event) => {
            if (event.key !== 'Escape' || !over) return
            finish('leave', 0, 0)
            stop()
        })
        return () => {
            finish('leave', 0, 0)
            stop()
        }
    }
}

export function externalInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'external',
        attach: (context) => (node) => {
            node.setAttribute(DROP_TARGET, '')
            useEventListener(node, EVENT_NAME, (event) => {
                const { phase, clientX, clientY, data } = (event as CustomEvent<ExternalDetail>)
                    .detail
                if (phase === 'leave') return controller.abandon()
                const hit = context.hitTest(clientX, clientY)
                if (!hit) return controller.abandon()
                if (!controller.active) {
                    controller.beginInsert(
                        draftEvent(data() as DragSourceData<T>, hit, context),
                        hit
                    )
                } else {
                    controller.update(hit)
                }
                if (phase === 'drop') controller.commit()
            })
            return () => node.removeAttribute(DROP_TARGET)
        }
    }
}

function dropTargetAt(document: Document, x: number, y: number): HTMLElement | null {
    return document.elementFromPoint(x, y)?.closest<HTMLElement>(`[${DROP_TARGET}]`) ?? null
}

function draftEvent<T>(
    data: DragSourceData<T>,
    hit: HitTarget,
    context: InteractionContext<T>
): SchedulerEvent<T> {
    const { id, durationMinutes, ...rest } = data
    const minutes = durationMinutes ?? context.scale.slotMinutes * SLOTS_PER_EVENT
    const start = hit.allDay ? hit.date : context.snap(hit.date)
    const end = hit.allDay ? start.add({ days: 1 }) : start.add({ minutes })
    return {
        ...rest,
        id: id ?? context.newEventId(),
        start,
        end,
        allDay: hit.allDay || rest.allDay
    }
}
