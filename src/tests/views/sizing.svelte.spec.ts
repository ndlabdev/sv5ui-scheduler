import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import FlexPageScheduler from '../fixtures/FlexPageScheduler.svelte'
import { ZONE, anchor, wait } from '../fixtures/dom.js'

const root = (container: Element) => container.querySelector<HTMLElement>('[data-sch-scheduler]')!
const viewport = (container: Element) =>
    container.querySelector<HTMLElement>('[data-scroll-area-viewport]')
const height = (element: Element) => Math.round(element.getBoundingClientRect().height)

describe('sizing', () => {
    it.each(['week', 'month', 'agenda'])(
        'takes the remaining height of a flex column in the %s view',
        async (view) => {
            const { container } = render(FlexPageScheduler, { view })
            await wait(60)
            expect(height(root(container))).toBe(600 - 56 - 40)
            const scroller = viewport(container)
            if (view === 'week') {
                expect(scroller!.clientHeight).toBeLessThan(scroller!.scrollHeight)
            }
        }
    )

    it('applies a numeric height in pixels and a string as a CSS length', async () => {
        const numeric = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events: [], height: 480 }
        })
        await wait(60)
        expect(height(root(numeric.container))).toBe(480)
        expect(viewport(numeric.container)!.clientHeight).toBeLessThan(
            viewport(numeric.container)!.scrollHeight
        )
        numeric.unmount()

        const length = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events: [], height: '30rem' }
        })
        await wait(60)
        expect(height(root(length.container))).toBe(480)
    })

    it('grows with its content when nothing sizes it', async () => {
        const { container } = render(Scheduler, {
            props: { timeZone: ZONE, date: anchor, events: [] }
        })
        await wait(60)
        const scroller = viewport(container)!
        expect(scroller.clientHeight).toBe(scroller.scrollHeight)
        expect(height(root(container))).toBeGreaterThan(scroller.scrollHeight)
    })
})
