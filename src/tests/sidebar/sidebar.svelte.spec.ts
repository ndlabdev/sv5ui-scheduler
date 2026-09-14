import { createRawSnippet } from 'svelte'
import axe from 'axe-core'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { DateNavigator, Scheduler } from '../../lib/index.js'
import SidebarScheduler from '../fixtures/SidebarScheduler.svelte'
import { userEvent } from 'vitest/browser'
import { ZONE, anchor, centre, column, drag, input, pointer, wait } from '../fixtures/dom.js'

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
        await expect.poll(() => sidebar(root)).toBeNull()
        expect(screen.component.isOpen()).toBe(false)
        menu(root).click()
        await settle()
        expect(sidebar(root)).not.toBeNull()
    })

    it('reports the panel state on the menu button', async () => {
        const screen = render(SidebarScheduler, { date: anchor })
        const root = screen.container
        await settle()
        expect(menu(root).getAttribute('aria-expanded')).toBe('true')
        menu(root).click()
        await settle()
        expect(menu(root).getAttribute('aria-expanded')).toBe('false')
    })

    it('slides the docked panel closed and open instead of snapping', async () => {
        const screen = render(SidebarScheduler, { date: anchor })
        const root = screen.container
        await settle()
        const full = sidebar(root)!.getBoundingClientRect().width
        menu(root).click()
        await wait(90)
        const closing = sidebar(root)
        expect(closing).not.toBeNull()
        const midway = closing!.getBoundingClientRect().width
        expect(midway).toBeGreaterThan(0)
        expect(midway).toBeLessThan(full)
        const inner = closing!.querySelector<HTMLElement>(
            '[data-sch-default-sidebar], [data-probe-docked]'
        )!
        expect(inner.getBoundingClientRect().width).toBeGreaterThan(midway)
        await expect.poll(() => sidebar(root)).toBeNull()

        menu(root).click()
        await wait(90)
        const opening = sidebar(root)!.getBoundingClientRect().width
        expect(opening).toBeLessThan(full)
        await expect.poll(() => sidebar(root)!.getBoundingClientRect().width).toBe(full)
    })

    it('snaps without sliding when the user asks for reduced motion', async () => {
        const original = window.matchMedia
        window.matchMedia = ((query: string) => ({
            ...original.call(window, query),
            matches: query.includes('prefers-reduced-motion'),
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {}
        })) as typeof window.matchMedia
        try {
            const screen = render(SidebarScheduler, { date: anchor })
            const root = screen.container
            await settle()
            menu(root).click()
            await wait(40)
            expect(sidebar(root)).toBeNull()
        } finally {
            window.matchMedia = original
        }
    })

    it('reports the slide-over state on the menu button too', async () => {
        const screen = render(SidebarScheduler, { date: anchor, width: 700 })
        await settle()
        expect(menu(screen.container).getAttribute('aria-expanded')).toBe('false')
        menu(screen.container).click()
        await settle()
        expect(menu(screen.container).getAttribute('aria-expanded')).toBe('true')
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
        await expect.poll(() => sidebar(root)).toBeNull()
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

describe('selected day sync', () => {
    const selectedInNavigator = (root: Element) =>
        root.querySelector('[data-sch-date-navigator] [data-selected]')?.getAttribute('data-value')
    const anchorCell = (root: Element) =>
        root.querySelector('[data-sch-month-grid] [data-sch-anchor]')?.getAttribute('data-sch-day')

    it('marks the picked day in the month grid when the navigator changes it', async () => {
        const screen = render(SidebarScheduler, { props: { date: anchor, view: 'month' } })
        const root = screen.container
        expect(anchorCell(root)).toBe('2026-09-09')
        await screen.getByRole('button', { name: /September 18/ }).click()
        await settle()
        expect(anchorCell(root)).toBe('2026-09-18')
        expect(selectedInNavigator(root)).toBe('2026-09-18')
        const number = root.querySelector('[data-sch-anchor] span')!
        expect(number.className).toContain('ring-primary')
    })

    it('selects the day in the navigator when a month cell is clicked, and only then', async () => {
        const screen = render(SidebarScheduler, {
            props: {
                date: anchor,
                view: 'month',
                events: [input('a', '2026-09-16T09:00', '2026-09-16T10:00')]
            }
        })
        const root = screen.container
        const cell = root.querySelector<HTMLElement>('[data-sch-day="2026-09-22"]')!
        await userEvent.click(cell, { position: { x: 20, y: cell.clientHeight - 10 } })
        await settle()
        expect(selectedInNavigator(root)).toBe('2026-09-22')
        expect(anchorCell(root)).toBe('2026-09-22')

        await userEvent.click(root.querySelector<HTMLElement>('[data-sch-event-id="a"]')!)
        await settle()
        expect(selectedInNavigator(root)).toBe('2026-09-22')

        const target = root.querySelector<HTMLElement>('[data-sch-day="2026-09-24"]')!
        const from = centre(target)
        const to = centre(root.querySelector<HTMLElement>('[data-sch-day="2026-09-25"]')!)
        await drag(
            root.querySelector<HTMLElement>('[data-sch-month-grid] [role="application"]')!,
            from,
            to
        )
        expect(selectedInNavigator(root)).toBe('2026-09-22')
    })

    it('selects the day from a quick touch tap too', async () => {
        const screen = render(SidebarScheduler, { props: { date: anchor, view: 'month' } })
        const root = screen.container
        const grid = root.querySelector<HTMLElement>('[data-sch-month-grid] [role="application"]')!
        const cell = root.querySelector<HTMLElement>('[data-sch-day="2026-09-23"]')!
        const at = centre(cell)
        grid.dispatchEvent(pointer('pointerdown', at, 'touch'))
        await wait(40)
        grid.dispatchEvent(pointer('pointerup', at, 'touch'))
        await settle()
        expect(selectedInNavigator(root)).toBe('2026-09-23')
    })

    it('outlines the picked day in the week header', async () => {
        const screen = render(SidebarScheduler, { props: { date: anchor } })
        const root = screen.container
        await screen.getByRole('button', { name: /September 11/ }).click()
        await settle()
        const header = root.querySelector('[data-sch-time-grid] [data-sch-anchor]')
        expect(header?.getAttribute('data-sch-day')).toBe('2026-09-11')
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

describe('built-in sidebar', () => {
    const calendars = [
        { id: 'work', title: 'Work', color: 'info' as const },
        { id: 'home', title: 'Personal', color: 'success' as const }
    ]
    const events = [
        input('standup', '2026-09-09T09:00', '2026-09-09T09:30', { calendarId: 'work' }),
        input('gym', '2026-09-09T18:00', '2026-09-09T19:00', { calendarId: 'home' })
    ]
    const shownIds = (root: Element) =>
        [...root.querySelectorAll<HTMLElement>('[data-sch-event-id]')]
            .map((chip) => chip.dataset.schEventId)
            .sort()

    async function boot(props: Record<string, unknown> = {}, width = 1200) {
        const screen = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                sidebar: true,
                events,
                calendars,
                dragSources: [{ title: 'Dentist', durationMinutes: 45 }],
                ...props
            }
        })
        screen.container.style.width = `${width}px`
        screen.container.style.height = '800px'
        await settle()
        return screen
    }

    it('stacks the navigator, search, calendars and drag list in the docked panel', async () => {
        const { container } = await boot()
        const panel = sidebar(container)!
        const parts = [
            '[data-sch-date-navigator]',
            '[data-sch-search-box]',
            '[data-sch-calendar-list]',
            '[data-sch-drag-source-list]'
        ].map((selector) => panel.querySelector(selector)!)
        expect(parts.every(Boolean)).toBe(true)
        for (let i = 1; i < parts.length; i += 1) {
            expect(
                parts[i - 1].compareDocumentPosition(parts[i]) & Node.DOCUMENT_POSITION_FOLLOWING
            ).toBeTruthy()
        }
    })

    it('hides calendars and searches without any binding in the app', async () => {
        const screen = await boot()
        expect(shownIds(screen.container)).toEqual(['gym', 'standup'])
        await screen.getByRole('checkbox', { name: 'Work' }).click()
        await settle()
        expect(shownIds(screen.container)).toEqual(['gym'])
        await screen.getByRole('checkbox', { name: 'Work' }).click()
        await userEvent.fill(screen.getByRole('textbox', { name: 'Search events' }), 'stand')
        await settle()
        expect(shownIds(screen.container)).toEqual(['standup'])
    })

    it('leaves out the calendar list and the drag list when there is nothing to list', async () => {
        const { container } = await boot({ calendars: [], dragSources: [] })
        const panel = sidebar(container)!
        expect(panel.querySelector('[data-sch-date-navigator]')).not.toBeNull()
        expect(panel.querySelector('[data-sch-calendar-list]')).toBeNull()
        expect(panel.querySelector('[data-sch-drag-source-list]')).toBeNull()
    })

    it('renders the header and footer snippets around the built-in parts', async () => {
        const sidebarHeader = createRawSnippet(() => ({
            render: () => '<button type="button" data-probe-header>Create</button>'
        }))
        const sidebarFooter = createRawSnippet(() => ({
            render: () => '<p data-probe-footer>foot</p>'
        }))
        const { container } = await boot({ sidebarHeader, sidebarFooter })
        const panel = sidebar(container)!
        const head = panel.querySelector('[data-probe-header]')!
        const foot = panel.querySelector('[data-probe-footer]')!
        const navigator = panel.querySelector('[data-sch-date-navigator]')!
        expect(
            head.compareDocumentPosition(navigator) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
        expect(
            navigator.compareDocumentPosition(foot) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy()
    })

    it('opens the same built-in panel as a slide-over when narrow', async () => {
        const { container } = await boot({}, 700)
        expect(sidebar(container)).toBeNull()
        menu(container).click()
        await wait(400)
        const panel = document.querySelector('[role="dialog"] [data-sch-default-sidebar]')
        expect(panel).not.toBeNull()
        expect(panel!.querySelector('[data-sch-calendar-list]')).not.toBeNull()
        const result = await axe.run(document.body, {
            resultTypes: ['violations'],
            rules: { region: { enabled: false } }
        })
        expect(result.violations.map((violation) => violation.id)).toEqual([])
    })

    it('scrolls the docked panel inside the sv5ui ScrollArea, not the aside itself', async () => {
        const many = Array.from({ length: 30 }, (_, i) => ({
            id: `c${i}`,
            title: `Calendar ${i}`
        }))
        const { container } = await boot({ calendars: many })
        container.style.height = '500px'
        await settle()
        const aside = sidebar(container)!
        const viewport = aside.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        expect(viewport).not.toBeNull()
        expect(viewport.querySelector('[data-sch-default-sidebar]')).not.toBeNull()
        expect(['auto', 'scroll']).not.toContain(getComputedStyle(aside).overflowY)
        expect(aside.scrollHeight).toBeLessThanOrEqual(aside.clientHeight + 1)
        expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight)
        viewport.scrollTop = 200
        expect(viewport.scrollTop).toBeGreaterThan(0)
    })

    it('gives the sidebar scroll area the scheduler direction', async () => {
        const { container } = await boot({ dir: 'rtl' })
        expect(sidebar(container)!.querySelector('[dir]')?.getAttribute('dir')).toBe('rtl')
    })

    it('has no axe violations when docked', async () => {
        const { container } = await boot()
        const result = await axe.run(container, {
            resultTypes: ['violations'],
            rules: { region: { enabled: false } }
        })
        expect(result.violations.map((violation) => violation.id)).toEqual([])
    })
})
