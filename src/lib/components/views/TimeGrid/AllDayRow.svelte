<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { eventColor } from '../../../core/store/filters.js'
    import { isEditable } from '../../../core/store/normalize.js'
    import { isoDate } from '../../../core/time/day-flags.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { GridFocus } from '../../../types/interaction.types.js'
    import type { ViewProps, ViewSnippets } from '../../../types/view.types.js'
    import EventChip from '../../event/EventChip/EventChip.svelte'
    import EventPopover from '../../event/EventPopover/EventPopover.svelte'
    import { BODY_COLUMNS, dayColumns, type AllDayLayout } from './time-grid.js'
    import { timeGridVariants } from './time-grid.variants.js'

    interface Props {
        days: ZonedDateTime[]
        layout: AllDayLayout<T>
        tints: string[][]
        focus: GridFocus | null
        draggingId: string | null
        selectedEventId: string | null
        scheduler: SchedulerContext
        detail: ViewSnippets<T>['detail']
        detailPopover: boolean
        onDeleteEvent: ViewProps<T>['onDeleteEvent']
        onSelectEvent: ViewProps<T>['onSelectEvent']
        attachEvent: ViewProps<T>['interactions']['event']
    }

    let {
        days,
        layout,
        tints,
        focus,
        draggingId,
        selectedEventId,
        scheduler,
        detail,
        detailPopover,
        onDeleteEvent,
        onSelectEvent,
        attachEvent
    }: Props = $props()

    const classes = timeGridVariants()
    const rows = $derived(Math.max(layout.laneCount, 1))
</script>

<div class={classes.allDayRow()} style:grid-template-columns={BODY_COLUMNS}>
    <div class={classes.allDayLabel()}>{scheduler.labels.allDay}</div>
    <div class={classes.allDayCells()} style:grid-template-columns={dayColumns(days.length)}>
        {#each days as day, dayIndex (isoDate(day))}
            <div
                class={classes.allDayCell({ class: tints[dayIndex] })}
                style:min-height="{rows * 1.625 + 0.5}rem"
                data-sch-day-index={dayIndex}
                data-sch-all-day
            >
                {#if focus && focus.minutes === null && focus.dayIndex === dayIndex}
                    <div class={classes.focusRing({ class: 'inset-y-0' })} data-sch-focus></div>
                {/if}
            </div>
        {/each}
        <div
            class={classes.allDayEvents()}
            style:grid-template-columns={dayColumns(days.length)}
            style:grid-template-rows="repeat({rows}, 1.375rem)"
        >
            {#each layout.spans as position (position.event.id + position.row)}
                <div
                    class={classes.allDayEvent({
                        class: [
                            isEditable(position.event, scheduler.editable)
                                ? classes.allDayEventDraggable()
                                : '',
                            position.event.id === draggingId ? classes.allDayEventLifted() : ''
                        ]
                    })}
                    style:grid-column="{position.startColumn + 1} / {position.endColumn + 1}"
                    style:grid-row={position.lane + 1}
                    data-sch-event={position.event.id}
                    {@attach attachEvent(position)}
                >
                    <EventPopover
                        event={position.event}
                        {scheduler}
                        enabled={detailPopover}
                        {detail}
                        onDelete={onDeleteEvent}
                        onSelect={onSelectEvent}
                        side="bottom"
                    >
                        {#snippet children(trigger)}
                            <EventChip
                                {...trigger}
                                event={position.event}
                                color={eventColor(position.event, scheduler.calendars)}
                                {position}
                                variant="solid"
                                size="sm"
                                class="h-full"
                                locale={scheduler.locale}
                                hour12={scheduler.hour12}
                                selected={selectedEventId === position.event.id}
                                dragging={draggingId === position.event.id}
                            />
                        {/snippet}
                    </EventPopover>
                </div>
            {/each}
            {#each layout.ghosts as position (position.event.id + position.row)}
                <div
                    class={classes.allDayGhost()}
                    style:grid-column="{position.startColumn + 1} / {position.endColumn + 1}"
                    style:grid-row={position.lane + 1}
                    data-sch-ghost
                >
                    <EventChip
                        event={position.event}
                        color={eventColor(position.event, scheduler.calendars)}
                        {position}
                        variant="solid"
                        size="sm"
                        class={classes.ghostChip({ class: 'h-full' })}
                        locale={scheduler.locale}
                        hour12={scheduler.hour12}
                    />
                </div>
            {/each}
        </div>
    </div>
</div>
