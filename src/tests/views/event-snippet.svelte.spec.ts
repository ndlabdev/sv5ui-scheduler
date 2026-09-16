import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { EventSnippetProps } from '../../lib/types/snippet.types.js'
import { ZONE, anchor, grid, input, press, tap, wait } from '../fixtures/dom.js'

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
