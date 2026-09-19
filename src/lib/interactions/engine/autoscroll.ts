const EDGE = 48
const MAX_STEP = 14

export interface AutoScrollTarget {
    readonly x: number
    readonly y: number
}

export interface AutoScroller {
    track: (target: AutoScrollTarget) => void
    stop: () => void
}

export function createAutoScroller(
    view: Window,
    onScrolled: (target: AutoScrollTarget) => void
): AutoScroller {
    let last: AutoScrollTarget | null = null
    let frame = 0

    function step(): void {
        frame = 0
        if (!last) return
        const container = scrollableAt(view.document, last.x, last.y)
        const delta = container ? velocity(container.getBoundingClientRect(), last.y) : 0
        if (!container || delta === 0 || !canScroll(container, delta)) return
        container.scrollTop += delta
        onScrolled(last)
        frame = view.requestAnimationFrame(step)
    }

    return {
        track(target) {
            last = target
            if (!frame) frame = view.requestAnimationFrame(step)
        },
        stop() {
            last = null
            if (frame) view.cancelAnimationFrame(frame)
            frame = 0
        }
    }
}

function velocity(rect: DOMRect, y: number): number {
    if (y < rect.top || y > rect.bottom) return 0
    if (y - rect.top < EDGE) return -Math.ceil(((EDGE - (y - rect.top)) / EDGE) * MAX_STEP)
    if (rect.bottom - y < EDGE) return Math.ceil(((EDGE - (rect.bottom - y)) / EDGE) * MAX_STEP)
    return 0
}

function canScroll(container: HTMLElement, delta: number): boolean {
    if (delta < 0) return container.scrollTop > 0
    return container.scrollTop + container.clientHeight < container.scrollHeight - 1
}

function scrollableAt(document: Document, x: number, y: number): HTMLElement | null {
    for (
        let node = document.elementFromPoint(x, y) as HTMLElement | null;
        node;
        node = node.parentElement
    ) {
        const overflow = getComputedStyle(node).overflowY
        if ((overflow === 'auto' || overflow === 'scroll') && node.scrollHeight > node.clientHeight)
            return node
    }
    return null
}
