import type { InteractionPlugin } from '../types/extension.types.js'
import type { GestureController } from './controller.svelte.js'
import { edgeAt, isPrimaryButton, pointerDrag } from './pointer.js'

export function moveInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'move',
        attach: () => () => undefined,
        attachEvent: (context, position) => (node) =>
            pointerDrag(node, {
                onStart: ({ event }) => {
                    const rtl = context.scheduler.direction === 'rtl'
                    if (!isPrimaryButton(event) || edgeAt({ node, position, rtl }, event)) {
                        return false
                    }
                    const hit = context.hitTest(event.clientX, event.clientY)
                    if (!hit) return false
                    context.select(position.event.id)
                    return controller.beginMove(position.event, hit)
                },
                onMove: ({ x, y }) => {
                    const hit = context.hitTest(x, y)
                    if (hit) controller.update(hit)
                },
                onEnd: () => {
                    controller.commit()
                }
            })
    }
}
