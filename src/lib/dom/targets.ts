export function eventIdAt(target: EventTarget | null): string | null {
    if (!(target instanceof Element)) return null
    const element = target.closest<HTMLElement>('[data-sch-event-id], [data-sch-event]')
    return element?.dataset.schEventId ?? element?.dataset.schEvent ?? null
}

const INTERACTIVE =
    'button, a[href], input, textarea, select, [contenteditable="true"], [role="button"]'

export function isInteractiveTarget(target: EventTarget | null, container: Element): boolean {
    if (!(target instanceof Element)) return false
    const interactive = target.closest(INTERACTIVE)
    return interactive !== null && interactive !== container && container.contains(interactive)
}

export function isTextField(target: EventTarget | null): boolean {
    return (
        target instanceof Element &&
        target.closest('input, textarea, select, [contenteditable="true"]') !== null
    )
}
