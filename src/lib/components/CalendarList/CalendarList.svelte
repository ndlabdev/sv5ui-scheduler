<script lang="ts" module>
    import type { CalendarListProps } from './calendar-list.types.js'

    export type Props = CalendarListProps
</script>

<script lang="ts">
    import { Checkbox } from 'sv5ui'
    import { getComponentConfig } from '../../config.js'
    import { defaultLabels } from '../../core/i18n/labels.js'
    import { EVENT_SWATCH } from '../EventChip/event-chip.variants.js'
    import { calendarListDefaults, calendarListVariants } from './calendar-list.variants.js'

    const config = getComponentConfig('calendarList', calendarListDefaults)
    const slots = calendarListVariants()
    const uid = $props.id()

    let {
        ref = $bindable(null),
        calendars,
        hiddenCalendars = $bindable([]),
        title,
        labels = defaultLabels,
        item,
        ui,
        class: className,
        ...restProps
    }: Props = $props()

    const heading = $derived(title === undefined ? labels.calendars : title)
    const hiddenIds = $derived(new Set(hiddenCalendars))

    const classes = $derived({
        root: slots.root({ class: [config.slots.root, className, ui?.root] }),
        title: slots.title({ class: [config.slots.title, ui?.title] }),
        list: slots.list({ class: [config.slots.list, ui?.list] }),
        item: slots.item({ class: [config.slots.item, ui?.item] }),
        label: slots.label({ class: [config.slots.label, ui?.label] })
    })

    function toggle(id: string) {
        hiddenCalendars = hiddenIds.has(id)
            ? hiddenCalendars.filter((candidate) => candidate !== id)
            : [...hiddenCalendars, id]
    }

    function swatchClass(color: keyof typeof EVENT_SWATCH) {
        return slots.swatch({ class: [config.slots.swatch, ui?.swatch, EVENT_SWATCH[color]] })
    }

    function nameClass(visible: boolean) {
        return slots.name({
            class: [config.slots.name, ui?.name, visible ? '' : slots.nameHidden()]
        })
    }
</script>

<section
    bind:this={ref}
    {...restProps}
    class={classes.root}
    aria-labelledby={heading ? `${uid}-title` : undefined}
    data-sch-calendar-list
>
    {#if heading}
        <h3 id="{uid}-title" class={classes.title}>{heading}</h3>
    {/if}
    <ul class={classes.list}>
        {#each calendars as calendar (calendar.id)}
            {@const visible = !hiddenIds.has(calendar.id)}
            <li class={classes.item} data-sch-calendar={calendar.id}>
                {#if item}
                    {@render item({ calendar, visible, toggle: () => toggle(calendar.id) })}
                {:else}
                    <label class={classes.label}>
                        <Checkbox
                            checked={visible}
                            onCheckedChange={() => toggle(calendar.id)}
                            size="sm"
                        />
                        <span class={swatchClass(calendar.color ?? 'primary')}></span>
                        <span class={nameClass(visible)}>{calendar.title}</span>
                    </label>
                {/if}
            </li>
        {/each}
    </ul>
</section>
