import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { EventSnippetProps } from '../../lib/types/snippet.types.js'
import { ZONE, anchor, grid, input, pointer, press, tap, wait } from '../fixtures/dom.js'

const card = createRawSnippet<[EventSnippetProps]>((props) => ({
    render: () => `<div data-probe-card>${props().event.title}</div>`
}))

const events = [
    input('a', '2026-09-09T09:00', '2026-09-09T10:00'),
    input('locked', '2026-09-10T09:00', '2026-09-10T10:00', { editable: false })
]

function mount(extra: Record<string, unknown>) {
    const screen = render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, creatable: false, event: card, events, ...extra }
    })
    screen.container.style.height = '760px'
    screen.container.style.width = '1100px'
    return screen
}

const custom = (container: Element, id: string) =>
    container.querySelector<HTMLElement>(`[data-sch-event="${id}"] [data-probe-card]`)!

describe.each(['week', 'month'])('a custom event in the %s view', (view) => {
    it('reports onEventClick and opens the popover when clicked', async () => {
        const onEventClick = vi.fn()
        const screen = mount({ view, onEventClick })
        await wait(200)
        tap(custom(screen.container, 'a'))
        await wait(400)
        expect(onEventClick).toHaveBeenCalledTimes(1)
        expect(onEventClick.mock.calls[0][0].id).toBe('a')
        expect(document.querySelector('[data-sch-detail="a"]')).not.toBeNull()
    })

    it('opens the slide-over with detail="slideover"', async () => {
        const screen = mount({ view, detail: 'slideover' })
        await wait(200)
        tap(custom(screen.container, 'a'))
        await wait(400)
        expect(document.querySelector('[data-sch-event-panel="a"]')).not.toBeNull()
    })

    it('still reports onEventClick with detail={false}, for a locked event too', async () => {
        const onEventClick = vi.fn()
        const screen = mount({ view, detail: false, onEventClick })
        await wait(200)
        tap(custom(screen.container, 'locked'))
        await wait(300)
        expect(onEventClick).toHaveBeenCalledTimes(1)
        expect(onEventClick.mock.calls[0][0].id).toBe('locked')
        expect(document.querySelector('[data-sch-detail]')).toBeNull()
    })

    it('is selected by the click, so Delete removes it', async () => {
        const screen = mount({ view, detail: false })
        await wait(200)
        tap(custom(screen.container, 'a'))
        await wait(200)
        press(grid(screen.container), 'Delete')
        await wait(300)
        expect(screen.container.querySelector('[data-sch-event="a"]')).toBeNull()
    })

    it('renders the snippet content, not the default chip', async () => {
        const screen = mount({ view })
        await wait(200)
        expect(custom(screen.container, 'a').textContent).toBe('a')
        expect(screen.container.querySelector('[data-sch-event-id="a"]')).toBeNull()
    })
})

describe('the snippet covers every place an event is drawn', () => {
    it('renders the all-day row of the week view with the snippet and forwards the click', async () => {
        const onEventClick = vi.fn()
        const screen = mount({
            onEventClick,
            events: [input('trip', '2026-09-08', '2026-09-11', { allDay: true })]
        })
        await wait(200)
        const card = custom(screen.container, 'trip')
        expect(
            card.closest('[data-sch-all-day]') ?? card.closest('[data-sch-time-grid]')
        ).not.toBeNull()
        expect(screen.container.querySelector('[data-sch-event-id="trip"]')).toBeNull()
        tap(card)
        await wait(400)
        expect(onEventClick.mock.calls[0][0].id).toBe('trip')
        expect(document.querySelector('[data-sch-detail="trip"]')).not.toBeNull()
    })

    it('renders the overflow list of the month view with the snippet and forwards the click', async () => {
        const onEventClick = vi.fn()
        const many = Array.from({ length: 8 }, (_, index) =>
            input(
                `e${index}`,
                `2026-09-15T${String(8 + index).padStart(2, '0')}:00`,
                `2026-09-15T${String(9 + index).padStart(2, '0')}:00`
            )
        )
        const screen = mount({ view: 'month', onEventClick, events: many })
        screen.container.style.height = '500px'
        await wait(300)
        tap(screen.container.querySelector('[data-sch-more="2026-09-15"]')!)
        await wait(400)
        const list = document.querySelector<HTMLElement>('[data-sch-more-list="2026-09-15"]')!
        expect(list.querySelectorAll('[data-probe-card]').length).toBeGreaterThan(0)
        expect(list.querySelector('[data-sch-event-id]')).toBeNull()
        tap(list.querySelector('[data-probe-card]')!)
        await wait(300)
        expect(onEventClick).toHaveBeenCalledTimes(1)
    })
})

describe('the header snippet in the day view', () => {
    const header = createRawSnippet<[{ label: string; isToday: boolean }]>((props) => ({
        render: () =>
            `<div data-probe-header data-today="${props().isToday}">${props().label}</div>`
    }))

    it('replaces the day title', async () => {
        const screen = mount({ view: 'day', header, events: [] })
        await wait(200)
        const title = screen.container.querySelector('[data-sch-day-title]')!
        const probe = title.querySelector<HTMLElement>('[data-probe-header]')!
        expect(probe).not.toBeNull()
        expect(probe.textContent).toContain('Wednesday')
        expect(probe.textContent).toContain('9')
        expect(probe.dataset.today).toBe('false')
        expect(title.querySelector('h3')).toBeNull()
    })
})

describe('gesture flags of the snippet', () => {
    const flags = createRawSnippet<[EventSnippetProps]>((props) => ({
        render: () =>
            `<div data-probe-flags data-dragging="${props().isDragging}" data-resizing="${props().isResizing}">${props().event.title}</div>`,
        setup: (node) => {
            $effect(() => {
                node.setAttribute('data-dragging', String(props().isDragging))
                node.setAttribute('data-resizing', String(props().isResizing))
            })
        }
    }))

    const read = (container: Element, id: string) => {
        const node = container.querySelector<HTMLElement>(
            `[data-sch-event="${id}"] [data-probe-flags]`
        )!
        return { dragging: node.dataset.dragging, resizing: node.dataset.resizing }
    }

    it('reports isResizing during a resize and isDragging during a move, not both', async () => {
        const screen = mount({
            event: flags,
            events: [input('a', '2026-09-09T09:00', '2026-09-09T10:00')],
            creatable: false
        })
        await wait(200)
        const wrapper = screen.container.querySelector<HTMLElement>('[data-sch-event="a"]')!
        const rect = wrapper.getBoundingClientRect()
        const middle = { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
        const bottom = { clientX: middle.clientX, clientY: rect.bottom - 2 }
        expect(read(screen.container, 'a')).toEqual({ dragging: 'false', resizing: 'false' })

        wrapper.dispatchEvent(pointer('pointerdown', bottom))
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: bottom.clientX, clientY: bottom.clientY + 40 })
        )
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: bottom.clientX, clientY: bottom.clientY + 60 })
        )
        await wait(100)
        expect(read(screen.container, 'a')).toEqual({ dragging: 'false', resizing: 'true' })
        wrapper.dispatchEvent(
            pointer('pointerup', { clientX: bottom.clientX, clientY: bottom.clientY + 60 })
        )
        await wait(200)
        expect(read(screen.container, 'a')).toEqual({ dragging: 'false', resizing: 'false' })

        wrapper.dispatchEvent(pointer('pointerdown', middle))
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: middle.clientX, clientY: middle.clientY + 40 })
        )
        wrapper.dispatchEvent(
            pointer('pointermove', { clientX: middle.clientX, clientY: middle.clientY + 60 })
        )
        await wait(100)
        expect(read(screen.container, 'a')).toEqual({ dragging: 'true', resizing: 'false' })
        wrapper.dispatchEvent(
            pointer('pointerup', { clientX: middle.clientX, clientY: middle.clientY + 60 })
        )
        await wait(200)
        expect(read(screen.container, 'a')).toEqual({ dragging: 'false', resizing: 'false' })
    })
})
