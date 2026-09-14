<script lang="ts" module>
    import type { DragSourceListProps } from './drag-source-list.types.js'

    export type Props<T = unknown> = DragSourceListProps<T>
</script>

<script lang="ts" generics="T">
    import type { EventColor } from '../../../types/event.types.js'
    import { getComponentConfig } from '../../../config/config.js'
    import { defaultLabels } from '../../../core/i18n/labels.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { dragSource } from '../../../interactions/plugins/external.js'
    import { EVENT_SWATCH } from '../../event/EventChip/event-chip.variants.js'
    import { dragSourceListDefaults, dragSourceListVariants } from './drag-source-list.variants.js'

    const MINUTES_PER_HOUR = 60

    const config = getComponentConfig('dragSourceList', dragSourceListDefaults)
    const slots = dragSourceListVariants()
    const uid = $props.id()

    let {
        ref = $bindable(null),
        items,
        calendars = [],
        title,
        labels = defaultLabels,
        item: itemSnippet,
        ui,
        class: className,
        ...restProps
    }: Props<T> = $props()

    const heading = $derived(title === undefined ? labels.unscheduled : title)

    const classes = $derived({
        root: slots.root({ class: [config.slots.root, className, ui?.root] }),
        title: slots.title({ class: [config.slots.title, ui?.title] }),
        list: slots.list({ class: [config.slots.list, ui?.list] }),
        item: slots.item({ class: [config.slots.item, ui?.item] }),
        name: slots.name({ class: [config.slots.name, ui?.name] }),
        duration: slots.duration({ class: [config.slots.duration, ui?.duration] })
    })

    function swatchClass(color: EventColor) {
        return slots.swatch({ class: [config.slots.swatch, ui?.swatch, EVENT_SWATCH[color]] })
    }

    function formatDuration(minutes: number) {
        return labels.duration(Math.floor(minutes / MINUTES_PER_HOUR), minutes % MINUTES_PER_HOUR)
    }
</script>

<section
    bind:this={ref}
    {...restProps}
    class={classes.root}
    aria-labelledby={heading ? `${uid}-title` : undefined}
    data-sch-drag-source-list
>
    {#if heading}
        <h3 id="{uid}-title" class={classes.title}>{heading}</h3>
    {/if}
    <ul class={classes.list}>
        {#each items as item, index (item.id ?? index)}
            {@const color = eventColor(item, calendars)}
            <li>
                <button type="button" class={classes.item} {@attach dragSource(() => item)}>
                    {#if itemSnippet}
                        {@render itemSnippet({ item, color })}
                    {:else}
                        <span class={swatchClass(color)}></span>
                        <span class={classes.name}>{item.title}</span>
                        {#if item.durationMinutes}
                            <span class={classes.duration}>
                                {formatDuration(item.durationMinutes)}
                            </span>
                        {/if}
                    {/if}
                </button>
            </li>
        {/each}
    </ul>
</section>
