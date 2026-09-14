import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import ToolbarScheduler from '../fixtures/ToolbarScheduler.svelte'
import { anchor, input, wait } from '../fixtures/dom.js'

const settle = () => wait(60)
const probe = (root: Element, name: string) =>
    root.querySelector<HTMLElement>(`[data-probe-${name}]`)!
const firstColumn = (root: Element) =>
    root.querySelector<HTMLElement>('[data-sch-day-index="0"]:not([data-sch-all-day])')?.dataset
        .schDay

describe('toolbar snippet', () => {
    it('replaces the built-in toolbar and exposes the title and views', async () => {
        const { container } = render(ToolbarScheduler, { date: anchor })
        await settle()
        expect(container.querySelector('[data-sch-toolbar]')).toBeNull()
        expect(probe(container, 'title').textContent).toBe('Sep 7 – 13, 2026')
        const views = [...container.querySelectorAll<HTMLElement>('[data-probe-view]')]
        expect(views.map((button) => button.dataset.probeView)).toEqual([
            'day',
            'week',
            'month',
            'year',
            'agenda'
        ])
        expect(views.map((button) => button.textContent?.trim())).toEqual([
            'Day',
            'Week',
            'Month',
            'Year',
            'Agenda'
        ])
        expect(probe(container, 'view=week').getAttribute('aria-pressed')).toBe('true')
    })

    it('steps by the period of the active view, jumps to today and switches views', async () => {
        const { container } = render(ToolbarScheduler, { date: anchor })
        await settle()
        probe(container, 'next').click()
        await settle()
        expect(firstColumn(container)).toBe('2026-09-14')
        expect(probe(container, 'title').textContent).toBe('Sep 14 – 20, 2026')

        probe(container, 'view=month').click()
        await settle()
        expect(container.querySelector('[data-sch-month-grid]')).not.toBeNull()
        expect(probe(container, 'title').textContent).toBe('September 2026')
        probe(container, 'prev').click()
        await settle()
        expect(probe(container, 'title').textContent).toBe('August 2026')

        probe(container, 'view=week').click()
        probe(container, 'today').click()
        await settle()
        expect(firstColumn(container)).toBe('2026-09-07')
    })

    it('toggles the sidebar and reports its state', async () => {
        const { container } = render(ToolbarScheduler, {
            date: anchor,
            sidebar: true,
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')]
        })
        await settle()
        expect(container.querySelector('[data-sch-sidebar]')).not.toBeNull()
        expect(probe(container, 'menu').textContent?.trim()).toBe('Hide')
        probe(container, 'menu').click()
        await wait(400)
        expect(container.querySelector('[data-sch-sidebar]')).toBeNull()
        expect(probe(container, 'menu').textContent?.trim()).toBe('Show')
    })

    it('calls onMenu from the toggle when there is no sidebar', async () => {
        const onMenu = vi.fn()
        const { container } = render(ToolbarScheduler, { date: anchor, onMenu })
        await settle()
        probe(container, 'menu').click()
        expect(onMenu).toHaveBeenCalledTimes(1)
    })
})
