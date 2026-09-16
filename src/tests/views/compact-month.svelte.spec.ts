import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { ZONE, anchor, input, wait } from '../fixtures/dom.js'

const holidays = [{ date: '2026-09-10', title: 'Founders day' }]
const events = [input('a', '2026-09-09T09:00', '2026-09-09T10:00')]

function mount(width: number, compactBreakpoint: number) {
    const screen = render(Scheduler, {
        props: {
            timeZone: ZONE,
            date: anchor,
            view: 'month',
            creatable: false,
            weekNumbers: true,
            holidays,
            events,
            compactBreakpoint
        }
    })
    screen.container.style.width = `${width}px`
    screen.container.style.height = '760px'
    return screen
}

const toolbarCompact = (container: Element) =>
    container.querySelector('[data-sch-toolbar]')!.hasAttribute('data-sch-compact')
const monthGrid = (container: Element) =>
    container.querySelector<HTMLElement>('[data-sch-month-grid]')!

describe('the month grid follows compactBreakpoint', () => {
    it('keeps week numbers and holiday names in a narrow grid when compactBreakpoint is 0', async () => {
        const screen = mount(700, 0)
        await wait(300)
        expect(toolbarCompact(screen.container)).toBe(false)
        expect(monthGrid(screen.container).textContent).toContain('W37')
        expect(monthGrid(screen.container).querySelector('[data-sch-holiday-title]')).not.toBeNull()
    })

    it('drops them in a wide grid when compactBreakpoint is above the width', async () => {
        const screen = mount(900, 1000)
        await wait(300)
        expect(toolbarCompact(screen.container)).toBe(true)
        expect(monthGrid(screen.container).textContent).not.toContain('W37')
        expect(monthGrid(screen.container).querySelector('[data-sch-holiday-title]')).toBeNull()
    })
})
