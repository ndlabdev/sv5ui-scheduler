import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { ZONE, anchor, input, wait } from '../fixtures/dom.js'

describe('time grid edges', () => {
    const cases: [string, Record<string, unknown>][] = [
        ['week', {}],
        ['day', { view: 'day' }],
        [
            'week with an all-day row',
            { events: [input('trip', '2026-09-08', '2026-09-10', { allDay: true })] }
        ]
    ]
    for (const [label, props] of cases) {
        it(`starts the hour columns right under the header in the ${label}`, async () => {
            const { container } = render(Scheduler, {
                props: { timeZone: ZONE, date: anchor, ...props }
            })
            container.style.height = '700px'
            await wait(60)
            const body = container.querySelector<HTMLElement>('[data-scroll-area-viewport]')!
            body.scrollTop = 0
            const columns = container.querySelector<HTMLElement>(
                '[data-sch-time-grid] [role="application"]'
            )!
            expect(
                Math.abs(columns.getBoundingClientRect().top - body.getBoundingClientRect().top)
            ).toBeLessThan(1)
        })
    }

    it('draws each hour line at the bottom of its hour, never on the top edge', () => {
        const { container } = render(Scheduler, { props: { timeZone: ZONE, date: anchor } })
        const background = container.querySelector<HTMLElement>(
            '[data-sch-time-grid] [role="application"]'
        )!.style.backgroundImage
        expect(background.indexOf('transparent')).toBeGreaterThan(-1)
        expect(background.indexOf('transparent')).toBeLessThan(background.indexOf('color-mix'))
    })
})
