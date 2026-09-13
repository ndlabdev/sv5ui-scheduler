import { usePointerDrag, type PointerDragContext } from 'sv5ui'
import type { ResizeEdge } from './gesture.js'

export interface PointerDragOptions {
    onStart: (context: PointerDragContext) => boolean
    onMove: (context: PointerDragContext) => void
    onEnd: (context: PointerDragContext) => void
    moveThreshold?: number
}

const DEFAULT_THRESHOLD = 3
const EDGE_SIZE = 6

export function pointerDrag(node: HTMLElement, options: PointerDragOptions): () => void {
    const threshold = options.moveThreshold ?? DEFAULT_THRESHOLD
    let moved = false
    const drag = usePointerDrag({
        onStart: (context) => {
            moved = false
            return options.onStart(context)
        },
        onMove: (context) => {
            if (!moved && Math.hypot(context.dx, context.dy) < threshold) return
            moved = true
            options.onMove(context)
        },
        onEnd: (context) => {
            if (moved) swallowNextClick(node)
            options.onEnd(context)
        }
    })
    const { handlers } = drag
    node.addEventListener('pointerdown', handlers.onpointerdown)
    node.addEventListener('pointermove', handlers.onpointermove)
    node.addEventListener('pointerup', handlers.onpointerup)
    node.addEventListener('pointercancel', handlers.onpointercancel)
    return () => {
        drag.cancel()
        node.removeEventListener('pointerdown', handlers.onpointerdown)
        node.removeEventListener('pointermove', handlers.onpointermove)
        node.removeEventListener('pointerup', handlers.onpointerup)
        node.removeEventListener('pointercancel', handlers.onpointercancel)
    }
}

export function edgeAt(node: HTMLElement, clientY: number, size = EDGE_SIZE): ResizeEdge | null {
    const rect = node.getBoundingClientRect()
    if (rect.height < size * 3) return null
    if (clientY - rect.top <= size) return 'start'
    if (rect.bottom - clientY <= size) return 'end'
    return null
}

export function isPrimaryButton(event: PointerEvent): boolean {
    return event.button === 0 && event.isPrimary
}

function swallowNextClick(node: HTMLElement): void {
    const swallow = (event: Event) => {
        event.stopPropagation()
        event.preventDefault()
    }
    node.addEventListener('click', swallow, { capture: true, once: true })
    setTimeout(() => node.removeEventListener('click', swallow, { capture: true }), 0)
}
