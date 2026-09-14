import { useEventListener } from 'sv5ui'
import type { HitTarget, InteractionPlugin } from '../../types/interaction.types.js'
import { isEditable } from '../../core/store/normalize.js'
import type { ResizeEdge } from '../engine/gesture.js'
import type { GestureController } from '../engine/controller.svelte.js'
import { edgeAt, edgeAxis, isPrimaryButton, pointerDrag } from '../engine/pointer.js'

export function resizeInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'resize',
        attach: () => () => undefined,
        attachEvent: (context, position) => (node) => {
            const options = () => ({ node, position, rtl: context.scheduler.direction === 'rtl' })
            let pending: { edge: ResizeEdge; hit: HitTarget } | null = null
            const stopDrag = pointerDrag(node, {
                onStart: ({ event }) => {
                    if (!isPrimaryButton(event) || !isEditable(position.event)) return false
                    const edge = edgeAt(options(), event)
                    const hit = edge && context.hitTest(event.clientX, event.clientY)
                    if (!edge || !hit) return false
                    pending = { edge, hit }
                    return true
                },
                onMove: ({ x, y }) => {
                    if (pending && !controller.active) {
                        controller.beginResize(position.event, pending.edge, pending.hit)
                    }
                    pending = null
                    if (!controller.active) return
                    const hit = context.hitTest(x, y)
                    if (hit) controller.update(hit)
                },
                onEnd: () => {
                    pending = null
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
