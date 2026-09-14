<script lang="ts" module>
    export interface EventTrigger {
        'aria-haspopup'?: 'dialog'
        'aria-expanded'?: boolean
        onclick: () => void
    }
</script>

<script lang="ts" generics="T">
    import { Button, Icon } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import type { SchedulerEvent } from '../../../types/event.types.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { EventDetailSnippetProps } from '../../../types/snippet.types.js'
    import { formatDayRange, formatLongDate, formatTimeRange } from '../../../core/time/format.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { isEditable } from '../../../core/store/normalize.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import { EVENT_SWATCH } from '../EventChip/event-chip.variants.js'
    import AnchoredPopover from '../../shared/AnchoredPopover.svelte'
    import { eventPopoverVariants } from './event-popover.variants.js'

    interface Props {
        event: SchedulerEvent<T>
        scheduler: SchedulerContext
        enabled: boolean
        detail?: Snippet<[EventDetailSnippetProps<T>]>
        onDelete: (eventId: string) => void
        onSelect: (eventId: string) => void
        side?: 'top' | 'right' | 'bottom' | 'left'
        children: Snippet<[EventTrigger]>
    }

    let {
        event,
        scheduler,
        enabled,
        detail,
        onDelete,
        onSelect,
        side = 'right',
        children
    }: Props = $props()

    let open = $state(false)

    const classes = eventPopoverVariants()
    const allDay = $derived(event.allDay === true)
    const lastDay = $derived(allDay ? event.end.subtract({ days: 1 }) : event.end)
    const primary = $derived(
        allDay && !isSameDay(event.start, lastDay)
            ? formatDayRange(event, scheduler.locale)
            : formatLongDate(event.start, scheduler.locale)
    )
    const secondary = $derived(
        allDay
            ? scheduler.labels.allDay
            : formatTimeRange(event.start, event.end, scheduler.locale, scheduler.hour12)
    )
    const deletable = $derived(isEditable(event, scheduler.editable))
    const color = $derived(eventColor(event, scheduler.calendars))
    const calendar = $derived(
        scheduler.calendars.find((candidate) => candidate.id === event.calendarId)
    )

    function select() {
        onSelect(event.id)
    }

    function close() {
        open = false
    }

    function remove() {
        open = false
        onDelete(event.id)
    }
</script>

{#if enabled}
    <AnchoredPopover
        bind:open
        {side}
        class={classes.trigger()}
        contentClass={classes.content()}
        onActivate={select}
    >
        {#snippet trigger(props)}
            {@render children(props)}
        {/snippet}
        {#snippet panel()}
            <div class={classes.card()} data-sch-detail={event.id}>
                <div class={classes.swatch({ class: EVENT_SWATCH[color] })}></div>
                <div class={classes.header()}>
                    <h3 class={classes.title()} dir="auto">{event.title}</h3>
                    <div class={classes.actions()}>
                        {#if deletable}
                            <Button
                                variant="ghost"
                                color="surface"
                                size="sm"
                                square
                                icon="lucide:trash-2"
                                aria-label={scheduler.labels.deleteEvent}
                                onclick={remove}
                            />
                        {/if}
                        <Button
                            variant="ghost"
                            color="surface"
                            size="sm"
                            square
                            icon="lucide:x"
                            aria-label={scheduler.labels.close}
                            onclick={close}
                        />
                    </div>
                </div>
                <div class={classes.row()}>
                    <Icon name="lucide:calendar" size={16} class={classes.icon()} />
                    <div>
                        <p class={classes.primary()}>{primary}</p>
                        <p class={classes.secondary()}>{secondary}</p>
                    </div>
                </div>
                {#if calendar}
                    <div class={classes.row()} data-sch-detail-calendar>
                        <span class={classes.calendarSwatch({ class: EVENT_SWATCH[color] })}></span>
                        <p class={classes.secondary()}>{calendar.title}</p>
                    </div>
                {/if}
                {@render detail?.({ event, close })}
            </div>
        {/snippet}
    </AnchoredPopover>
{:else}
    {@render children({ onclick: select })}
{/if}
