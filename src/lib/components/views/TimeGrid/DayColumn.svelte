<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { eventColor } from '../../../core/store/filters.js'
    import { isEditable } from '../../../core/store/normalize.js'
    import { dayFlags, isoDate } from '../../../core/time/day-flags.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { TimePosition, TimeScale } from '../../../types/layout.types.js'
    import type { Holiday } from '../../../types/range.types.js'
    import type { ViewProps, ViewSnippets } from '../../../types/view.types.js'
    import EventChip from '../../event/EventChip/EventChip.svelte'
    import EventPopover from '../../event/EventPopover/EventPopover.svelte'
    import EventTrigger from '../../shared/EventTrigger.svelte'
    import {
        COMPACT_HEIGHT,
        TINY_CHIP,
        TINY_HEIGHT,
        offHoursBlocks,
        type DayLayers
    } from './time-grid.js'
    import { timeGridVariants } from './time-grid.variants.js'

    interface Props {
        day: ZonedDateTime
        dayIndex: number
        view: string
        anchor: ZonedDateTime
        scheduler: SchedulerContext
        scale: TimeScale
        snippets: ViewSnippets<T>
        layers: DayLayers<T>
        tint: string[]
        holidays: Map<string, Holiday>
        isToday: boolean
        nowTop: number | null
        focusTop: number | null
        single: boolean
        draggingId: string | null
        selectedEventId: string | null
        detailPopover: boolean
        onDeleteEvent: ViewProps<T>['onDeleteEvent']
        onOpenEvent: ViewProps<T>['onOpenEvent']
        onSelectEvent: ViewProps<T>['onSelectEvent']
        attachEvent: ViewProps<T>['interactions']['event']
    }

    let {
        day,
        dayIndex,
        view,
        anchor,
        scheduler,
        scale,
        snippets,
        layers,
        tint,
        holidays,
        isToday,
        nowTop,
        focusTop,
        single,
        draggingId,
        selectedEventId,
        detailPopover,
        onDeleteEvent,
        onOpenEvent,
        onSelectEvent,
        attachEvent
    }: Props = $props()

    const classes = timeGridVariants()
    const offHours = $derived(offHoursBlocks(day, scale, scheduler.businessHours, holidays))

    function cellProps() {
        return {
            date: day,
            view,
            isToday,
            isAnchor: isSameDay(day, anchor),
            ...dayFlags(day, holidays, scheduler.businessHours),
            isOutside: false
        }
    }

    function eventProps(position: TimePosition<T>) {
        return {
            event: position.event,
            position,
            view,
            isDragging: draggingId === position.event.id,
            isResizing: false,
            isSelected: selectedEventId === position.event.id
        }
    }
</script>

<div
    class={classes.column({ class: tint })}
    data-sch-day={isoDate(day)}
    data-sch-day-index={dayIndex}
>
    {#each offHours as block (block.top)}
        <div
            class={classes.offHours()}
            style:top="{block.top}px"
            style:height="{block.height}px"
            data-sch-off-hours
        ></div>
    {/each}
    {#if snippets.cell}
        {@render snippets.cell(cellProps())}
    {/if}
    {#each layers.background as position (position.event.id)}
        <div
            class={classes.background()}
            style:top="{position.top}px"
            style:height="{position.height}px"
            data-sch-background={position.event.id}
        >
            {position.event.title}
        </div>
    {/each}
    <div class={classes.events()}>
        {#each layers.foreground as position (position.event.id + position.dayIndex)}
            {@const compact = position.height < COMPACT_HEIGHT}
            <div
                class={classes.event({
                    class: [
                        isEditable(position.event, scheduler.editable)
                            ? classes.eventDraggable()
                            : '',
                        position.height < TINY_HEIGHT ? 'pb-0' : ''
                    ]
                })}
                style:top="{position.top}px"
                style:height="{Math.max(position.height, scale.slotHeight / 2)}px"
                style:inset-inline-start="{position.left * 100}%"
                style:width="{position.width * 100}%"
                data-sch-event={position.event.id}
                {@attach attachEvent(position)}
            >
                <EventPopover
                    event={position.event}
                    {scheduler}
                    enabled={detailPopover}
                    detail={snippets.detail}
                    onDelete={onDeleteEvent}
                    onOpen={onOpenEvent}
                    onSelect={onSelectEvent}
                    side={single ? 'bottom' : 'right'}
                >
                    {#snippet children(trigger)}
                        {#if snippets.event}
                            <EventTrigger
                                snippet={snippets.event}
                                props={eventProps(position)}
                                {trigger}
                                class="block h-full"
                            />
                        {:else}
                            <EventChip
                                {...trigger}
                                event={position.event}
                                color={eventColor(position.event, scheduler.calendars)}
                                {position}
                                locale={scheduler.locale}
                                hour12={scheduler.hour12}
                                size={compact ? 'sm' : 'md'}
                                showTime={!compact}
                                selected={selectedEventId === position.event.id}
                                dragging={draggingId === position.event.id}
                                class={['h-full', position.height < TINY_HEIGHT ? TINY_CHIP : '']}
                            />
                        {/if}
                    {/snippet}
                </EventPopover>
            </div>
        {/each}
    </div>
    {#if focusTop !== null}
        <div
            class={classes.focusRing()}
            style:top="{focusTop}px"
            style:height="{scale.slotHeight}px"
            data-sch-focus
        ></div>
    {/if}
    {#if nowTop !== null}
        <div class={classes.nowLine()} style:top="{nowTop}px" data-sch-now>
            <span class={classes.nowDot()}></span>
            <span class={classes.nowRule()}></span>
        </div>
    {/if}
</div>
