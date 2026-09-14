<script lang="ts" generics="T">
    import { Button, Slideover } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import type { SchedulerEvent } from '../../../types/event.types.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type {
        EventDetailSnippetProps,
        EventPanelSnippetProps
    } from '../../../types/snippet.types.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { isEditable } from '../../../core/store/normalize.js'
    import { EVENT_SWATCH } from '../EventChip/event-chip.variants.js'
    import EventDetails from '../EventDetails/EventDetails.svelte'
    import { eventPanelVariants } from './event-panel.variants.js'

    interface Props {
        event: SchedulerEvent<T>
        open: boolean
        scheduler: SchedulerContext
        side: 'left' | 'right'
        overlayClass: string
        contentClass: string
        detail?: Snippet<[EventDetailSnippetProps<T>]>
        panel?: Snippet<[EventPanelSnippetProps<T>]>
        onClose: () => void
        onDelete: (eventId: string) => void
    }

    let {
        event,
        open,
        scheduler,
        side,
        overlayClass,
        contentClass,
        detail,
        panel,
        onClose,
        onDelete
    }: Props = $props()

    const classes = eventPanelVariants()
    const deletable = $derived(isEditable(event, scheduler.editable))
    const color = $derived(eventColor(event, scheduler.calendars))

    function setOpen(value: boolean) {
        if (!value) onClose()
    }

    function remove() {
        if (!deletable) return
        onDelete(event.id)
        onClose()
    }
</script>

{#snippet deleteFooter()}
    <Button
        label={scheduler.labels.deleteEvent}
        icon="lucide:trash-2"
        color="error"
        variant="soft"
        onclick={remove}
    />
{/snippet}

<Slideover
    bind:open={() => open, setOpen}
    {side}
    title={event.title}
    portal={false}
    preventScroll={false}
    ui={{ overlay: overlayClass, content: contentClass }}
    footer={!panel && deletable ? deleteFooter : undefined}
>
    {#snippet titleSlot()}
        <span class={classes.heading()}>
            <span class={classes.swatch({ class: EVENT_SWATCH[color] })}></span>
            <span class={classes.title()} dir="auto">{event.title}</span>
        </span>
    {/snippet}
    {#snippet body()}
        <div class={classes.body()} data-sch-event-panel={event.id}>
            {#if panel}
                {@render panel({ event, close: onClose, remove, deletable })}
            {:else}
                <EventDetails {event} {scheduler} />
                {@render detail?.({ event, close: onClose })}
            {/if}
        </div>
    {/snippet}
</Slideover>
