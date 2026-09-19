import axe from 'axe-core'
import { createRawSnippet } from 'svelte'
import { describe, expect, it, vi } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { ZONE, anchor, input, tap, wait } from '../fixtures/dom.js'

const settle = () => wait(60)

const events = [
    input('standup', '2026-09-09T09:00', '2026-09-09T09:30', { color: 'secondary' }),
    input('review', '2026-09-09T09:00', '2026-09-09T11:00'),
    input('trip', '2026-09-08', '2026-09-11', { allDay: true, color: 'warning' }),
    input('late', '2026-09-10T22:00', '2026-09-11T01:00', { color: 'error' }),
    input('locked', '2026-09-11T13:00', '2026-09-11T14:00', { editable: false }),
    ...Array.from({ length: 6 }, (_, i) =>
        input(`busy-${i}`, '2026-09-15T08:00', '2026-09-15T09:00', { color: 'tertiary' })
    )
]

const actions = createRawSnippet(() => ({
    render: () => '<button type="button">Share</button>'
}))

async function audit(container: Element) {
    await settle()
    const result = await axe.run(container, {
        resultTypes: ['violations'],
        rules: { region: { enabled: false } }
    })
    return result.violations.map((violation) => ({
        id: violation.id,
        impact: violation.impact,
        nodes: violation.nodes.slice(0, 3).map((node) => ({
            html: node.html.slice(0, 200),
            why: node.failureSummary
        }))
    }))
}

function mount(props: Record<string, unknown>) {
    const screen = render(Scheduler, {
        props: {
            timeZone: ZONE,
            date: anchor,
            events,
            holidays: [{ date: '2026-09-10', title: 'Mid-Autumn' }],
            businessHours: { start: '09:00', end: '17:00', days: [1, 2, 3, 4, 5] },
            weekNumbers: true,
            toolbarActions: actions,
            onMenu: () => {},
            ...props
        }
    })
    screen.container.style.height = '720px'
    return screen
}

describe('accessibility', () => {
    it.each(['week', 'day', 'month', 'year', 'agenda'])(
        'the %s view has no axe violations',
        async (view) => {
            const { container } = mount({ view })
            expect(await audit(container)).toEqual([])
        }
    )

    it('the empty week has no axe violations', async () => {
        const { container } = mount({ events: [], date: anchor.add({ weeks: 3 }) })
        expect(await audit(container)).toEqual([])
    })

    it('an open event popover has no axe violations', async () => {
        const { container } = mount({ view: 'week' })
        tap(container.querySelector<HTMLElement>('[data-sch-event-id="review"]')!)
        await settle()
        expect(document.querySelector('[data-sch-detail="review"]')).not.toBeNull()
        expect(await audit(document.body)).toEqual([])
    })

    it('an open overflow list has no axe violations', async () => {
        const { container } = mount({ view: 'month' })
        tap(container.querySelector<HTMLElement>('[data-sch-more="2026-09-15"]')!)
        await settle()
        expect(document.querySelector('[data-sch-more-list]')).not.toBeNull()
        expect(await audit(document.body)).toEqual([])
    })

    it('the month view keeps contrast inside the column of today', async () => {
        vi.setSystemTime(new Date('2026-09-07T03:00:00Z'))
        const { container } = mount({ view: 'month' })
        expect(container.querySelector('[data-sch-day="2026-08-31"]')).not.toBeNull()
        expect(await audit(container)).toEqual([])
    })
})
