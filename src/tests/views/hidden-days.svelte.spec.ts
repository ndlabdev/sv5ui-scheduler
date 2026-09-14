import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { Mutation } from '../../lib/types/mutation.types.js'
import { ZONE, anchor, column, drag, grid, input, pointAt, press, wait } from '../fixtures/dom.js'

function mount(props: Record<string, unknown>) {
    const onMutate = vi.fn()
    const screen = render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, hiddenDays: [0, 6], onMutate, ...props }
    })
    screen.container.style.width = '1100px'
    screen.container.style.height = '900px'
    return { ...screen, onMutate }
}

const timeColumns = (container: Element) =>
    [
        ...container.querySelectorAll<HTMLElement>('[data-sch-day-index]:not([data-sch-all-day])')
    ].map((cell) => cell.dataset.schDay)

describe('hidden days', () => {
    it('leaves the weekend out of the week view', async () => {
        const { container } = mount({ events: [] })
        await wait(60)
        expect(timeColumns(container)).toEqual([
            '2026-09-07',
            '2026-09-08',
            '2026-09-09',
            '2026-09-10',
            '2026-09-11'
        ])
    })

    it('draws five columns in the month view and splits spans across the weekend', async () => {
        const { container } = mount({
            view: 'month',
            events: [
                input('saturday', '2026-09-12T10:00', '2026-09-12T11:00'),
                input('trip', '2026-09-10', '2026-09-16', { allDay: true })
            ]
        })
        await wait(80)
        const header = container.querySelector('[data-sch-month-grid] > :first-child')!
        expect(header.children).toHaveLength(5)
        const cells = [...container.querySelectorAll<HTMLElement>('[data-sch-day-cell]')]
        expect(
            cells.every(
                (cell) => ![0, 6].includes(new Date(`${cell.dataset.schDay}T12:00`).getDay())
            )
        ).toBe(true)
        expect(getComputedStyle(cells[4]).borderInlineEndWidth).toBe('0px')
        expect(getComputedStyle(cells[3]).borderInlineEndWidth).not.toBe('0px')
        expect(container.querySelector('[data-sch-event="saturday"]')).toBeNull()
        expect(
            container.querySelectorAll('[data-sch-month-grid] [data-sch-event="trip"]')
        ).toHaveLength(2)
    })

    it('steps from Friday to the next Monday with the keyboard', async () => {
        const { container } = mount({ events: [] })
        await wait(60)
        const target = grid(container)
        target.focus()
        for (let index = 0; index < 5; index += 1) press(target, 'ArrowRight')
        await wait(60)
        expect(container.querySelector('h2')?.textContent).toContain('Sep 14')
        expect(timeColumns(container)[0]).toBe('2026-09-14')
    })

    it('creates events on the days that remain', async () => {
        const { container, onMutate } = mount({ events: [] })
        await wait(60)
        const friday = column(container, '2026-09-11')
        await drag(grid(container), pointAt(friday, 540), pointAt(friday, 600))
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect(mutation.after!.start.toString().slice(0, 16)).toBe('2026-09-11T09:00')
    })

    it('still shows a hidden day in the day view', async () => {
        const { container } = mount({ view: 'day', date: anchor.set({ day: 12 }), events: [] })
        await wait(60)
        expect(timeColumns(container)).toEqual(['2026-09-12'])
    })
})
