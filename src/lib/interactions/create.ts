import type { InteractionPlugin } from '../types/extension.types.js'
import type { GestureController } from './controller.svelte.js'
import { minutesOfDay } from './gesture.js'
import { eventIdAt, isInteractiveTarget } from './hit-test.js'
import { isPrimaryButton, pointerDrag } from './pointer.js'

export function createInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'create',
        attach: (context) => (node) => {
            const stopDrag = pointerDrag(node, {
                onStart: ({ event }) => {
                    if (controller.active || !isPrimaryButton(event)) return false
                    if (eventIdAt(event.target) || isInteractiveTarget(event.target, node))
                        return false
                    const hit = context.hitTest(event.clientX, event.clientY)
                    if (!hit) return false
                    context.select(null)
                    context.setFocus({
                        dayIndex: hit.dayIndex,
                        minutes: hit.allDay ? null : minutesOfDay(hit.date)
                    })
                    controller.beginCreate(hit)
                    return true
                },
                onMove: ({ x, y }) => {
                    const hit = context.hitTest(x, y)
                    if (hit) controller.update(hit)
                },
                onEnd: () => {
                    controller.commit()
                }
            })
            const onDoubleClick = (event: MouseEvent) => {
                if (eventIdAt(event.target) || isInteractiveTarget(event.target, node)) return
                const hit = context.hitTest(event.clientX, event.clientY)
                if (hit) controller.createAt(hit)
            }
            node.addEventListener('dblclick', onDoubleClick)
            return () => {
                stopDrag()
                node.removeEventListener('dblclick', onDoubleClick)
            }
        }
    }
}
