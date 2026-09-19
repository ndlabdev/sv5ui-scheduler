import { describe, expect, it } from 'vitest'
import { assignLanes, type Span } from './lanes.js'

const span = (startColumn: number, endColumn: number): Span => ({ startColumn, endColumn })

describe('assignLanes', () => {
    it('stacks overlapping spans and reuses a lane once it is free', () => {
        expect(assignLanes([span(0, 3), span(1, 2), span(3, 5)])).toEqual([0, 1, 0])
    })

    it('puts the longer span first when two start on the same column', () => {
        expect(assignLanes([span(0, 1), span(0, 4)])).toEqual([1, 0])
    })

    it('fills the lowest free lane, not the most recent one', () => {
        expect(assignLanes([span(0, 2), span(0, 1), span(1, 3), span(2, 4)])).toEqual([0, 1, 1, 0])
    })

    it('keeps input order among equal spans', () => {
        expect(assignLanes([span(0, 1), span(0, 1), span(0, 1)])).toEqual([0, 1, 2])
    })

    it('handles an empty input', () => {
        expect(assignLanes([])).toEqual([])
    })
})
