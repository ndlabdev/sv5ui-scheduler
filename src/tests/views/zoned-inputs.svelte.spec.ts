import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { Scheduler } from '../../lib/index.js'
import { settle } from '../fixtures/dom.js'

const at = (value: string) => parseZonedDateTime(value)

const daysOf = (container: Element) =>
    [...container.querySelectorAll<HTMLElement>('[data-sch-event]')].map(
        (chip) => chip.closest<HTMLElement>('[data-sch-day]')?.dataset.schDay
    )

describe('zoned inputs', () => {
    it('shows the week of a date given in another time zone', async () => {
        const { container } = render(Scheduler, {
            props: {
                timeZone: 'Europe/London',
                date: at('2026-03-04T12:00[America/New_York]'),
                events: [
                    {
                        id: 'office',
                        title: 'Office',
                        start: at('2026-03-03T09:00[Europe/London]'),
                        end: at('2026-03-03T12:00[Europe/London]')
                    }
                ]
            }
        })
        await settle()
        expect(daysOf(container)).toEqual(['2026-03-03'])
    })

    it('repeats a series on the weekday of its own time zone', async () => {
        const start = at('2026-03-02T09:00[Australia/Sydney]')
        const { container } = render(Scheduler, {
            props: {
                timeZone: 'America/New_York',
                weekStartsOn: 0,
                date: at('2026-03-04T12:00[America/New_York]'),
                events: [
                    {
                        id: 'sydney',
                        title: 'Sydney standup',
                        start,
                        end: start.add({ minutes: 30 }),
                        recurrence: { freq: 'weekly', byDay: [1] }
                    }
                ]
            }
        })
        await settle()
        expect(daysOf(container)).toEqual(['2026-03-01'])
    })
})
