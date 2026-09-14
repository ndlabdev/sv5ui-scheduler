import { afterEach, describe, expect, it } from 'vitest'
import { defineSchedulerConfig, getComponentConfig } from './config.js'

const defaults = {
    defaultVariants: { color: 'primary', size: 'md' },
    slots: { root: '', title: '' }
}

afterEach(() => defineSchedulerConfig({}))

describe('getComponentConfig', () => {
    it('returns the defaults untouched when nothing is configured', () => {
        expect(getComponentConfig('eventChip', defaults)).toBe(defaults)
    })

    it('merges variant overrides and slot classes without touching other keys', () => {
        defineSchedulerConfig({
            eventChip: { defaultVariants: { size: 'sm' }, slots: { root: 'shadow' } }
        })
        const merged = getComponentConfig('eventChip', defaults)
        expect(merged.defaultVariants).toEqual({ color: 'primary', size: 'sm' })
        expect(merged.slots).toEqual({ root: 'shadow', title: '' })
        expect(defaults.defaultVariants.size).toBe('md')
    })

    it('caches per component until the config changes', () => {
        defineSchedulerConfig({ eventChip: { slots: { root: 'a' } } })
        const first = getComponentConfig('eventChip', defaults)
        expect(getComponentConfig('eventChip', defaults)).toBe(first)
        defineSchedulerConfig({ eventChip: { slots: { root: 'b' } } })
        expect(getComponentConfig('eventChip', defaults).slots.root).toBe('b')
    })
})
