<script lang="ts" module>
    export interface PopoverTrigger {
        'aria-haspopup': 'dialog'
        'aria-expanded': boolean
        onclick: () => void
    }
</script>

<script lang="ts">
    import { Popover, useMediaQuery } from 'sv5ui'
    import type { Snippet } from 'svelte'

    interface Props {
        open?: boolean
        side?: 'top' | 'right' | 'bottom' | 'left'
        align?: 'start' | 'center' | 'end'
        class?: string
        contentClass?: string
        onActivate?: () => void
        trigger: Snippet<[PopoverTrigger]>
        panel: Snippet<[{ close: () => void }]>
    }

    let {
        open = $bindable(false),
        side = 'bottom',
        align = 'start',
        class: className,
        contentClass,
        onActivate,
        trigger,
        panel
    }: Props = $props()

    const narrow = useMediaQuery('(max-width: 767px)')
    const placement = $derived(
        narrow.matches && (side === 'left' || side === 'right') ? 'bottom' : side
    )

    let anchor = $state<HTMLElement | null>(null)
    let contentNode = $state<HTMLElement | null>(null)

    const triggerProps: PopoverTrigger = $derived({
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        onclick: toggle
    })
    const anchorProps = $derived({ customAnchor: anchor })

    function toggle() {
        onActivate?.()
        open = !open
    }

    function close() {
        open = false
    }

    function keepOpenOnAnchor(event: PointerEvent) {
        if (anchor && event.target instanceof Node && anchor.contains(event.target)) {
            event.preventDefault()
        }
    }

    function restoreFocus(event: Event) {
        event.preventDefault()
        const active = document.activeElement
        const focusWasInside = !active || active === document.body || contentNode?.contains(active)
        if (!focusWasInside) return
        anchor?.querySelector<HTMLElement>('button, a[href], [tabindex]')?.focus()
    }
</script>

<div bind:this={anchor} class={className}>
    {@render trigger(triggerProps)}
</div>
<Popover
    bind:open
    bind:ref={contentNode}
    side={placement}
    {align}
    collisionPadding={8}
    ui={{ content: contentClass }}
    onInteractOutside={keepOpenOnAnchor}
    onCloseAutoFocus={restoreFocus}
    {...anchorProps}
>
    {#snippet content()}
        {@render panel({ close })}
    {/snippet}
</Popover>
