import { describe, expect, it } from 'vitest'
import { isInteractiveTarget, isTextField } from '../lib/interactions/hit-test.js'

function tree() {
    const grid = document.createElement('div')
    grid.setAttribute('role', 'application')
    grid.innerHTML = `
        <div class="cell"><span class="plain">1</span></div>
        <button class="chip"><span class="label">Standup</span></button>
        <input class="field" />
        <div contenteditable="true" class="editable"><b class="bold">x</b></div>
    `
    document.body.append(grid)
    return grid
}

describe('isInteractiveTarget', () => {
    it('recognises controls inside the container, including their children', () => {
        const grid = tree()
        expect(isInteractiveTarget(grid.querySelector('.chip'), grid)).toBe(true)
        expect(isInteractiveTarget(grid.querySelector('.label'), grid)).toBe(true)
        expect(isInteractiveTarget(grid.querySelector('.field'), grid)).toBe(true)
        grid.remove()
    })

    it('ignores plain content and the container itself', () => {
        const grid = tree()
        expect(isInteractiveTarget(grid.querySelector('.plain'), grid)).toBe(false)
        expect(isInteractiveTarget(grid, grid)).toBe(false)
        expect(isInteractiveTarget(null, grid)).toBe(false)
        grid.remove()
    })

    it('ignores a control that wraps the container rather than sitting inside it', () => {
        const outer = document.createElement('button')
        const grid = document.createElement('div')
        outer.append(grid)
        document.body.append(outer)
        expect(isInteractiveTarget(grid, grid)).toBe(false)
        outer.remove()
    })
})

describe('isTextField', () => {
    it('is true only for places the user types into', () => {
        const grid = tree()
        expect(isTextField(grid.querySelector('.field'))).toBe(true)
        expect(isTextField(grid.querySelector('.bold'))).toBe(true)
        expect(isTextField(grid.querySelector('.chip'))).toBe(false)
        grid.remove()
    })
})
