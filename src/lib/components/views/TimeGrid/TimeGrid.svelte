<script lang="ts" generics="T">
    import { ScrollArea } from 'sv5ui'
    import { untrack } from 'svelte'
    import { eventColor } from '../../../core/store/filters.js'
    import { holidaysByDate, isoDate } from '../../../core/time/day-flags.js'
    import { isoWeek, isoWeekOfRow } from '../../../core/time/week.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import type { ViewProps } from '../../../types/view.types.js'
    import EventChip from '../../event/EventChip/EventChip.svelte'
    import AllDayRow from './AllDayRow.svelte'
    import DayColumn from './DayColumn.svelte'
    import DayHeaders from './DayHeaders.svelte'
    import DayTitle from './DayTitle.svelte'
    import HourGutter from './HourGutter.svelte'
    import {
        BODY_COLUMNS,
        COMPACT_HEIGHT,
        TINY_CHIP,
        TINY_HEIGHT,
        allDayLayout,
        columnTint,
        dayColumns,
        draggedEventId,
        emptyTop,
        ghostColumn,
        gridLines,
        layersByDay,
        nowOffset,
        scrollTop,
        slotTop,
        splitPositions
    } from './time-grid.js'
    import { timeGridVariants } from './time-grid.variants.js'

    let {
        view,
        anchor,
        range,
        days,
        scheduler,
        scale,
        positioned,
        snippets,
        interactions,
        preview,
        focus,
        selectedEventId,
        onSelectEvent,
        detailPopover,
        onDeleteEvent
    }: ViewProps<T> = $props()

    const classes = timeGridVariants()
    const single = $derived(days.length === 1)
    const laidOut = $derived(splitPositions(positioned))
    const layers = $derived(layersByDay(laidOut.timed, days.length))
    const draggingId = $derived(draggedEventId(preview))
    const allDay = $derived(allDayLayout(laidOut.spans, preview, draggingId))
    const ghostTimed = $derived(splitPositions(preview?.positioned ?? []).timed)
    const todayIndex = $derived(days.findIndex((day) => isSameDay(day, scheduler.now)))
    const nowTop = $derived(todayIndex >= 0 ? nowOffset(scheduler.now, scale) : null)
    const holidays = $derived(holidaysByDate(scheduler.holidays))
    const week = $derived((single ? isoWeek(days[0]) : isoWeekOfRow(days[0])).week)
    const tints = $derived(
        days.map((day, dayIndex) =>
            columnTint(holidays.has(isoDate(day)), dayIndex === todayIndex && !single)
        )
    )
    const focusTop = $derived(
        focus && focus.minutes !== null ? slotTop(focus.minutes, scale) : null
    )
    const lines = $derived(gridLines(scale))

    let viewport = $state<HTMLDivElement | null>(null)

    $effect(() => {
        const node = viewport
        void range
        if (!node) return
        untrack(() => {
            node.scrollTop = scrollTop({
                timed: laidOut.timed,
                firstDay: days[0],
                scale,
                nowTop,
                businessHours: scheduler.businessHours,
                single
            })
        })
    })
</script>

<div class={classes.root()} data-sch-time-grid data-sch-gesture={preview?.kind}>
    {#if single}
        <DayTitle
            day={days[0]}
            {scheduler}
            isToday={todayIndex === 0}
            holiday={holidays.get(isoDate(days[0]))}
            {week}
        />
    {:else}
        <DayHeaders
            {days}
            {view}
            {anchor}
            {scheduler}
            header={snippets.header}
            {todayIndex}
            {holidays}
            {tints}
            {week}
        />
    {/if}

    {#if allDay.spans.length > 0 || allDay.ghosts.length > 0}
        <AllDayRow
            {days}
            layout={allDay}
            {tints}
            {focus}
            {draggingId}
            {selectedEventId}
            {scheduler}
            detail={snippets.detail}
            {detailPopover}
            {onDeleteEvent}
            {onSelectEvent}
            attachEvent={interactions.event}
        />
    {/if}

    <div class={classes.body()}>
        <ScrollArea class={classes.scroll()} dir={scheduler.direction} bind:viewportRef={viewport}>
            <div class={classes.bodyGrid()} style:grid-template-columns={BODY_COLUMNS}>
                <HourGutter {scale} {scheduler} {nowTop} />
                <div
                    class={classes.columns()}
                    style:grid-template-columns={dayColumns(days.length)}
                    style:height="{scale.dayHeight}px"
                    style:background-image={lines}
                    {@attach interactions.grid}
                >
                    {#each days as day, dayIndex (isoDate(day))}
                        <DayColumn
                            {day}
                            {dayIndex}
                            {view}
                            {anchor}
                            {scheduler}
                            {scale}
                            {snippets}
                            layers={layers[dayIndex]}
                            tint={tints[dayIndex]}
                            {holidays}
                            isToday={dayIndex === todayIndex}
                            nowTop={dayIndex === todayIndex ? nowTop : null}
                            focusTop={focus?.dayIndex === dayIndex ? focusTop : null}
                            {single}
                            {draggingId}
                            {selectedEventId}
                            {detailPopover}
                            {onDeleteEvent}
                            {onSelectEvent}
                            attachEvent={interactions.event}
                        />
                    {/each}
                    {#each ghostTimed as position, index (`${position.event.id}:${index}`)}
                        {@const column = ghostColumn(position, days.length)}
                        <div
                            class={classes.ghost({
                                class: position.height < TINY_HEIGHT ? 'pb-0' : ''
                            })}
                            style:top="{position.top}px"
                            style:height="{Math.max(position.height, scale.slotHeight / 2)}px"
                            style:inset-inline-start={column.start}
                            style:width={column.width}
                            data-sch-ghost
                        >
                            <EventChip
                                event={position.event}
                                color={eventColor(position.event, scheduler.calendars)}
                                {position}
                                locale={scheduler.locale}
                                hour12={scheduler.hour12}
                                size={position.height < COMPACT_HEIGHT ? 'sm' : 'md'}
                                showTime={position.height >= COMPACT_HEIGHT}
                                class={classes.ghostChip({
                                    class: [
                                        'h-full',
                                        position.height < TINY_HEIGHT ? TINY_CHIP : ''
                                    ]
                                })}
                            />
                        </div>
                    {/each}
                    {#if positioned.length === 0}
                        <div
                            class={snippets.empty ? classes.emptyCustom() : classes.empty()}
                            style:top="{emptyTop(scale, nowTop)}px"
                            data-sch-empty
                        >
                            {#if snippets.empty}
                                {@render snippets.empty()}
                            {:else}
                                {scheduler.labels.noEvents}
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>
        </ScrollArea>
    </div>
</div>
