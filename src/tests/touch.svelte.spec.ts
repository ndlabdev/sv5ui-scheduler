import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import type { EventInput } from '../lib/types/event.types.js'
import type { Mutation } from '../lib/types/mutation.types.js'
import BoundScheduler from './fixtures/BoundScheduler.svelte'

const anchor = parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]')
const HOLD = 350
const input = (id: string, start: string, end: string): EventInput => ({
    id,
    title: id,
    start,
    end
})
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
const frame = () => new Promise((resolve) => requestAnimationFrame(resolve))
const iso = (date: { toString(): string }) => date.toString().slice(0, 16)

const grid = (container: Element) =>
    container.querySelector<HTMLElement>('[data-sch-time-grid] [role="application"]')!
const column = (container: Element, day: string) =>
    container.querySelector<HTMLElement>(
        `[data-sch-day="${day}"][data-sch-day-index]:not([data-sch-all-day])`
    )!
const ghost = (container: Element) => container.querySelector('[data-sch-ghost]')

function pointAt(element: HTMLElement, minutes: number) {
    const rect = element.getBoundingClientRect()
    return { clientX: rect.left + rect.width / 2, clientY: rect.top + (minutes / 30) * 24 + 1 }
}

function touch(type: string, at: { clientX: number; clientY: number }) {
    return new PointerEvent(type, {
        ...at,
        pointerId: 7,
        pointerType: 'touch',
        bubbles: true,
        cancelable: true,
        isPrimary: true,
        button: 0
    })
}

function touchMove(target: HTMLElement) {
    const event = new TouchEvent('touchmove', { bubbles: true, cancelable: true })
    target.dispatchEvent(event)
    return event.defaultPrevented
}

describe('touch', () => {
    it('lets a quick swipe scroll instead of creating an event', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const target = grid(screen.container)
        target.dispatchEvent(touch('pointerdown', pointAt(wed, 540)))
        await wait(50)
        target.dispatchEvent(touch('pointermove', pointAt(wed, 600)))
        expect(touchMove(target)).toBe(false)
        expect(ghost(screen.container)).toBeNull()
        await wait(HOLD)
        target.dispatchEvent(touch('pointermove', pointAt(wed, 660)))
        target.dispatchEvent(touch('pointerup', pointAt(wed, 660)))
        await wait(30)
        expect(ghost(screen.container)).toBeNull()
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('starts creating after a hold and blocks scrolling while dragging', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, { initial: [], onMutate, date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const target = grid(screen.container)
        target.dispatchEvent(touch('pointerdown', pointAt(wed, 540)))
        await wait(HOLD)
        expect(touchMove(target)).toBe(true)
        target.dispatchEvent(touch('pointermove', pointAt(wed, 660)))
        await frame()
        expect(ghost(screen.container)).not.toBeNull()
        target.dispatchEvent(touch('pointerup', pointAt(wed, 660)))
        await wait(30)

        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('create')
        expect(iso(mutation.after!.start)).toBe('2026-09-09T09:00')
        expect(iso(mutation.after!.end)).toBe('2026-09-09T11:00')
    })

    it('moves an event after a hold on it', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate,
            date: anchor
        })
        const wrapper = screen.container
            .querySelector<HTMLElement>('[data-sch-event-id="a"]')!
            .closest<HTMLElement>('[data-sch-event]')!
        const rect = wrapper.getBoundingClientRect()
        const from = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const to = pointAt(column(screen.container, '2026-09-10'), 840 + 30)
        wrapper.dispatchEvent(touch('pointerdown', from))
        await wait(HOLD)
        wrapper.dispatchEvent(touch('pointermove', to))
        await frame()
        wrapper.dispatchEvent(touch('pointerup', to))
        await wait(30)

        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.kind).toBe('move')
        expect(iso(mutation.after!.start)).toBe('2026-09-10T14:00')
    })

    it('suppresses the context menu while holding', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const wed = column(screen.container, '2026-09-09')
        const target = grid(screen.container)
        const menu = () => {
            const event = new MouseEvent('contextmenu', { bubbles: true, cancelable: true })
            target.dispatchEvent(event)
            return event.defaultPrevented
        }
        expect(menu()).toBe(false)
        target.dispatchEvent(touch('pointerdown', pointAt(wed, 540)))
        expect(menu()).toBe(true)
        target.dispatchEvent(touch('pointerup', pointAt(wed, 540)))
        await wait(30)
        expect(menu()).toBe(false)
    })
})
