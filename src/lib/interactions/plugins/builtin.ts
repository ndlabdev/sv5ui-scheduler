import type { InteractionPlugin } from '../../types/interaction.types.js'
import type { GestureController } from '../engine/controller.svelte.js'
import { createInteraction } from './create.js'
import { externalInteraction } from './external.js'
import { keyboardInteraction } from './keyboard.js'
import { moveInteraction } from './move.js'
import { resizeInteraction } from './resize.js'

export function createBuiltinInteractions<T>(
    controller: GestureController<T>
): InteractionPlugin<T>[] {
    return [
        createInteraction(controller),
        moveInteraction(controller),
        resizeInteraction(controller),
        keyboardInteraction(controller),
        externalInteraction(controller)
    ]
}
