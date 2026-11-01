import { parseZonedDateTime } from '@internationalized/date'
import { render } from 'svelte/server'
import { describe, expect, it, vi } from 'vitest'
import { Scheduler } from '../../lib/index.js'

describe('server render', () => {
    it('renders the week view with its events without a DOM', () => {
        const { body } = render(Scheduler, {
            props: {
                timeZone: 'Asia/Ho_Chi_Minh',
                date: parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]'),
                events: [
                    {
                        id: 'a',
                        title: 'Server side',
                        start: '2026-09-09T09:00',
                        end: '2026-09-09T10:00'
                    }
                ]
            }
        })
        expect(body).toContain('data-sch-day="2026-09-07"')
        expect(body).toContain('Server side')
        expect(body).toContain('Sep 7')
    })

    it('renders the week view for a view name no registered view carries', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const { body } = render(Scheduler, {
            props: {
                timeZone: 'Asia/Ho_Chi_Minh',
                date: parseZonedDateTime('2026-09-09T12:00[Asia/Ho_Chi_Minh]'),
                view: 'timeline'
            }
        })
        expect(body).toContain('data-sch-view="week"')
        expect(body).toContain('data-sch-day="2026-09-07"')
        warn.mockRestore()
    })
})
