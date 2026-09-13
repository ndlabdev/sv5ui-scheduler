import { useEventListener, usePointerDrag, type PointerDragContext } from 'sv5ui'
import type { PositionedEvent } from '../types/extension.types.js'
import { createAutoScroller } from './autoscroll.js'
import type { ResizeEdge } from './gesture.js'

export interface PointerDragOptions {
    onStart: (context: PointerDragContext) => boolean
    onMove: (context: PointerDragContext) => void
    onEnd: (context: PointerDragContext) => void
    moveThreshold?: number
    longPressMs?: number
}

const DEFAULT_THRESHOLD = 3
const DEFAULT_LONG_PRESS = 300
const EDGE_SIZE = 6
const held = new WeakSet<Event>()

export function pointerDrag(node: HTMLElement, options: PointerDragOptions): () => void {
    const threshold = options.moveThreshold ?? DEFAULT_THRESHOLD
    let moved = false
    let last: PointerDragContext | null = null
    const scroller = createAutoScroller(node.ownerDocument.defaultView ?? window, () => {
        if (last) options.onMove(last)
    })
    const drag = usePointerDrag({
        throttle: false,
        onStart: (context) => {
            moved = false
            return options.onStart(context)
        },
        onMove: (context) => {
            if (!moved && Math.hypot(context.dx, context.dy) < threshold) return
            moved = true
            last = context
            scroller.track(context)
            options.onMove(context)
        },
        onEnd: (context) => {
            scroller.stop()
            last = null
            if (moved) swallowNextClick(node)
            options.onEnd(context)
        }
    })
    const press = longPress(node, {
        delay: options.longPressMs ?? DEFAULT_LONG_PRESS,
        threshold,
        isActive: () => drag.active
    })
    useEventListener(node, 'pointerdown', (event) => {
        if (event.pointerType !== 'touch' || held.has(event)) drag.handlers.onpointerdown(event)
        else press.begin(event)
    })
    useEventListener(node, 'pointermove', drag.handlers.onpointermove)
    useEventListener(node, 'pointerup', drag.handlers.onpointerup)
    useEventListener(node, 'pointercancel', drag.handlers.onpointercancel)
    return () => {
        press.cancel()
        scroller.stop()
        drag.cancel()
    }
}

interface LongPressOptions {
    delay: number
    threshold: number
    isActive: () => boolean
}

function longPress(node: HTMLElement, options: LongPressOptions) {
    let pending: PointerEvent | null = null
    let timer = 0

    function begin(event: PointerEvent): void {
        cancel()
        pending = event
        timer = window.setTimeout(fire, options.delay)
    }

    function fire(): void {
        const event = pending
        cancel()
        if (!event) return
        const replay = new PointerEvent('pointerdown', event)
        held.add(replay)
        node.dispatchEvent(replay)
    }

    function cancel(): void {
        window.clearTimeout(timer)
        timer = 0
        pending = null
    }

    useEventListener(node, 'pointermove', (event) => {
        if (!pending || event.pointerId !== pending.pointerId) return
        const distance = Math.hypot(
            event.clientX - pending.clientX,
            event.clientY - pending.clientY
        )
        if (distance >= options.threshold) cancel()
    })
    useEventListener(node, ['pointerup', 'pointercancel'], cancel)
    useEventListener(
        node,
        'touchmove',
        (event) => {
            if (options.isActive()) event.preventDefault()
        },
        { passive: false }
    )
    useEventListener(node, 'contextmenu', (event) => {
        if (pending || options.isActive()) event.preventDefault()
    })

    return { begin, cancel }
}

export interface EdgeOptions {
    readonly node: HTMLElement
    readonly position: PositionedEvent
    readonly rtl: boolean
}

export function edgeAt(
    options: EdgeOptions,
    point: { clientX: number; clientY: number },
    size = EDGE_SIZE
): ResizeEdge | null {
    const rect = options.node.getBoundingClientRect()
    if (options.position.kind === 'time') return verticalEdge(rect, point.clientY, size)
    const edge = horizontalEdge(rect, point.clientX, size, options.rtl)
    if (edge === 'start' && options.position.continuesBefore) return null
    if (edge === 'end' && options.position.continuesAfter) return null
    return edge
}

function verticalEdge(rect: DOMRect, clientY: number, size: number): ResizeEdge | null {
    if (rect.height < size * 3) return null
    if (clientY - rect.top <= size) return 'start'
    if (rect.bottom - clientY <= size) return 'end'
    return null
}

function horizontalEdge(
    rect: DOMRect,
    clientX: number,
    size: number,
    rtl: boolean
): ResizeEdge | null {
    if (rect.width < size * 3) return null
    if (clientX - rect.left <= size) return rtl ? 'end' : 'start'
    if (rect.right - clientX <= size) return rtl ? 'start' : 'end'
    return null
}

export function edgeAxis(position: PositionedEvent): 'x' | 'y' {
    return position.kind === 'span' ? 'x' : 'y'
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
