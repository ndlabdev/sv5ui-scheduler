<script lang="ts" module>
    import type { EventChipProps } from './event-chip.types.js'

    export type Props<T = unknown> = EventChipProps<T>
</script>

<script lang="ts" generics="T">
    import { getComponentConfig } from '../../../config/config.js'
    import { isWholeDay } from '../../../core/layout/segments.js'
    import { formatTime, formatTimeRange } from '../../../core/time/format.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import { eventChipDefaults, eventChipVariants } from './event-chip.variants.js'

    const config = getComponentConfig('eventChip', eventChipDefaults)

    let {
        ref = $bindable(null),
        event,
        position,
        locale = 'en-US',
        hour12,
        color,
        size = config.defaultVariants.size,
        variant = config.defaultVariants.variant,
        showTime = true,
        selected = false,
        dragging = false,
        ui,
        class: className,
        children,
        ...restProps
    }: Props<T> = $props()

    const shape = $derived(position?.kind === 'span' ? 'pill' : 'block')
    const continuesBefore = $derived(position?.kind === 'span' && position.continuesBefore)
    const continuesAfter = $derived(position?.kind === 'span' && position.continuesAfter)
    const timed = $derived(!isWholeDay(event))
    const prefix = $derived(
        shape === 'pill' && showTime && timed && !continuesBefore
            ? formatTime(event.start, locale, hour12)
            : ''
    )
    const range = $derived.by(() => {
        if (shape !== 'block' || !showTime || !timed) return ''
        if (isSameDay(event.start, event.end)) {
            return formatTimeRange(event.start, event.end, locale, hour12)
        }
        return `${formatTime(event.start, locale, hour12)} \u2013 ${formatTime(event.end, locale, hour12)}`
    })

    const classes = $derived.by(() => {
        const slots = eventChipVariants({
            shape,
            color: color ?? event.color ?? config.defaultVariants.color,
            variant,
            size,
            selected,
            dragging,
            continuesBefore,
            continuesAfter
        })
        return {
            root: slots.root({ class: [config.slots.root, className, ui?.root] }),
            swatch: slots.swatch({ class: [config.slots.swatch, ui?.swatch] }),
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
        <span class={classes.swatch}></span>
        {#if prefix}
            <span class={classes.time}>{prefix}</span>
        {/if}
        <span class={classes.title} dir="auto">{event.title}</span>
        {#if range}
            <span class={classes.time}>{range}</span>
        {/if}
    {/if}
</button>
