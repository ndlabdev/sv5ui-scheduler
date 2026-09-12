import { describe, expect, it } from 'vitest'
import type { LayoutStrategy, ViewDefinition } from '../../types/extension.types.js'
import { createRegistry } from './registry.js'

const view = (name: string, layout = 'time-grid'): ViewDefinition => ({
    name,
    layout,
    range: (anchor) => ({ start: anchor, end: anchor.add({ days: 1 }) }),
    step: (anchor) => anchor,
    component: (() => undefined) as unknown as ViewDefinition['component']
})

describe('createRegistry', () => {
    it('resolves views and built-in layouts by name', () => {
        const registry = createRegistry({ views: [view('week')] })
        expect(registry.view('week').name).toBe('week')
        expect(registry.layout('time-grid').name).toBe('time-grid')
        expect(registry.layout('month-grid').name).toBe('month-grid')
        expect(registry.layout('list').name).toBe('list')
    })

    it('lets a user entry override a built-in of the same name', () => {
        const custom: LayoutStrategy = { name: 'time-grid', layout: () => [] }
        const registry = createRegistry({ views: [view('week')], layouts: [custom] })
        expect(registry.layout('time-grid')).toBe(custom)
    })

    it('keeps the last view when names repeat and preserves order otherwise', () => {
        const registry = createRegistry({ views: [view('a'), view('b'), view('a', 'list')] })
        expect(registry.views.map((v) => v.name)).toEqual(['a', 'b'])
        expect(registry.view('a').layout).toBe('list')
    })

    it('names the known entries when a lookup fails', () => {
        const registry = createRegistry({ views: [view('week'), view('day')] })
        expect(() => registry.view('year')).toThrow('Unknown view "year". Known: week, day')
        expect(() => registry.layout('spiral')).toThrow('Unknown layout "spiral"')
        expect(registry.hasView('day')).toBe(true)
        expect(registry.hasView('year')).toBe(false)
    })

    it('dedupes interactions by name', () => {
        const registry = createRegistry({
            views: [view('week')],
            interactions: [
                { name: 'drag', attach: () => () => undefined },
                { name: 'drag', attach: () => () => undefined }
            ]
        })
        expect(registry.interactions).toHaveLength(1)
    })
})
