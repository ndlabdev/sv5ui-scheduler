import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import HookInAttachment from './fixtures/HookInAttachment.svelte'

describe('sv5ui hooks inside an attachment', () => {
    it('lets usePointerDrag run from an attachment body', async () => {
        const log: string[] = []
        const { container } = render(HookInAttachment, { log })
        const target = container.querySelector('[data-target]') as HTMLElement
        const rect = target.getBoundingClientRect()
        const at = (x: number, y: number) => ({
            clientX: rect.left + x,
            clientY: rect.top + y,
            pointerId: 1,
            bubbles: true,
            isPrimary: true,
            button: 0
        })
        target.dispatchEvent(new PointerEvent('pointerdown', at(10, 10)))
        target.dispatchEvent(new PointerEvent('pointermove', at(50, 10)))
        await new Promise((resolve) => requestAnimationFrame(resolve))
        target.dispatchEvent(new PointerEvent('pointerup', at(50, 10)))
        await new Promise((resolve) => setTimeout(resolve, 20))
        expect(log[0]).toBe('start')
        expect(log).toContain('move 40')
        expect(log.at(-1)).toBe('end')
    })
})
