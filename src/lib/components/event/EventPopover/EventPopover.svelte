<script lang="ts" module>
    export interface EventTrigger {
        'aria-haspopup'?: 'dialog'
        'aria-expanded'?: boolean
        onclick: () => void
    }
</script>

<script lang="ts" generics="T">
    import { Button, Tooltip } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import type { SchedulerEvent } from '../../../types/event.types.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { EventDetailSnippetProps } from '../../../types/snippet.types.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { isEditable } from '../../../core/store/normalize.js'
    import { EVENT_SWATCH } from '../EventChip/event-chip.variants.js'
    import AnchoredPopover from '../../shared/AnchoredPopover.svelte'
    import EventDetails from '../EventDetails/EventDetails.svelte'
    import { eventPopoverVariants } from './event-popover.variants.js'

    interface Props {
        event: SchedulerEvent<T>
        scheduler: SchedulerContext
        enabled: boolean
        detail?: Snippet<[EventDetailSnippetProps<T>]>
        onDelete: (eventId: string) => void
        onOpen?: (eventId: string) => void
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
        onOpen,
        onSelect,
        side = 'right',
        children
    }: Props = $props()

    let open = $state(false)

    const classes = eventPopoverVariants()
    const deletable = $derived(isEditable(event, scheduler.editable))
    const color = $derived(eventColor(event, scheduler.calendars))

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

    function openPanel() {
        open = false
        onOpen?.(event.id)
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
                        {#if onOpen}
                            <Tooltip text={scheduler.labels.openEvent} ignoreNonKeyboardFocus>
                                <Button
                                    variant="ghost"
                                    color="surface"
                                    size="sm"
                                    square
                                    icon="lucide:panel-right-open"
                                    aria-label={scheduler.labels.openEvent}
                                    data-sch-detail-open
                                    onclick={openPanel}
                                />
                            </Tooltip>
                        {/if}
                        {#if deletable}
                            <Tooltip text={scheduler.labels.deleteEvent} ignoreNonKeyboardFocus>
                                <Button
                                    variant="ghost"
                                    color="surface"
                                    size="sm"
                                    square
                                    icon="lucide:trash-2"
                                    aria-label={scheduler.labels.deleteEvent}
                                    onclick={remove}
                                />
                            </Tooltip>
                        {/if}
                        <Tooltip text={scheduler.labels.close} ignoreNonKeyboardFocus>
                            <Button
                                variant="ghost"
                                color="surface"
                                size="sm"
                                square
                                icon="lucide:x"
                                aria-label={scheduler.labels.close}
                                onclick={close}
                            />
                        </Tooltip>
                    </div>
                </div>
                <EventDetails {event} {scheduler} class={classes.details()} />
                {@render detail?.({ event, close })}
            </div>
        {/snippet}
    </AnchoredPopover>
{:else}
    {@render children({ onclick: select })}
{/if}
