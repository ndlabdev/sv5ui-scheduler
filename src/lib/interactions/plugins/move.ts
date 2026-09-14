import type { HitTarget, InteractionPlugin } from '../../types/interaction.types.js'
import { isEditable } from '../../core/store/normalize.js'
import type { GestureController } from '../engine/controller.svelte.js'
import { edgeAt, isPrimaryButton, pointerDrag } from '../engine/pointer.js'

export function moveInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'move',
        attach: () => () => undefined,
        attachEvent: (context, position) => (node) => {
            let anchor: HitTarget | null = null
            return pointerDrag(node, {
                onStart: ({ event }) => {
                    const rtl = context.scheduler.direction === 'rtl'
                    if (!isPrimaryButton(event) || edgeAt({ node, position, rtl }, event)) {
                        return false
                    }
                    if (!isEditable(position.event, context.scheduler.editable)) return false
                    anchor = context.hitTest(event.clientX, event.clientY)
                    if (!anchor) return false
                    context.select(position.event.id)
                    return true
                },
                onMove: ({ x, y }) => {
                    if (anchor && !controller.active) controller.beginMove(position.event, anchor)
                    anchor = null
                    if (!controller.active) return
                    const hit = context.hitTest(x, y)
                    if (hit) controller.update(hit)
                },
                onEnd: () => {
                    anchor = null
                    controller.commit()
                }
            })
        }
    }
}
