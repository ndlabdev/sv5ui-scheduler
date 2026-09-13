<script lang="ts">
    import { untrack } from 'svelte'
    import { usePointerDrag } from 'sv5ui'

    interface Props {
        log: string[]
    }

    let { log }: Props = $props()

    const attach = (node: HTMLElement) => {
        const drag = untrack(() =>
            usePointerDrag({
                onStart: () => {
                    log.push('start')
                },
                onMove: ({ dx }) => {
                    log.push(`move ${dx}`)
                },
                onEnd: () => {
                    log.push('end')
                }
            })
        )
        const handlers = drag.handlers
        node.addEventListener('pointerdown', handlers.onpointerdown)
        node.addEventListener('pointermove', handlers.onpointermove)
        node.addEventListener('pointerup', handlers.onpointerup)
        node.addEventListener('pointercancel', handlers.onpointercancel)
        return () => {
            node.removeEventListener('pointerdown', handlers.onpointerdown)
            node.removeEventListener('pointermove', handlers.onpointermove)
            node.removeEventListener('pointerup', handlers.onpointerup)
            node.removeEventListener('pointercancel', handlers.onpointercancel)
        }
    }
</script>

<div {@attach attach} data-target style="width: 200px; height: 200px"></div>
