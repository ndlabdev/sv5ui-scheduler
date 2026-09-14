import type { HitTarget, InteractionPlugin } from '../../types/interaction.types.js'
import type { GestureController } from '../engine/controller.svelte.js'
import { minutesOfDay } from '../engine/gesture.js'
import { eventIdAt, isInteractiveTarget } from '../../dom/targets.js'
import { isPrimaryButton, pointerDrag } from '../engine/pointer.js'

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
                    if (anchor && !controller.active) controller.beginCreate(anchor)
                    anchor = null
                    if (!controller.active) return
                    const hit = context.hitTest(x, y)
                    if (hit) controller.update(hit)
                },
                onEnd: () => {
                    if (anchor?.keepsTime) context.navigate(anchor.date)
                    anchor = null
                    controller.commit()
                },
                onTap: (event) => {
                    if (eventIdAt(event.target) || isInteractiveTarget(event.target, node)) return
                    const hit = context.hitTest(event.clientX, event.clientY)
                    if (hit?.keepsTime) context.navigate(hit.date)
                }
            })
            return stopDrag
        }
    }
}
