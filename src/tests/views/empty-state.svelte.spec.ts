import { parseZonedDateTime } from '@internationalized/date'
import { createRawSnippet } from 'svelte'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import type { EmptySnippetProps } from '../../lib/types/index.js'
import { ZONE, anchor, grid, wait } from '../fixtures/dom.js'

const layout = () => wait(80)
const day = (date: { toString(): string }) => date.toString().slice(0, 10)

const tall = createRawSnippet((args: () => EmptySnippetProps) => ({
    render: () =>
        `<div data-probe-empty style="height: 220px; width: 320px">${args().view} ${day(args().range.start)} ${day(args().range.end)}</div>`
}))

function mount(props: Record<string, unknown>) {
    const screen = render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, events: [], ...props }
    })
    screen.container.style.width = '900px'
    screen.container.style.height = '520px'
    return screen
}

function inside(inner: Element, outer: Element) {
    const a = inner.getBoundingClientRect()
    const b = outer.getBoundingClientRect()
    return (
        a.top >= b.top - 1 &&
        a.bottom <= b.bottom + 1 &&
        a.left >= b.left - 1 &&
        a.right <= b.right + 1
    )
}

async function expectInViewWhileScrolling(container: Element) {
    const viewport = grid(container).closest<HTMLElement>('[data-scroll-area-viewport]')!
    const content = grid(container).parentElement!
    const empty = container.querySelector('[data-sch-empty]')!
    expect(viewport.scrollHeight).toBeLessThanOrEqual(
        Math.ceil(content.getBoundingClientRect().height) + 1
    )
    for (const top of [0, viewport.scrollHeight / 2, viewport.scrollHeight]) {
        viewport.scrollTop = top
        await wait(30)
        expect(inside(empty, viewport), `scrollTop ${viewport.scrollTop}`).toBe(true)
    }
}

describe('empty state', () => {
    it('keeps the default message in view at every scroll position', async () => {
        const { container } = mount({})
        await layout()
        expect(container.querySelector('[data-sch-empty]')?.textContent?.trim()).toBe('No events')
        await expectInViewWhileScrolling(container)
    })

    it('keeps a tall custom state in view late in the day without stretching the scroll area', async () => {
        const { container } = mount({
            view: 'day',
            timeZone: 'America/New_York',
            date: parseZonedDateTime('2026-09-12T12:00[America/New_York]'),
            empty: tall
        })
        await layout()
        expect(container.querySelector('[data-sch-now]')).not.toBeNull()
        expect(container.querySelector('[data-probe-empty]')).not.toBeNull()
        await expectInViewWhileScrolling(container)
    })

    it('hands the view and the visible range to the snippet', async () => {
        const cases = [
            ['week', 'week 2026-09-07 2026-09-14'],
            ['day', 'day 2026-09-09 2026-09-10'],
            ['agenda', 'agenda 2026-09-01 2026-10-01']
        ] as const
        for (const [view, text] of cases) {
            const screen = mount({ view, empty: tall })
            await layout()
            expect(screen.container.querySelector('[data-probe-empty]')?.textContent).toBe(text)
            screen.unmount()
        }
    })

    it('leaves the month grid without a message, its cells already read as empty', async () => {
        const { container } = mount({ view: 'month', empty: tall })
        await layout()
        expect(container.querySelector('[data-sch-month-grid]')).not.toBeNull()
        expect(container.querySelector('[data-sch-empty]')).toBeNull()
        expect(container.querySelector('[data-probe-empty]')).toBeNull()
    })
})
