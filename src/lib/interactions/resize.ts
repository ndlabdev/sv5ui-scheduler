import { useEventListener } from 'sv5ui'
import type { InteractionPlugin } from '../types/extension.types.js'
import type { GestureController } from './controller.svelte.js'
import { edgeAt, edgeAxis, isPrimaryButton, pointerDrag } from './pointer.js'

export function resizeInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'resize',
        attach: () => () => undefined,
        attachEvent: (context, position) => (node) => {
            const options = () => ({ node, position, rtl: context.scheduler.direction === 'rtl' })
            const stopDrag = pointerDrag(node, {
                onStart: ({ event }) => {
                    if (!isPrimaryButton(event)) return false
                    const edge = edgeAt(options(), event)
                    if (!edge) return false
                    const hit = context.hitTest(event.clientX, event.clientY)
                    if (!hit) return false
                    return controller.beginResize(position.event, edge, hit)
                },
                onMove: ({ x, y }) => {
                    const hit = context.hitTest(x, y)
                    if (hit) controller.update(hit)
                },
                onEnd: () => {
                    controller.commit()
                }
            })
            useEventListener(node, 'pointermove', (event) => {
                if (controller.active) return
                if (edgeAt(options(), event)) node.dataset.schEdge = edgeAxis(position)
                else delete node.dataset.schEdge
            })
            useEventListener(node, 'pointerleave', () => {
                delete node.dataset.schEdge
            })
            return stopDrag
        }
    }
}
