import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { ZONE, anchor, grid, input, press, wait } from '../fixtures/dom.js'

const events = [
    input('first', '2026-09-13T09:00', '2026-09-13T10:00'),
    input('second', '2026-09-13T09:15', '2026-09-13T10:30'),
    input('later', '2026-09-13T15:00', '2026-09-13T16:00'),
    input('elsewhere', '2026-09-11T09:00', '2026-09-11T10:00')
]

function mount(extra: Record<string, unknown> = {}) {
    const screen = render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, creatable: false, events, ...extra }
    })
    screen.container.style.height = '760px'
    screen.container.style.width = '1100px'
    return screen
}

const pressed = (container: Element) =>
    [...container.querySelectorAll<HTMLElement>('[aria-pressed="true"]')].map(
        (chip) => chip.dataset.schEventId
    )
const live = (container: Element) =>
    container.querySelector('[aria-live="polite"][aria-atomic]')!.textContent ?? ''

describe('selecting an event from the keyboard', () => {
    it('Space selects the event at the focused slot, again cycles, and Delete removes it', async () => {
        const onEventClick = vi.fn()
        const screen = mount({ onEventClick })
        await wait(200)
        const target = grid(screen.container)
        target.focus()
        await wait(50)
        press(target, ' ')
        await wait(100)
        expect(pressed(screen.container)).toEqual(['first'])
        expect(live(screen.container)).toContain('first')
        press(target, ' ')
        await wait(100)
        expect(pressed(screen.container)).toEqual(['second'])
        press(target, ' ')
        await wait(100)
        expect(pressed(screen.container)).toEqual(['first'])
        press(target, 'Delete')
        await wait(300)
        expect(screen.container.querySelector('[data-sch-event-id="first"]')).toBeNull()
        expect(onEventClick).not.toHaveBeenCalled()
    })

    it('does nothing at a slot without events', async () => {
        const screen = mount()
        await wait(200)
        const target = grid(screen.container)
        target.focus()
        await wait(50)
        press(target, 'ArrowDown')
        press(target, 'ArrowDown')
        press(target, 'ArrowDown')
        await wait(50)
        press(target, ' ')
        await wait(100)
        expect(pressed(screen.container)).toEqual([])
    })

    it('selects the first event of the focused day in the month view', async () => {
        const screen = mount({ view: 'month' })
        await wait(200)
        const target = grid(screen.container)
        target.focus()
        await wait(50)
        press(target, ' ')
        await wait(100)
        expect(pressed(screen.container)).toEqual(['first'])
        press(target, 'Escape')
        await wait(50)
        expect(pressed(screen.container)).toEqual([])
    })
})
