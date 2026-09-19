import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler, WeekView, type ViewDefinition } from '../../lib/index.js'
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

function mount(view: ViewDefinition) {
    return render(Scheduler, {
        props: { timeZone: ZONE, date: anchor, views: [view], view: view.name }
    })
}

describe('custom views', () => {
    it('shows the label of a registered view in the switcher and the grid name', async () => {
        const { container } = mount(twoDays)
        await settle()
        expect(container.querySelector('[role="tablist"]')?.textContent).toContain('Two days')
        expect(
            container.querySelector('[role="application"]')?.getAttribute('aria-label')
        ).toContain('Two days')
    })

    it('falls back to the name when no label is given', async () => {
        const { container } = mount({ ...twoDays, label: undefined })
        await settle()
        expect(container.querySelector('[role="tablist"]')?.textContent).toContain('two-days')
    })
})
