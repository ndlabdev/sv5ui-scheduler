import { createRawSnippet } from 'svelte'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { page, userEvent } from 'vitest/browser'
import { Scheduler } from '../../lib/index.js'
import { ZONE, anchor, input, tap, wait } from '../fixtures/dom.js'

const events = [
    input('a', '2026-09-09T09:00', '2026-09-09T10:00', { calendarId: 'work' }),
    input('b', '2026-09-13T11:00', '2026-09-13T12:00')
]

const settle = () => wait(150)

function mount(width: number, props: Record<string, unknown> = {}) {
    const screen = render(Scheduler, {
        props: {
            timeZone: ZONE,
            date: anchor,
            events,
            weekNumbers: true,
            holidays: [{ date: '2026-09-10', title: 'Founders day' }],
            ...props
        }
    })
    screen.container.style.width = `${width}px`
    screen.container.style.height = '760px'
    return screen
}

const root = (container: Element) => container.querySelector<HTMLElement>('[data-sch-scheduler]')!
const toolbar = (container: Element) => container.querySelector<HTMLElement>('[data-sch-toolbar]')!
const title = (container: Element) => toolbar(container).querySelector('h2')?.textContent?.trim()
const columns = (container: Element) =>
    [
        ...container.querySelectorAll<HTMLElement>('[data-sch-day-index]:not([data-sch-all-day])')
    ].map((cell) => cell.dataset.schDay)

describe('on a phone', () => {
    beforeEach(async () => {
        await page.viewport(390, 844)
    })

    afterEach(async () => {
        await page.viewport(1280, 900)
    })

    it('shows three days from the current date in the week view and steps by three', async () => {
        const screen = mount(390)
        await settle()
        expect(columns(screen.container)).toEqual(['2026-09-09', '2026-09-10', '2026-09-11'])
        expect(title(screen.container)).toBe('Sep 9 – 11')
        await screen.getByRole('button', { name: 'Next' }).click()
        await settle()
        expect(columns(screen.container)).toEqual(['2026-09-12', '2026-09-13', '2026-09-14'])
    })

    it('keeps the whole week when compactDays is null', async () => {
        const screen = mount(390, { compactDays: null })
        await settle()
        expect(columns(screen.container)).toHaveLength(7)
    })

    it('fits the toolbar on one row with touch sized controls and a view menu', async () => {
        const screen = mount(390)
        await settle()
        const bar = toolbar(screen.container)
        expect(bar.hasAttribute('data-sch-compact')).toBe(true)
        expect(bar.querySelector('[role="tablist"]')).toBeNull()
        expect(bar.getBoundingClientRect().height).toBeLessThan(56)
        for (const button of bar.querySelectorAll<HTMLElement>('button')) {
            const box = button.getBoundingClientRect()
            expect(
                Math.min(box.width, box.height),
                button.getAttribute('aria-label') ?? ''
            ).toBeGreaterThanOrEqual(32)
        }
        const heading = bar.querySelector<HTMLElement>('h2')!
        expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1)

        await userEvent.click(
            bar.querySelector<HTMLElement>(
                '[role="group"] button, [role="group"] [role="combobox"]'
            )!
        )
        await userEvent.click(screen.getByRole('option', { name: 'Month' }))
        await settle()
        expect(screen.container.querySelector('[data-sch-month-grid]')).not.toBeNull()
        expect(title(screen.container)).toBe('Sep 2026')
    })

    it.each([
        [
            'with toolbar actions',
            {
                toolbarActions: createRawSnippet(() => ({
                    render: () => '<button type="button" style="width: 134px">Create event</button>'
                }))
            }
        ],
        ['in Vietnamese', { locale: 'vi-VN' }]
    ])('keeps the title readable %s', async (_, props) => {
        const screen = mount(390, props)
        await settle()
        const heading = toolbar(screen.container).querySelector<HTMLElement>('h2')!
        expect(heading.clientWidth).toBeGreaterThan(60)
        expect(heading.scrollWidth).toBeLessThanOrEqual(heading.clientWidth + 1)
        const scrollWidth = document.documentElement.scrollWidth
        expect(scrollWidth).toBeLessThanOrEqual(window.innerWidth)
    })

    it('opens event details in a slide-over inside the calendar instead of a popover', async () => {
        const screen = mount(390)
        await settle()
        tap(screen.container.querySelector('[data-sch-event-id="a"]')!)
        await wait(400)
        expect(document.querySelector('[data-sch-detail]')).toBeNull()
        const body = document.querySelector<HTMLElement>('[data-sch-event-panel="a"]')
        expect(body).not.toBeNull()
        expect(root(screen.container).contains(body)).toBe(true)
    })

    it('keeps every event popover inside the screen and the page from scrolling sideways', async () => {
        const hour = (value: number) => String(value).padStart(2, '0')
        const many = Array.from({ length: 7 }, (_, index) => {
            const day = `2026-09-${hour(7 + index)}`
            const start = 8 + (index % 2)
            return input(`e${index}`, `${day}T${hour(start)}:00`, `${day}T${hour(start + 1)}:00`)
        })
        const screen = mount(390, { compactBreakpoint: 0, events: many })
        await settle()
        expect(columns(screen.container)).toHaveLength(7)
        const viewport = screen.container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
        viewport.scrollTop = 7 * 48
        await settle()
        for (const event of many) {
            tap(screen.container.querySelector(`[data-sch-event-id="${event.id}"]`)!)
            await wait(350)
            const card = document.querySelector<HTMLElement>(`[data-sch-detail="${event.id}"]`)!
            expect(card, event.id).not.toBeNull()
            const box = card.getBoundingClientRect()
            expect(box.left, event.id).toBeGreaterThanOrEqual(0)
            expect(box.right, event.id).toBeLessThanOrEqual(window.innerWidth)
            expect(document.documentElement.scrollWidth, event.id).toBeLessThanOrEqual(
                window.innerWidth
            )
            document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
            await wait(250)
        }
    })

    it('drops week numbers and holiday names from narrow month cells', async () => {
        const narrow = mount(390, { view: 'month' })
        await settle()
        const grid = narrow.container.querySelector('[data-sch-month-grid]')!
        expect(grid.textContent).not.toContain('W37')
        expect(grid.querySelector('[data-sch-holiday-title]')).toBeNull()
    })
})

describe('on a wide screen', () => {
    it('keeps the full toolbar, the whole week, long titles and the popover', async () => {
        const screen = mount(1100)
        await settle()
        expect(toolbar(screen.container).hasAttribute('data-sch-compact')).toBe(false)
        expect(toolbar(screen.container).querySelector('[role="tablist"]')).not.toBeNull()
        expect(columns(screen.container)).toHaveLength(7)
        expect(title(screen.container)).toBe('Sep 7 – 13, 2026')
        tap(screen.container.querySelector('[data-sch-event-id="a"]')!)
        await wait(400)
        expect(document.querySelector('[data-sch-detail="a"]')).not.toBeNull()
        expect(document.querySelector('[data-sch-event-panel]')).toBeNull()
    })

    it('keeps week numbers and holiday names in month cells', async () => {
        const screen = mount(1100, { view: 'month' })
        await settle()
        const grid = screen.container.querySelector('[data-sch-month-grid]')!
        expect(grid.textContent).toContain('W37')
        expect(grid.querySelector('[data-sch-holiday-title]')).not.toBeNull()
    })
})
