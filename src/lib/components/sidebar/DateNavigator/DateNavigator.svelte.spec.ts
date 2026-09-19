import { parseZonedDateTime } from '@internationalized/date'
import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import DateNavigator from './DateNavigator.svelte'

describe('DateNavigator', () => {
    it('keeps weekday headings short in languages with long weekday names', async () => {
        const { container } = render(DateNavigator, {
            props: {
                date: parseZonedDateTime('2026-09-14T12:00[Asia/Ho_Chi_Minh]'),
                timeZone: 'Asia/Ho_Chi_Minh',
                locale: 'vi-VN'
            }
        })
        await new Promise((resolve) => setTimeout(resolve, 30))
        const headings = [...container.querySelectorAll('th')].map(
            (cell) => cell.textContent?.trim() ?? ''
        )
        expect(headings).toHaveLength(7)
        expect(headings.every((text) => text.length <= 2)).toBe(true)
    })

    it('keeps distinct weekday headings when narrow names would repeat', async () => {
        const { container } = render(DateNavigator, {
            props: {
                date: parseZonedDateTime('2026-09-14T12:00[Asia/Ho_Chi_Minh]'),
                timeZone: 'Asia/Ho_Chi_Minh',
                locale: 'en-US'
            }
        })
        await new Promise((resolve) => setTimeout(resolve, 30))
        const headings = [...container.querySelectorAll('th')].map(
            (cell) => cell.textContent?.trim() ?? ''
        )
        expect(new Set(headings).size).toBe(7)
    })
})
