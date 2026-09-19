export const RETURN_ANIMATION_ID = 'sch-return'

const DURATION = 240
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'
const LIFT = '30'

export interface EventSnapshot {
    readonly rect: DOMRect
    readonly clone: HTMLElement
}

function eventElements(root: ParentNode, eventId: string): HTMLElement[] {
    return [...root.querySelectorAll<HTMLElement>('[data-sch-event]')].filter(
        (element) => element.dataset.schEvent === eventId
    )
}

export function captureEvent(root: ParentNode, eventId: string): EventSnapshot[] {
    return eventElements(root, eventId).map((element) => ({
        rect: element.getBoundingClientRect(),
        clone: element.cloneNode(true) as HTMLElement
    }))
}

export function playReturn(root: HTMLElement, eventId: string, from: EventSnapshot[]): void {
    if (prefersReducedMotion(root)) return
    const targets = eventElements(root, eventId)
    if (targets.length === 0) {
        from.forEach((snapshot) => fadeOut(root, snapshot))
        return
    }
    if (from.length === 0) {
        targets.forEach(fadeIn)
        return
    }
    slide(targets, from)
}

function slide(targets: HTMLElement[], from: EventSnapshot[]): void {
    const origin = from[0].rect
    const target = targets[0].getBoundingClientRect()
    const offset = `translate(${origin.left - target.left}px, ${origin.top - target.top}px)`
    const resize = targets.length === 1 && from.length === 1
    targets.forEach((element) => {
        const rect = element.getBoundingClientRect()
        const start: Keyframe = { transform: offset, zIndex: LIFT }
        const end: Keyframe = { transform: 'none', zIndex: LIFT }
        if (resize) {
            Object.assign(start, { width: `${origin.width}px`, height: `${origin.height}px` })
            Object.assign(end, { width: `${rect.width}px`, height: `${rect.height}px` })
        }
        run(element, [start, end])
    })
}

function fadeIn(element: HTMLElement): void {
    run(element, [
        { opacity: 0, transform: 'scale(0.96)' },
        { opacity: 1, transform: 'none' }
    ])
}

function fadeOut(root: HTMLElement, snapshot: EventSnapshot): void {
    const { clone, rect } = snapshot
    scrub(clone)
    clone.removeAttribute('style')
    clone.setAttribute('aria-hidden', 'true')
    clone.inert = true
    Object.assign(clone.style, {
        position: 'fixed',
        left: `${rect.left}px`,
        top: `${rect.top}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        margin: '0',
        pointerEvents: 'none',
        zIndex: LIFT
    })
    root.append(clone)
    const animation = run(clone, [
        { opacity: 1, transform: 'none' },
        { opacity: 0, transform: 'scale(0.96)' }
    ])
    animation.addEventListener('finish', () => clone.remove())
    animation.addEventListener('cancel', () => clone.remove())
}

function scrub(clone: HTMLElement): void {
    for (const element of [clone, ...clone.querySelectorAll('*')]) {
        const names = element.getAttributeNames()
        names
            .filter((name) => name === 'id' || name.startsWith('data-sch-'))
            .forEach((name) => element.removeAttribute(name))
    }
}

function run(element: HTMLElement, keyframes: Keyframe[]): Animation {
    const animation = element.animate(keyframes, { duration: DURATION, easing: EASING })
    animation.id = RETURN_ANIMATION_ID
    return animation
}

function prefersReducedMotion(root: HTMLElement): boolean {
    const view = root.ownerDocument.defaultView
    return view?.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? true
}
