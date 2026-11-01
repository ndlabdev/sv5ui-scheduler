import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler, WeekView, type ViewDefinition } from '../../lib/index.js'
import { resetWarnings } from '../../lib/core/utils/dev.js'
import BoundScheduler from '../fixtures/BoundScheduler.svelte'
import { ZONE, anchor, settle } from '../fixtures/dom.js'

const twoDays: ViewDefinition = {
    name: 'two-days',
    label: 'Two days',
    layout: 'time-grid',
    range: (date) => {
        const start = date.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
        return { start, end: start.add({ days: 2 }) }
    },
    step: (date, direction) => date.add({ days: 2 * direction }),
    component: WeekView
}

const drawn = (container: Element) =>
    container.querySelector('[data-sch-view]')?.getAttribute('data-sch-view')
const columns = (container: Element) =>
    container.querySelectorAll('[data-sch-day-index]:not([data-sch-all-day])').length
const selectedTab = (container: Element) =>
    container.querySelector('[role="tab"][aria-selected="true"]')?.textContent?.trim()
const warned = (warn: MockInstance, name: string) =>
    warn.mock.calls.some(([message]) => String(message).includes(`"${name}"`))

let warn: MockInstance

beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
    warn.mockRestore()
    resetWarnings()
})

describe('a view name no registered view carries', () => {
    it('draws the week view on mount and warns with the name', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'timeline' }
        })
        await settle()
        expect(drawn(container)).toBe('week')
        expect(columns(container)).toBe(7)
        expect(selectedTab(container)).toBe('Week')
        expect(warned(warn, 'timeline')).toBe(true)
    })

    it('leaves the bound view as given', async () => {
        const screen = render(BoundScheduler, { initial: [], date: anchor, view: 'timeline' })
        await settle()
        expect(drawn(screen.container)).toBe('week')
        expect(screen.component.getView()).toBe('timeline')
    })

    it('falls back when the view changes to an unknown name and recovers after', async () => {
        const screen = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'month' }
        })
        await settle()
        await screen.rerender({ view: 'timeline' })
        await settle()
        expect(drawn(screen.container)).toBe('week')
        expect(columns(screen.container)).toBe(7)
        await screen.rerender({ view: 'month' })
        await settle()
        expect(drawn(screen.container)).toBe('month')
    })

    it('switches to a custom view as soon as it is registered', async () => {
        const screen = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'two-days', views: [] }
        })
        await settle()
        expect(drawn(screen.container)).toBe('week')
        await screen.rerender({ views: [twoDays] })
        await settle()
        expect(drawn(screen.container)).toBe('two-days')
        expect(columns(screen.container)).toBe(2)
    })

    it('falls back when the active custom view is removed', async () => {
        const screen = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, view: 'two-days', views: [twoDays] }
        })
        await settle()
        expect(drawn(screen.container)).toBe('two-days')
        await screen.rerender({ views: [] })
        await settle()
        expect(drawn(screen.container)).toBe('week')
        expect(warned(warn, 'two-days')).toBe(true)
    })
})
