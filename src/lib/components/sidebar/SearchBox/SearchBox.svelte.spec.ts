import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import { vi as viLabels } from '../../../locales/index.js'
import SearchBox from './SearchBox.svelte'

describe('SearchBox', () => {
    it('names the field from labels and shows the shortcut key', () => {
        const { container } = render(SearchBox, { props: { labels: viLabels } })
        const field = container.querySelector('input')!
        expect(field.placeholder).toBe('Tìm sự kiện')
        expect(field.getAttribute('aria-label')).toBe('Tìm sự kiện')
        expect(container.textContent).toContain('/')
    })

    it('hides the shortcut hint when the shortcut is turned off', () => {
        const { container } = render(SearchBox, { props: { shortcut: null } })
        expect(container.textContent?.trim()).toBe('')
    })
})
