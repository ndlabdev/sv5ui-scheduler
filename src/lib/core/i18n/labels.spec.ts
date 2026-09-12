import { describe, expect, it } from 'vitest'
import type { SchedulerLabels } from '../../types/labels.types.js'
import { defaultLabels, mergeLabels, viewLabel } from './labels.js'
import { en } from './locales/en.js'
import { vi } from './locales/vi.js'

const keysOf = (labels: SchedulerLabels) => [
    ...Object.keys(labels).filter((k) => k !== 'announce'),
    ...Object.keys(labels.announce).map((k) => `announce.${k}`)
]

describe('locales', () => {
    it('every locale covers the same keys as English', () => {
        expect(keysOf(vi).sort()).toEqual(keysOf(en).sort())
    })

    it('functions produce text', () => {
        const event = { id: 'a', title: 'Standup', start: en as never, end: en as never }
        expect(en.more(3)).toBe('+3 more')
        expect(vi.more(3)).toBe('+3 nữa')
        expect(en.event(event, '9:00', '9:30')).toContain('Standup')
        expect(vi.announce.reverted(event)).toContain('Standup')
    })
})

describe('mergeLabels', () => {
    it('returns the defaults untouched when nothing is given', () => {
        expect(mergeLabels(undefined)).toBe(defaultLabels)
    })

    it('overrides top level keys and nested announcements independently', () => {
        const merged = mergeLabels({ today: 'Now', announce: { cancelled: 'Stopped' } })
        expect(merged.today).toBe('Now')
        expect(merged.week).toBe('Week')
        expect(merged.announce.cancelled).toBe('Stopped')
        expect(merged.announce.deleted).toBe(defaultLabels.announce.deleted)
    })

    it('does not mutate the defaults', () => {
        mergeLabels({ today: 'X' })
        expect(defaultLabels.today).toBe('Today')
    })
})

describe('viewLabel', () => {
    it('translates the built-in view names and passes others through', () => {
        expect(viewLabel(vi, 'week')).toBe('Tuần')
        expect(viewLabel(en, 'timeline')).toBe('timeline')
    })
})
