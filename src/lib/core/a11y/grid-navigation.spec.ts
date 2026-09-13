import { describe, expect, it } from 'vitest'
import { clampFocus, isNavigationKey, navigate, type GridShape } from './grid-navigation.js'

const week: GridShape = { days: 7, columnsPerRow: 7, slotMinutes: 30, minutesPerDay: 1440 }
const month: GridShape = { days: 35, columnsPerRow: 7, slotMinutes: 30, minutesPerDay: 1440 }
const slot = (dayIndex: number, minutes: number) => ({ dayIndex, minutes })
const cell = (dayIndex: number) => ({ dayIndex, minutes: null })

describe('isNavigationKey', () => {
    it('recognises only the keys the grid handles', () => {
        expect(isNavigationKey('ArrowLeft')).toBe(true)
        expect(isNavigationKey('PageDown')).toBe(true)
        expect(isNavigationKey('Enter')).toBe(false)
        expect(isNavigationKey('a')).toBe(false)
    })
})

describe('time grid', () => {
    it('moves between days with left and right', () => {
        expect(navigate(slot(2, 540), 'ArrowRight', week)).toEqual({ focus: slot(3, 540), step: 0 })
        expect(navigate(slot(2, 540), 'ArrowLeft', week)).toEqual({ focus: slot(1, 540), step: 0 })
    })

    it('steps to the next period and wraps when leaving an edge', () => {
        expect(navigate(slot(6, 540), 'ArrowRight', week)).toEqual({ focus: slot(0, 540), step: 1 })
        expect(navigate(slot(0, 540), 'ArrowLeft', week)).toEqual({ focus: slot(6, 540), step: -1 })
    })

    it('moves by one slot with up and down', () => {
        expect(navigate(slot(2, 540), 'ArrowDown', week)).toEqual({ focus: slot(2, 570), step: 0 })
        expect(navigate(slot(2, 540), 'ArrowUp', week)).toEqual({ focus: slot(2, 510), step: 0 })
    })

    it('stops at the ends of the day instead of spilling into the next', () => {
        expect(navigate(slot(2, 0), 'ArrowUp', week)).toEqual({ focus: slot(2, 0), step: 0 })
        expect(navigate(slot(2, 1410), 'ArrowDown', week)).toEqual({
            focus: slot(2, 1410),
            step: 0
        })
    })

    it('jumps to the first and last slot of the day', () => {
        expect(navigate(slot(2, 540), 'Home', week)).toEqual({ focus: slot(2, 0), step: 0 })
        expect(navigate(slot(2, 540), 'End', week)).toEqual({ focus: slot(2, 1410), step: 0 })
    })

    it('pages to the previous and next period without moving the focus', () => {
        expect(navigate(slot(2, 540), 'PageUp', week)).toEqual({ focus: slot(2, 540), step: -1 })
        expect(navigate(slot(2, 540), 'PageDown', week)).toEqual({ focus: slot(2, 540), step: 1 })
    })

    it('swaps left and right in a right to left layout', () => {
        const rtl = { ...week, rtl: true }
        expect(navigate(slot(2, 540), 'ArrowLeft', rtl)).toEqual({ focus: slot(3, 540), step: 0 })
        expect(navigate(slot(2, 540), 'ArrowRight', rtl)).toEqual({ focus: slot(1, 540), step: 0 })
    })

    it('works in a single day view, paging on every horizontal move', () => {
        const day = { ...week, days: 1, columnsPerRow: 1 }
        expect(navigate(slot(0, 540), 'ArrowRight', day)).toEqual({ focus: slot(0, 540), step: 1 })
        expect(navigate(slot(0, 540), 'ArrowLeft', day)).toEqual({ focus: slot(0, 540), step: -1 })
    })
})

describe('month grid', () => {
    it('moves one day with left and right', () => {
        expect(navigate(cell(8), 'ArrowRight', month)).toEqual({ focus: cell(9), step: 0 })
        expect(navigate(cell(8), 'ArrowLeft', month)).toEqual({ focus: cell(7), step: 0 })
    })

    it('moves one week with up and down', () => {
        expect(navigate(cell(8), 'ArrowDown', month)).toEqual({ focus: cell(15), step: 0 })
        expect(navigate(cell(8), 'ArrowUp', month)).toEqual({ focus: cell(1), step: 0 })
    })

    it('steps to the neighbouring month when leaving the grid vertically', () => {
        expect(navigate(cell(3), 'ArrowUp', month)).toEqual({ focus: cell(31), step: -1 })
        expect(navigate(cell(31), 'ArrowDown', month)).toEqual({ focus: cell(3), step: 1 })
    })

    it('jumps to the ends of the week', () => {
        expect(navigate(cell(9), 'Home', month)).toEqual({ focus: cell(7), step: 0 })
        expect(navigate(cell(9), 'End', month)).toEqual({ focus: cell(13), step: 0 })
    })

    it('keeps End inside a grid whose last row is short', () => {
        const short = { ...month, days: 30 }
        expect(navigate(cell(29), 'End', short)).toEqual({ focus: cell(29), step: 0 })
    })
})

describe('clampFocus', () => {
    it('keeps the day index inside the grid', () => {
        expect(clampFocus(slot(99, 540), week)).toEqual(slot(6, 540))
        expect(clampFocus(slot(-3, 540), week)).toEqual(slot(0, 540))
    })

    it('rounds minutes onto the slot grid and keeps them inside the day', () => {
        expect(clampFocus(slot(0, 547), week)).toEqual(slot(0, 540))
        expect(clampFocus(slot(0, 5000), week)).toEqual(slot(0, 1410))
        expect(clampFocus(slot(0, -60), week)).toEqual(slot(0, 0))
    })

    it('leaves a whole-day focus without minutes', () => {
        expect(clampFocus(cell(40), month)).toEqual(cell(34))
    })
})
