import { describe, expect, it } from 'vitest'
import { assignColumns, type Interval } from './overlap.js'

const HOUR = 3600000
const at = (start: number, end: number): Interval => ({ startMs: start * HOUR, endMs: end * HOUR })

describe('assignColumns', () => {
    it('gives a lone event the whole width', () => {
        expect(assignColumns([at(9, 10)])).toEqual([{ column: 0, columns: 1 }])
    })

    it('splits two identical events into two columns, first by input order', () => {
        expect(assignColumns([at(9, 10), at(9, 10)])).toEqual([
            { column: 0, columns: 2 },
            { column: 1, columns: 2 }
        ])
    })

    it('puts the longer of two events starting together on the left', () => {
        expect(assignColumns([at(9, 10), at(9, 12)])).toEqual([
            { column: 1, columns: 2 },
            { column: 0, columns: 2 }
        ])
    })

    it('treats touching events as not overlapping', () => {
        expect(assignColumns([at(9, 10), at(10, 11)])).toEqual([
            { column: 0, columns: 1 },
            { column: 0, columns: 1 }
        ])
    })

    it('keeps a chain of partial overlaps in one cluster with two columns', () => {
        const [a, b, c] = assignColumns([at(9, 10.5), at(10, 11.5), at(11, 12.5)])
        expect(a).toEqual({ column: 0, columns: 2 })
        expect(b).toEqual({ column: 1, columns: 2 })
        expect(c).toEqual({ column: 0, columns: 2 })
    })

    it('needs three columns when three events share a moment', () => {
        const placements = assignColumns([at(9, 11), at(10, 12), at(10.5, 11.5)])
        expect(placements.map((p) => p.columns)).toEqual([3, 3, 3])
        expect(new Set(placements.map((p) => p.column)).size).toBe(3)
    })

    it('lets a long event span many short ones in the first column', () => {
        const placements = assignColumns([at(9, 17), at(9, 10), at(11, 12), at(15, 16)])
        expect(placements[0]).toEqual({ column: 0, columns: 2 })
        expect(placements.slice(1).map((p) => p.column)).toEqual([1, 1, 1])
    })

    it('separates clusters so a later pair does not widen an earlier lone event', () => {
        const placements = assignColumns([at(8, 9), at(13, 14), at(13.5, 14.5)])
        expect(placements[0]).toEqual({ column: 0, columns: 1 })
        expect(placements[1].columns).toBe(2)
        expect(placements[2].columns).toBe(2)
    })

    it('returns placements in input order regardless of sorting', () => {
        const placements = assignColumns([at(12, 13), at(9, 10), at(12, 13)])
        expect(placements[1]).toEqual({ column: 0, columns: 1 })
        expect(placements[0].column).not.toBe(placements[2].column)
    })

    it('handles an empty input', () => {
        expect(assignColumns([])).toEqual([])
    })
})
