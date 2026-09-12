<script lang="ts" module>
    import type { EventChipProps } from './event-chip.types.js'

    export type Props<T = unknown> = EventChipProps<T>
</script>

<script lang="ts" generics="T">
    import { getComponentConfig } from '../../config.js'
    import { formatTimeRange } from '../../core/time/format.js'
    import { eventChipDefaults, eventChipVariants } from './event-chip.variants.js'

    const config = getComponentConfig('eventChip', eventChipDefaults)

    let {
        ref = $bindable(null),
        event,
        position,
        locale = 'en-US',
        color,
        size = config.defaultVariants.size,
        showTime = true,
        selected = false,
        dragging = false,
        ui,
        class: className,
        children,
        ...restProps
    }: Props<T> = $props()

    const continuesBefore = $derived(position?.kind === 'span' && position.continuesBefore)
    const continuesAfter = $derived(position?.kind === 'span' && position.continuesAfter)
    const timeVisible = $derived(showTime && position?.kind !== 'span' && !event.allDay)
    const timeText = $derived(formatTimeRange(event.start, event.end, locale))

    const classes = $derived.by(() => {
        const slots = eventChipVariants({
            color: color ?? event.color ?? config.defaultVariants.color,
            size,
            selected,
            dragging,
            continuesBefore,
            continuesAfter
        })
        return {
            root: slots.root({ class: [config.slots.root, className, ui?.root] }),
            title: slots.title({ class: [config.slots.title, ui?.title] }),
            time: slots.time({ class: [config.slots.time, ui?.time] })
        }
    })
</script>

<button
    bind:this={ref}
    type="button"
    data-sch-event-id={event.id}
    aria-pressed={selected}
    {...restProps}
    class={classes.root}
>
    {#if children}
        {@render children()}
    {:else}
        <span class={classes.title}>{event.title}</span>
        {#if timeVisible}
            <span class={classes.time}>{timeText}</span>
        {/if}
    {/if}
</button>
