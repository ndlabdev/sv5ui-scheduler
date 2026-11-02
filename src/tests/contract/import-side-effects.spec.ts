import { describe, expect, it, vi } from 'vitest'
import { Scheduler } from '../../lib/index.js'

const created = vi.hoisted(() => ({ count: 0 }))

vi.mock('svelte/reactivity', async (original) => ({
    ...(await original<typeof import('svelte/reactivity')>()),
    MediaQuery: class {
        constructor() {
            created.count += 1
        }
        current = false
    }
}))

describe('importing the package', () => {
    it('creates no media query, so it loads where matchMedia does not exist', () => {
        expect(Scheduler).toBeDefined()
        expect(created.count).toBe(0)
    })
})
