import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it, vi } from 'vitest'
import { userEvent } from 'vitest/browser'
import { createRawSnippet } from 'svelte'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import BoundScheduler from '../fixtures/BoundScheduler.svelte'
import { ZONE, anchor, input, press, tap, wait } from '../fixtures/dom.js'

const settle = () => wait(60)
const title = (container: Element) => container.querySelector('h2')?.textContent?.trim()
const viewOf = (container: Element) =>
    container.querySelector('[data-sch-view]')?.getAttribute('data-sch-view')

describe('year view', () => {
    const events = [
        input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
        input('b', '2026-12-24', '2026-12-26', { allDay: true })
    ]

    it('renders twelve months and marks the days that hold events', () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'year', events }
        })
        expect(container.querySelectorAll('[data-sch-month]')).toHaveLength(12)
        expect(title(container)).toBe('2026')
        const busy = [...container.querySelectorAll('[data-sch-busy]')].map((d) =>
            d.getAttribute('data-sch-day')
        )
        expect(busy).toEqual(['2026-09-09', '2026-12-24', '2026-12-25'])
    })

    it('opens the day view when a day is clicked', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'year', events }
        })
        container.querySelector<HTMLElement>('button[data-sch-day="2026-09-09"]')!.click()
        await settle()
        expect(viewOf(container)).toBe('day')
        expect(title(container)).toBe('September 9, 2026')
    })

    it('opens the month view from a month heading', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'year', events }
        })
        container.querySelector<HTMLElement>('[data-sch-month="3"] button')!.click()
        await settle()
        expect(viewOf(container)).toBe('month')
        expect(title(container)).toBe('March 2026')
    })

    it('steps a whole year at a time', async () => {
        const screen = render(Scheduler, { props: { timeZone: ZONE, date: anchor, view: 'year' } })
        await screen.getByRole('button', { name: 'Next' }).click()
        expect(title(screen.container)).toBe('2027')
    })
})

describe('event detail popover', () => {
    it('opens on click with the date and time, and deletes through the pipeline', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate,
            date: anchor
        })
        tap(screen.container.querySelector('[data-sch-event-id="a"]')!)
        await settle()

        const detail = document.querySelector('[data-sch-detail="a"]')
        expect(detail).not.toBeNull()
        expect(detail?.textContent).toContain('Wednesday, September 9, 2026')
        expect(detail?.textContent).toContain('9:00')

        detail!.querySelector<HTMLElement>('button[aria-label="Delete event"]')!.click()
        await settle()
        expect(onMutate).toHaveBeenCalledWith(
            expect.objectContaining({ kind: 'delete', eventId: 'a' })
        )
        expect(screen.component.getEvents()).toHaveLength(0)
    })

    it('offers no delete for a locked event', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00', { editable: false })],
            date: anchor
        })
        tap(screen.container.querySelector('[data-sch-event-id="a"]')!)
        await settle()
        const detail = document.querySelector('[data-sch-detail="a"]')
        expect(detail).not.toBeNull()
        expect(detail?.querySelector('button[aria-label="Delete event"]')).toBeNull()
    })

    it('exposes its state on the chip itself and toggles on repeated clicks', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor
        })
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event-id="a"]')!
        expect(chip.getAttribute('aria-haspopup')).toBe('dialog')
        expect(chip.getAttribute('aria-expanded')).toBe('false')
        expect(screen.container.querySelector('[aria-haspopup]:not(button)')).toBeNull()

        tap(chip)
        await settle()
        expect(chip.getAttribute('aria-expanded')).toBe('true')
        expect(chip.getAttribute('aria-pressed')).toBe('true')
        expect(document.querySelector('[data-sch-detail="a"]')).not.toBeNull()

        tap(chip)
        await expect.poll(() => document.querySelector('[data-sch-detail="a"]')).toBeNull()
        expect(chip.getAttribute('aria-expanded')).toBe('false')
    })

    it('closes on Escape and gives focus back to the chip', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor
        })
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event-id="a"]')!
        tap(chip)
        await settle()
        const close = document.querySelector<HTMLElement>('[data-sch-detail="a"] button')!
        close.focus()
        close.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
        await expect.poll(() => document.querySelector('[data-sch-detail="a"]')).toBeNull()
        await expect.poll(() => document.activeElement).toBe(chip)
    })

    it('exposes the overflow list state on the more button', async () => {
        const many = Array.from({ length: 8 }, (_, i) =>
            input(`m${i}`, '2026-09-09T09:00', '2026-09-09T10:00')
        )
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'month', events: many }
        })
        container.style.height = '600px'
        await settle()
        const more = container.querySelector<HTMLElement>('[data-sch-more="2026-09-09"]')!
        expect(more.getAttribute('aria-haspopup')).toBe('dialog')
        expect(more.getAttribute('aria-expanded')).toBe('false')
        tap(more)
        await settle()
        expect(more.getAttribute('aria-expanded')).toBe('true')
        expect(document.querySelector('[data-sch-more-list="2026-09-09"]')).not.toBeNull()
    })

    it.each(['week', 'month'])('opens from a real click in the %s view', async (view) => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor,
            view
        })
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event-id="a"]')!
        await userEvent.click(chip)
        await expect.poll(() => document.querySelector('[data-sch-detail="a"]')).not.toBeNull()
        expect(chip.getAttribute('aria-expanded')).toBe('true')
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
    })

    it('does not lift or dim the chip on a plain pointer down', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            date: anchor,
            view: 'month'
        })
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const rect = wrapper.getBoundingClientRect()
        wrapper.dispatchEvent(
            new PointerEvent('pointerdown', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.top + rect.height / 2,
                pointerId: 1,
                bubbles: true,
                isPrimary: true,
                button: 0
            })
        )
        await wait(30)
        expect(getComputedStyle(wrapper).visibility).toBe('visible')
        expect(screen.container.querySelector('[data-sch-ghost]')).toBeNull()
    })

    it('can be turned off', async () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                detailPopover: false,
                events: [input('z', '2026-09-09T09:00', '2026-09-09T10:00')]
            }
        })
        tap(container.querySelector('[data-sch-event-id="z"]')!)
        await settle()
        expect(document.querySelector('[data-sch-detail="z"]')).toBeNull()
    })
})

describe('verification fixes for the reference UI', () => {
    const gutterLabels = (container: Element) =>
        [...container.querySelectorAll('[data-sch-time-grid] [aria-hidden="true"] > span')].map(
            (span) => span.textContent?.trim() ?? ''
        )

    it('labels every hour exactly once on a DST start day', async () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: 'America/New_York',
                date: parseZonedDateTime('2026-03-08T12:00[America/New_York]'),
                view: 'day',
                hour12: false
            }
        })
        await settle()
        const labels = gutterLabels(container)
        expect(labels.slice(0, 3)).toEqual(['01:00', '02:00', '03:00'])
        expect(new Set(labels).size).toBe(labels.length)
    })

    it('shows real times for a long timed event and the full span of a multi-day all-day event', async () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                view: 'month',
                events: [
                    input('trip', '2026-09-08T09:00', '2026-09-10T18:00'),
                    input('fest', '2026-09-11', '2026-09-14', { allDay: true })
                ]
            }
        })
        await settle()
        const detailOf = async (id: string) => {
            tap(container.querySelector(`[data-sch-event-id="${id}"]`)!)
            await settle()
            return document.querySelector(`[data-sch-detail="${id}"]`)?.textContent ?? ''
        }
        const trip = await detailOf('trip')
        expect(trip).not.toContain('All day')
        expect(trip).toContain('9:00')
        expect(trip).toContain('6:00')
        const fest = await detailOf('fest')
        expect(fest).toContain('All day')
        expect(fest).toContain('Sep 11')
        expect(fest).toContain('13, 2026')
    })

    it('reaches the more link by keyboard and lists every event of that day', async () => {
        const many = Array.from({ length: 8 }, (_, i) =>
            input(`e${i}`, `2026-09-09T0${i + 1}:00`, `2026-09-09T0${i + 1}:30`)
        )
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'month', events: many }
        })
        await settle()
        const more = container.querySelector<HTMLElement>('[data-sch-more="2026-09-09"]')!
        expect(more.tagName).toBe('BUTTON')
        more.dispatchEvent(
            new PointerEvent('pointerdown', {
                bubbles: true,
                pointerId: 1,
                button: 0,
                isPrimary: true
            })
        )
        expect(container.querySelector('[data-sch-ghost]')).toBeNull()
        more.dispatchEvent(
            new PointerEvent('pointerup', {
                bubbles: true,
                pointerId: 1,
                button: 0,
                isPrimary: true
            })
        )
        more.click()
        await settle()
        const list = document.querySelector('[data-sch-more-list="2026-09-09"]')
        expect(list?.querySelectorAll('[data-sch-event-id]')).toHaveLength(8)
    })

    it('does not create an event when Enter is pressed on a focused event', async () => {
        const onMutate = vi.fn()
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            onMutate,
            date: anchor
        })
        const grid = screen.container.querySelector<HTMLElement>('[role="application"]')!
        grid.focus()
        await settle()
        press(screen.container.querySelector('[data-sch-event-id="a"]')!, 'Enter')
        await settle()
        expect(onMutate).not.toHaveBeenCalled()
    })

    it('tints the today column only when today is in the visible month', async () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: parseZonedDateTime('2031-01-15T12:00[Asia/Ho_Chi_Minh]'),
                view: 'month'
            }
        })
        await settle()
        expect(container.querySelector('[data-sch-day].bg-primary\\/5')).toBeNull()
        expect(container.querySelector('[data-sch-day="2031-01-15"]')?.getAttribute('role')).toBe(
            'group'
        )
    })
})

describe('toolbar layout', () => {
    it('keeps application actions inside the toolbar next to the view switcher', async () => {
        const toolbarActions = createRawSnippet(() => ({
            render: () =>
                '<span style="display:inline-flex;gap:4px"><button data-action>One</button><button data-action>Two</button></span>'
        }))
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, toolbarActions }
        })
        await settle()
        const toolbar = container
            .querySelector<HTMLElement>('[data-sch-toolbar]')!
            .getBoundingClientRect()
        const tablist = container
            .querySelector<HTMLElement>('[role="tablist"]')!
            .getBoundingClientRect()
        const actions = [...container.querySelectorAll<HTMLElement>('[data-action]')].map(
            (button) => button.getBoundingClientRect()
        )
        expect(actions).toHaveLength(2)
        for (const action of actions) {
            expect(action.right).toBeLessThanOrEqual(toolbar.right)
            expect(action.left).toBeGreaterThanOrEqual(tablist.right)
        }
    })
})

describe('pointer affordances', () => {
    it('shows a grab cursor on draggable chips and a pointer on locked ones', () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: ZONE,
                date: anchor,
                events: [
                    input('free', '2026-09-09T09:00', '2026-09-09T10:00'),
                    input('locked', '2026-09-10T09:00', '2026-09-10T10:00', { editable: false }),
                    input('trip', '2026-09-08', '2026-09-10', { allDay: true })
                ]
            }
        })
        const cursor = (id: string) =>
            getComputedStyle(container.querySelector(`[data-sch-event-id="${id}"]`)!).cursor
        expect(cursor('free')).toBe('grab')
        expect(cursor('trip')).toBe('grab')
        expect(cursor('locked')).toBe('pointer')

        const wrapper = container.querySelector<HTMLElement>('[data-sch-event="free"]')!
        const rect = wrapper.getBoundingClientRect()
        wrapper.dispatchEvent(
            new PointerEvent('pointermove', {
                clientX: rect.left + rect.width / 2,
                clientY: rect.bottom - 2,
                bubbles: true
            })
        )
        expect(cursor('free')).toBe('ns-resize')
        wrapper.dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))
        expect(cursor('free')).toBe('grab')
    })

    it('outlines a selected chip in its own colour with a gap, not a primary inset ring', async () => {
        const screen = render(BoundScheduler, {
            initial: [input('a', '2026-09-09T09:00', '2026-09-09T10:00', { color: 'success' })],
            date: anchor
        })
        const chip = screen.container.querySelector<HTMLElement>('[data-sch-event-id="a"]')!
        tap(chip)
        await settle()
        expect(chip.getAttribute('aria-pressed')).toBe('true')
        expect(chip.className).toContain('ring-success')
        expect(chip.className).toContain('ring-offset-1')
        expect(chip.className.split(' ')).not.toContain('ring-inset')
        expect(chip.className.split(' ')).not.toContain('ring-primary')
    })
})
