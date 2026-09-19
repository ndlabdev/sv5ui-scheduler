import { describe, expect, it } from 'vitest'
import { emptyIdSet, withId, withoutId } from './id-set.js'

describe('id set', () => {
    it('adds and removes without mutating the input', () => {
        const empty = emptyIdSet()
        const one = withId(empty, 'a')
        const none = withoutId(one, 'a')
        expect(empty.size).toBe(0)
        expect([...one]).toEqual(['a'])
        expect(none.size).toBe(0)
    })

    it('returns the same set when nothing changes', () => {
        const one = withId(emptyIdSet(), 'a')
        expect(withId(one, 'a')).toBe(one)
        expect(withoutId(one, 'b')).toBe(one)
    })
})
