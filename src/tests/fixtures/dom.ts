import { parseZonedDateTime } from '@internationalized/date'
import type { EventInput } from '../../lib/types/event.types.js'

export const ZONE = 'Asia/Ho_Chi_Minh'
export const anchor = parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]')
export const NOW = new Date('2026-09-13T03:00:00Z')
export const SLOT_MINUTES = 30
export const SLOT_HEIGHT = 24

export interface Point {
    clientX: number
    clientY: number
}

export const input = (
    id: string,
    start: string,
    end: string,
    extra: Partial<EventInput> = {}
): EventInput => ({ id, title: id, start, end, ...extra })

export const iso = (date: { toString(): string }) => date.toString().slice(0, 16)
export const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
export const settle = () => wait(30)

export const grid = (container: Element) =>
    container.querySelector<HTMLElement>('[role="application"]')!

export function column(root: Element, day: string): HTMLElement {
    return root.querySelector<HTMLElement>(
        `[data-sch-day="${day}"][data-sch-day-index]:not([data-sch-all-day])`
    )!
}

export function pointAt(element: Element, minutes: number): Point {
    const rect = element.getBoundingClientRect()
    return {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + (minutes / SLOT_MINUTES) * SLOT_HEIGHT + 1
    }
}

export function centre(element: Element): Point {
    const rect = element.getBoundingClientRect()
    return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
}

export function pointer(type: string, at: Point, pointerType: 'mouse' | 'touch' = 'mouse') {
    return new PointerEvent(type, {
        ...at,
        pointerId: pointerType === 'touch' ? 7 : 1,
        pointerType,
        bubbles: true,
        cancelable: true,
        isPrimary: true,
        button: 0
    })
}

export async function drag(target: HTMLElement, from: Point, to: Point): Promise<void> {
    target.dispatchEvent(pointer('pointerdown', from))
    target.dispatchEvent(
        pointer('pointermove', {
            clientX: (from.clientX + to.clientX) / 2,
            clientY: (from.clientY + to.clientY) / 2
        })
    )
    await frame()
    target.dispatchEvent(pointer('pointermove', to))
    await frame()
    target.dispatchEvent(pointer('pointerup', to))
    await settle()
}

export function tap(target: Element): void {
    const at = centre(target)
    target.dispatchEvent(pointer('pointerdown', at))
    target.dispatchEvent(pointer('pointerup', at))
    target.dispatchEvent(new MouseEvent('click', { ...at, bubbles: true }))
}

export function press(target: Element, key: string, init: KeyboardEventInit = {}): void {
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }))
}
