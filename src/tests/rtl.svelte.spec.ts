import { parseZonedDateTime } from '@internationalized/date'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../lib/index.js'
import type { EventInput } from '../lib/types/event.types.js'
import type { Mutation } from '../lib/types/mutation.types.js'

const ZONE = 'Asia/Ho_Chi_Minh'
const anchor = parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]')
const settle = () => new Promise((resolve) => setTimeout(resolve, 30))
const input = (
    id: string,
    start: string,
    end: string,
    extra: Partial<EventInput> = {}
): EventInput => ({ id, title: id, start, end, ...extra })
const base = { timeZone: ZONE, date: anchor, weekStartsOn: 1 as const }

function rtl(props: Record<string, unknown>) {
    const screen = render(Scheduler, { props: { ...base, dir: 'rtl', ...props } })
    screen.container.style.height = '600px'
    return screen
}

const column = (container: Element, day: string) =>
    container.querySelector<HTMLElement>(
        `[data-sch-day="${day}"][data-sch-day-index]:not([data-sch-all-day])`
    )!
const wrapper = (container: Element, id: string) =>
    container.querySelector<HTMLElement>(`[data-sch-event="${id}"]`)!
const rect = (element: Element) => element.getBoundingClientRect()
const near = (a: number, b: number) => Math.abs(a - b) < 1.5

describe('right to left', () => {
    afterEach(() => document.documentElement.removeAttribute('dir'))

    it('inherits the direction of the page', () => {
        document.documentElement.setAttribute('dir', 'rtl')
        const { container } = render(Scheduler, { props: base })
        expect(rect(column(container, '2026-09-07')).left).toBeGreaterThan(
            rect(column(container, '2026-09-13')).left
        )
    })

    it('keeps the year view scroll area in the scheduler direction', () => {
        const { container } = rtl({ view: 'year' })
        expect(container.querySelector('[data-sch-year-grid] [dir]')?.getAttribute('dir')).toBe(
            'rtl'
        )
    })

    it('lays the week out from the right', () => {
        const { container } = rtl({})
        expect(rect(column(container, '2026-09-07')).left).toBeGreaterThan(
            rect(column(container, '2026-09-13')).left
        )
    })

    it('places the first overlapping event at the inline start of its column', () => {
        const { container } = rtl({
            events: [
                input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
                input('b', '2026-09-09T09:00', '2026-09-09T10:00')
            ]
        })
        const day = rect(column(container, '2026-09-09'))
        const first = rect(wrapper(container, 'a'))
        const second = rect(wrapper(container, 'b'))
        expect(near(first.right, day.right)).toBe(true)
        expect(near(second.left, day.left)).toBe(true)
        expect(first.left).toBeGreaterThan(second.left)
    })

    it('starts a multi-day span in the month view at the right edge of its first day', () => {
        const { container } = rtl({
            view: 'month',
            events: [input('trip', '2026-09-09', '2026-09-11', { allDay: true })]
        })
        const first = rect(container.querySelector('[data-sch-day="2026-09-09"]')!)
        const span = rect(wrapper(container, 'trip'))
        expect(near(span.right, first.right)).toBe(true)
        expect(span.left).toBeLessThan(first.left)
    })

    it('aligns chip text and the colour swatch to the inline start', () => {
        const { container } = rtl({
            events: [input('a', '2026-09-09T09:00', '2026-09-09T11:00')]
        })
        const chip = container.querySelector<HTMLElement>('[data-sch-event-id="a"]')!
        expect(getComputedStyle(chip).textAlign).toBe('start')
        const swatch = chip.querySelector('span')!
        expect(near(rect(swatch).right, rect(chip).right)).toBe(true)
    })

    it('mirrors the agenda arrow', () => {
        const { container } = rtl({
            view: 'agenda',
            events: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')]
        })
        const arrow = container.querySelector('[data-sch-agenda] [aria-hidden="true"]')!
        expect(getComputedStyle(arrow).scale).toBe('-1 1')
    })

    it('mirrors the previous and next chevrons in the toolbar', () => {
        const { container } = rtl({})
        const icons = ['Previous', 'Next'].map((label) =>
            container.querySelector(`button[aria-label="${label}"] svg`)!
        )
        for (const icon of icons) {
            expect(getComputedStyle(icon).scale).toBe('-1 1')
        }
    })

    it('fades a failed create out exactly where the chip stood on an RTL page', async () => {
        document.documentElement.setAttribute('dir', 'rtl')
        let reject!: (reason: unknown) => void
        const { container } = rtl({
            onMutate: () => new Promise<void>((_, r) => (reject = r))
        })
        const day = rect(column(container, '2026-09-10'))
        const grid = container.querySelector<HTMLElement>('[role="application"]')!
        grid.dispatchEvent(
            new MouseEvent('dblclick', {
                clientX: day.left + day.width / 2,
                clientY: day.top + 20 * 24 + 1,
                bubbles: true
            })
        )
        await settle()
        const optimistic = rect(container.querySelector('[data-sch-event]')!)

        reject(new Error('offline'))
        await settle()

        const clone = [...container.querySelectorAll<HTMLElement>('*')].find((element) =>
            element.getAnimations().some((animation) => animation.id === 'sch-return')
        )!
        expect(clone).toBeDefined()
        const ghost = rect(clone)
        expect(near(ghost.left, optimistic.left)).toBe(true)
        expect(near(ghost.top, optimistic.top)).toBe(true)
        expect(near(ghost.width, optimistic.width)).toBe(true)
    })

    it('creates an event in the column under the pointer', async () => {
        const onMutate = vi.fn()
        const { container } = rtl({ onMutate })
        const day = rect(column(container, '2026-09-10'))
        const grid = container.querySelector<HTMLElement>('[role="application"]')!
        grid.dispatchEvent(
            new MouseEvent('dblclick', {
                clientX: day.left + day.width / 2,
                clientY: day.top + 20 * 24 + 1,
                bubbles: true
            })
        )
        await settle()
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.after!.start.toString().slice(0, 16)).toBe('2026-09-10T10:00')
    })
})
