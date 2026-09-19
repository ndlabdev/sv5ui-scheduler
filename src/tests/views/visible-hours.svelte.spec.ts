import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { Mutation } from '../../lib/types/mutation.types.js'
import { ZONE, anchor, column, drag, grid, input, press, wait } from '../fixtures/dom.js'

const HOUR = 48

function mount(props: Record<string, unknown> = {}) {
    const onMutate = vi.fn()
    const screen = render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, dayStartHour: 7, dayEndHour: 20, onMutate, ...props }
    })
    screen.container.style.width = '1100px'
    screen.container.style.height = '900px'
    return { ...screen, onMutate }
}

describe('visible hours', () => {
    it('draws only the visible hours and clips events to them', async () => {
        const { container } = mount({
            events: [
                input('early', '2026-09-09T06:00', '2026-09-09T08:00'),
                input('late', '2026-09-09T21:00', '2026-09-09T22:00')
            ]
        })
        await wait(80)
        const wed = column(container, '2026-09-09')
        const top = wed.getBoundingClientRect().top
        expect(wed.getBoundingClientRect().height).toBeCloseTo(13 * HOUR, 0)
        const early = container.querySelector<HTMLElement>('[data-sch-event="early"]')!
        expect(early.getBoundingClientRect().top - top).toBeCloseTo(0, 0)
        expect(early.getBoundingClientRect().height).toBeCloseTo(HOUR, 0)
        expect(container.querySelector('[data-sch-event="late"]')).toBeNull()
    })

    it('creates an event at the clock time under the pointer', async () => {
        const { container, onMutate } = mount({ events: [] })
        await wait(80)
        const rect = column(container, '2026-09-09').getBoundingClientRect()
        const at = (minutes: number) => ({
            clientX: rect.left + rect.width / 2,
            clientY: rect.top + ((minutes - 420) / 30) * 24 + 1
        })
        await drag(grid(container), at(540), at(600))
        expect(onMutate).toHaveBeenCalledTimes(1)
        const mutation: Mutation = onMutate.mock.calls[0][0]
        expect([mutation.after!.start.hour, mutation.after!.start.minute]).toEqual([9, 0])
    })

    it('keeps the keyboard focus inside the visible hours', async () => {
        const { container } = mount({ events: [] })
        await wait(60)
        const target = grid(container)
        target.focus()
        press(target, 'Home')
        await wait(60)
        const ring = container.querySelector<HTMLElement>('[data-sch-focus]')!
        const day = ring.closest<HTMLElement>('[data-sch-day-index]')!
        expect(ring.getBoundingClientRect().top - day.getBoundingClientRect().top).toBeCloseTo(0, 0)
    })

    it('hides the current time line when now is outside the visible hours', async () => {
        const { container } = mount({ events: [], dayStartHour: 7, dayEndHour: 9 })
        await wait(60)
        expect(container.querySelector('[data-sch-now]')).toBeNull()
    })
})
