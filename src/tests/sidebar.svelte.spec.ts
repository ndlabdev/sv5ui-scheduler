import axe from 'axe-core'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { DateNavigator, Scheduler } from '../lib/index.js'
import SidebarScheduler from './fixtures/SidebarScheduler.svelte'
import { ZONE, anchor, column, input, wait } from './fixtures/dom.js'

const settle = () => wait(60)
const sidebar = (root: Element) => root.querySelector<HTMLElement>('[data-sch-sidebar]')
const menu = (root: Element) =>
    root.querySelector<HTMLElement>('button[aria-label="Toggle sidebar"]')!
const marked = (root: ParentNode) =>
    [...root.querySelectorAll<HTMLElement>('[data-marked]')].map((cell) =>
        cell.getAttribute('data-value')
    )

describe('DateNavigator', () => {
    const events = [
        input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
        input('trip', '2026-09-21', '2026-09-23', { allDay: true }),
        input('weekly', '2026-09-01T08:00', '2026-09-01T09:00', {
            recurrence: { freq: 'weekly', count: 3 }
        })
    ]

    it('dots the days that hold an event, including recurring ones', () => {
        const { container } = render(DateNavigator, {
            props: { date: anchor, events, timeZone: ZONE }
        })
        expect(marked(container)).toEqual([
            '2026-09-01',
            '2026-09-08',
            '2026-09-09',
            '2026-09-15',
            '2026-09-21',
            '2026-09-22'
        ])
    })

    it('reports the picked day at midnight in the scheduler zone and jumps to today', async () => {
        const onSelect = vi.fn()
        const screen = render(DateNavigator, {
            props: { date: anchor, timeZone: ZONE, onSelect }
        })
        await screen.getByRole('button', { name: /September 21/ }).click()
        expect(onSelect.mock.calls[0][0].toString()).toBe(
            '2026-09-21T00:00:00+07:00[Asia/Ho_Chi_Minh]'
        )
        await screen.getByRole('button', { name: 'Today' }).click()
        expect(onSelect.mock.calls[1][0].toString().slice(11, 16)).toBe('00:00')
    })

    it('follows the date it is given to another month', async () => {
        const screen = render(DateNavigator, { props: { date: anchor, timeZone: ZONE } })
        expect(screen.container.textContent).toContain('September 2026')
        await screen.rerender({ date: anchor.add({ months: 2 }) })
        expect(screen.container.textContent).toContain('November 2026')
    })
})

describe('Scheduler sidebar', () => {
    it('docks the sidebar beside the view and toggles it from the toolbar', async () => {
        const screen = render(SidebarScheduler, { date: anchor })
        const root = screen.container
        expect(sidebar(root)).not.toBeNull()
        expect(
            sidebar(root)?.querySelector<HTMLElement>('[data-probe-docked]')?.dataset.probeDocked
        ).toBe('true')
        const aside = sidebar(root)!.getBoundingClientRect()
        const grid = column(root, '2026-09-07').getBoundingClientRect()
        expect(aside.right).toBeLessThanOrEqual(grid.left + 1)

        menu(root).click()
        await settle()
        expect(sidebar(root)).toBeNull()
        expect(screen.component.isOpen()).toBe(false)
        menu(root).click()
        await settle()
        expect(sidebar(root)).not.toBeNull()
    })

    it('docks to the end side when asked', () => {
        const { container } = render(SidebarScheduler, { date: anchor, side: 'end' })
        const aside = sidebar(container)!.getBoundingClientRect()
        const grid = column(container, '2026-09-13').getBoundingClientRect()
        expect(aside.left).toBeGreaterThanOrEqual(grid.right - 1)
    })

    it('navigates and switches views from inside the snippet', async () => {
        const screen = render(SidebarScheduler, { date: anchor })
        const root = screen.container
        await screen.getByRole('button', { name: /September 21/ }).click()
        await settle()
        expect(column(root, '2026-09-21')).not.toBeNull()
        expect(
            sidebar(root)?.querySelector<HTMLElement>('[data-probe-date]')?.dataset.probeDate
        ).toBe('2026-09-21')
        root.querySelector<HTMLElement>('[data-probe-agenda]')!.click()
        await settle()
        expect(screen.component.getView()).toBe('agenda')
        root.querySelector<HTMLElement>('[data-probe-close]')!.click()
        await settle()
        expect(sidebar(root)).toBeNull()
    })

    it('becomes a slide-over below the breakpoint', async () => {
        const screen = render(SidebarScheduler, { date: anchor, width: 700 })
        const root = screen.container
        await settle()
        expect(sidebar(root)).toBeNull()
        expect(document.querySelector('[data-sch-sidebar]')).toBeNull()
        menu(root).click()
        await settle()
        const panel = document.querySelector<HTMLElement>('[role="dialog"] [data-sch-sidebar]')!
        expect(panel).not.toBeNull()
        expect(panel.querySelector<HTMLElement>('[data-probe-docked]')?.dataset.probeDocked).toBe(
            'false'
        )
        panel.querySelector<HTMLElement>('[data-probe-close]')!.click()
        await expect
            .poll(() => document.querySelector('[role="dialog"] [data-sch-sidebar]'))
            .toBeNull()
    })

    it('closes the slide-over after picking a day', async () => {
        const screen = render(SidebarScheduler, { date: anchor, width: 700 })
        await settle()
        menu(screen.container).click()
        await settle()
        await screen.getByRole('button', { name: /September 21/ }).click()
        await expect
            .poll(() => document.querySelector('[role="dialog"] [data-sch-sidebar]'))
            .toBeNull()
        expect(column(screen.container, '2026-09-21')).not.toBeNull()
    })

    it('shows the menu button only when there is something for it to do', () => {
        const bare = render(Scheduler, { props: { timeZone: ZONE, date: anchor } })
        expect(bare.container.querySelector('button[aria-label="Toggle sidebar"]')).toBeNull()
        bare.unmount()
        const withMenu = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, onMenu: () => {} }
        })
        expect(
            withMenu.container.querySelector('button[aria-label="Toggle sidebar"]')
        ).not.toBeNull()
    })
})

describe('sidebar accessibility', () => {
    const audit = async (target: Element) => {
        const result = await axe.run(target, {
            resultTypes: ['violations'],
            rules: { region: { enabled: false } }
        })
        return result.violations.map((violation) => violation.id)
    }

    it('is clean when docked and inside the slide-over', async () => {
        const docked = render(SidebarScheduler, {
            props: { date: anchor, events: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')] }
        })
        await settle()
        expect(await audit(docked.container)).toEqual([])
        docked.unmount()

        const narrow = render(SidebarScheduler, { date: anchor, width: 700 })
        await settle()
        menu(narrow.container).click()
        await wait(400)
        expect(document.querySelector('[role="dialog"] [data-sch-sidebar]')).not.toBeNull()
        expect(await audit(document.body)).toEqual([])
    })
})
