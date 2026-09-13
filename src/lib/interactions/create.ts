import { useEventListener } from 'sv5ui'
import type { HitTarget, InteractionPlugin } from '../types/extension.types.js'
import type { GestureController } from './controller.svelte.js'
import { minutesOfDay } from './gesture.js'
import { eventIdAt, isInteractiveTarget } from './hit-test.js'
import { isPrimaryButton, pointerDrag } from './pointer.js'

export function createInteraction<T>(controller: GestureController<T>): InteractionPlugin<T> {
    return {
        name: 'create',
        attach: (context) => (node) => {
            let anchor: HitTarget | null = null
            const stopDrag = pointerDrag(node, {
                onStart: ({ event }) => {
                    if (controller.active || !isPrimaryButton(event)) return false
                    if (eventIdAt(event.target) || isInteractiveTarget(event.target, node))
                        return false
                    anchor = context.hitTest(event.clientX, event.clientY)
                    if (!anchor) return false
                    context.select(null)
                    context.setFocus({
                        dayIndex: anchor.dayIndex,
                        minutes: anchor.allDay ? null : minutesOfDay(anchor.date)
                    })
                    return true
                },
                onMove: ({ x, y }) => {
                    if (anchor) controller.beginCreate(anchor)
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
            useEventListener(node, 'dblclick', (event) => {
                if (eventIdAt(event.target) || isInteractiveTarget(event.target, node)) return
                const hit = context.hitTest(event.clientX, event.clientY)
                if (hit) controller.createAt(hit)
            })
            return stopDrag
        }
    }
}
