import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import BoundScheduler from '../fixtures/BoundScheduler.svelte'
import {
    ZONE,
    anchor,
    centre,
    column,
    frame,
    grid,
    input,
    pointer,
    settle
} from '../fixtures/dom.js'

const TODAY = '2026-09-13'
const TRANSPARENT = 'rgba(0, 0, 0, 0)'

describe('time grid parts', () => {
    it('draws the now line only in the column of today', () => {
        const { container } = render(Scheduler, { timeZone: ZONE, date: anchor })
        const lines = container.querySelectorAll('[data-sch-now]')
        expect(lines).toHaveLength(1)
        expect(lines[0].closest('[data-sch-day-index]')?.getAttribute('data-sch-day')).toBe(TODAY)
    })

    it('draws the keyboard focus ring in the focused column only', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor })
        const target = grid(screen.container)
        target.focus()
        target.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }))
        await frame()
        expect(screen.container.querySelectorAll('[data-sch-focus]')).toHaveLength(1)
    })

    it('hides the all-day chip being dragged while its ghost moves', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('fest', '2026-09-08', '2026-09-09', { allDay: true })],
            date: anchor
        })
        const fest = screen.container.querySelector<HTMLElement>('[data-sch-event="fest"]')!
        const cell = screen.container.querySelector('[data-sch-day-index="3"][data-sch-all-day]')!
        const target = centre(cell)
        fest.dispatchEvent(pointer('pointerdown', centre(fest)))
        fest.dispatchEvent(pointer('pointermove', target))
        await frame()
        expect(screen.container.querySelector('[data-sch-ghost]')).not.toBeNull()
        expect(getComputedStyle(fest).visibility).toBe('hidden')
        fest.dispatchEvent(pointer('pointerup', target))
        await settle()
        const dropped = screen.container.querySelector<HTMLElement>('[data-sch-event="fest"]')!
        expect(getComputedStyle(dropped).visibility).toBe('visible')
    })

    it('tints the column of today in the week view but not in the day view', () => {
        const week = render(Scheduler, { timeZone: ZONE, date: anchor })
        const day = render(Scheduler, {
            timeZone: ZONE,
            date: anchor.set({ day: 13 }),
            view: 'day'
        })
        expect(getComputedStyle(column(week.container, TODAY)).backgroundColor).not.toBe(
            TRANSPARENT
        )
        expect(getComputedStyle(column(day.container, TODAY)).backgroundColor).toBe(TRANSPARENT)
    })
})
