import { describe, expect, it, vi } from 'vitest'
import type { StoreMiddleware } from '../../types/mutation.types.js'
import type { EventPatch } from '../../types/mutation.types.js'
import { composeMiddleware } from './middleware.js'

const remove = (eventId: string): EventPatch => ({ type: 'remove', eventId })

describe('composeMiddleware', () => {
    it('calls the sink directly when there is no middleware', () => {
        const sink = vi.fn()
        composeMiddleware([], sink)(remove('a'))
        expect(sink).toHaveBeenCalledWith(remove('a'))
    })

    it('runs middleware in registration order, outermost first', () => {
        const calls: string[] = []
        const tag =
            (name: string): StoreMiddleware =>
            (next) =>
            (patch) => {
                calls.push(name)
                next(patch)
            }
        const sink = vi.fn(() => calls.push('sink'))
        composeMiddleware([tag('first'), tag('second')], sink)(remove('a'))
        expect(calls).toEqual(['first', 'second', 'sink'])
    })

    it('lets middleware transform or drop a patch', () => {
        const rename: StoreMiddleware = (next) => (patch) =>
            next(patch.type === 'remove' ? remove(`${patch.eventId}!`) : patch)
        const dropResets: StoreMiddleware = (next) => (patch) => {
            if (patch.type !== 'reset') next(patch)
        }
        const sink = vi.fn()
        const apply = composeMiddleware([dropResets, rename], sink)
        apply(remove('a'))
        apply({ type: 'reset', events: [] })
        expect(sink).toHaveBeenCalledTimes(1)
        expect(sink).toHaveBeenCalledWith(remove('a!'))
    })
})
