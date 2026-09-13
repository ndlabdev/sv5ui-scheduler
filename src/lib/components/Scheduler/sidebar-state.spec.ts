import { describe, expect, it } from 'vitest'
import { SidebarState } from './sidebar-state.svelte.js'

function setup(width: number, reducedMotion = false) {
    const box = { width, open: true }
    const state = new SidebarState({
        width: () => box.width,
        breakpoint: () => 1024,
        open: () => box.open,
        setOpen: (open) => (box.open = open),
        reducedMotion: () => reducedMotion
    })
    return { box, state }
}

describe('SidebarState', () => {
    it('is docked before the width is known and from the breakpoint up', () => {
        expect(setup(0).state.docked).toBe(true)
        expect(setup(1024).state.docked).toBe(true)
        expect(setup(1023).state.docked).toBe(false)
    })

    it('toggles the bound open flag when docked and slides only for that toggle', () => {
        const { box, state } = setup(1200)
        expect(state.transition().duration).toBe(0)
        state.toggle()
        expect(box.open).toBe(false)
        expect(state.expanded).toBe(false)
        expect(state.transition()).toEqual({ axis: 'x', duration: 200 })
        state.settled()
        expect(state.transition().duration).toBe(0)
        state.close()
        expect(state.transition().duration).toBe(200)
    })

    it('never slides under reduced motion', () => {
        const { state } = setup(1200, true)
        state.toggle()
        expect(state.transition().duration).toBe(0)
    })

    it('drives the overlay below the breakpoint and closes it after navigating', () => {
        const { box, state } = setup(700)
        state.toggle()
        expect(state.overlayOpen).toBe(true)
        expect(state.expanded).toBe(true)
        expect(box.open).toBe(true)
        state.afterNavigate()
        expect(state.overlayOpen).toBe(false)
        state.toggle()
        state.close()
        expect(state.overlayOpen).toBe(false)
        expect(state.transition().duration).toBe(0)
    })

    it('leaves a docked panel open after navigating', () => {
        const { box, state } = setup(1200)
        state.afterNavigate()
        expect(box.open).toBe(true)
    })
})
