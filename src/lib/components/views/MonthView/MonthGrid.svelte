<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { SchedulerEvent } from '../../../types/event.types.js'
    import type { SpanPosition } from '../../../types/layout.types.js'
    import type { ViewProps } from '../../../types/view.types.js'
    import { countByCell, insertSpans, overflowByCell } from '../../../core/layout/spans.js'
    import {
        formatDayNumber,
        formatLongDate,
        formatPopoverDay,
        formatWeekdayCompact,
        formatWeekdayLong
    } from '../../../core/time/format.js'
    import { dayFlags, holidaysByDate, isoDate } from '../../../core/time/day-flags.js'
    import { isoWeekOfRow, weekDayOf } from '../../../core/time/week.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { isEditable } from '../../../core/store/normalize.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import EventChip from '../../event/EventChip/EventChip.svelte'
    import AnchoredPopover from '../../shared/AnchoredPopover.svelte'
    import EventPopover from '../../event/EventPopover/EventPopover.svelte'
    import EventTrigger from '../../shared/EventTrigger.svelte'
    import WeekNumber from '../../shared/WeekNumber.svelte'
    import { monthGridVariants } from './month-grid.variants.js'

    const LANE_HEIGHT = 24
    const HEADER_HEIGHT = 30
    const MORE_HEIGHT = 18
    const COMPACT_WIDTH = 768

    let {
        view,
        anchor,
        days,
        columnsPerRow,
        scheduler,
        positioned,
        snippets,
        interactions,
        preview,
        focus,
        selectedEventId,
        onSelectEvent,
        detailPopover,
        onDeleteEvent,
        onOpenEvent
    }: ViewProps<T> = $props()

    const classes = monthGridVariants()
    const rows = $derived(
        Array.from({ length: Math.ceil(days.length / columnsPerRow) }, (_, row) => row)
    )
    const columnTemplate = $derived(`repeat(${columnsPerRow}, minmax(0, 1fr))`)

    let bodyHeight = $state(0)
    let bodyWidth = $state(0)
    const compact = $derived(bodyWidth > 0 && bodyWidth < COMPACT_WIDTH)
    const minRowHeight = $derived(HEADER_HEIGHT + LANE_HEIGHT + 8 + (compact ? MORE_HEIGHT : 0))
    const cellHeight = $derived(
        bodyHeight > 0 ? Math.max(bodyHeight / rows.length, minRowHeight) : 120
    )
    const maxLanes = $derived(
        Math.max(
            Math.floor(
                (cellHeight - HEADER_HEIGHT - 4 - (compact ? MORE_HEIGHT : 0)) / LANE_HEIGHT
            ),
            1
        )
    )

    const laidOut = $derived(positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'))
    const previewSpans = $derived(
        (preview?.positioned ?? []).filter((p): p is SpanPosition<T> => p.kind === 'span')
    )
    const draggingId = $derived(preview?.kind === 'create' ? null : (preview?.event.id ?? null))
    const inserted = $derived(
        preview
            ? insertSpans(laidOut, previewSpans, draggingId, maxLanes)
            : { spans: laidOut, ghosts: [] }
    )
    const spans = $derived(inserted.spans)
    const ghosts = $derived(inserted.ghosts)
    const lifted = $derived(laidOut.filter((span) => span.event.id === draggingId))
    const visible = $derived([...spans, ...lifted].filter((span) => span.lane < maxLanes))
    const overflow = $derived(overflowByCell(spans, maxLanes, columnsPerRow))
    const counts = $derived(countByCell(spans, columnsPerRow))
    const todayWeekDay = $derived(weekDayOf(scheduler.now))
    const showTodayColumn = $derived(days.some((day) => isSameDay(day, scheduler.now)))
    const holidays = $derived(holidaysByDate(scheduler.holidays))

    const isOutside = (day: ZonedDateTime) => day.month !== anchor.month
    const isToday = (day: ZonedDateTime) => isSameDay(day, scheduler.now)
    const isAnchor = (day: ZonedDateTime) => isSameDay(day, anchor)

    const ghostTop = (span: SpanPosition<T>) =>
        span.row * cellHeight + HEADER_HEIGHT + span.lane * LANE_HEIGHT

    const draggable = (event: SchedulerEvent<T>) =>
        isEditable(event, scheduler.editable) ? classes.eventDraggable() : ''

    function spansOn(dayIndex: number) {
        const row = Math.floor(dayIndex / columnsPerRow)
        const column = dayIndex % columnsPerRow
        return spans
            .filter(
                (span) => span.row === row && span.startColumn <= column && span.endColumn > column
            )
            .sort((a, b) => a.lane - b.lane)
    }

    function cellLabel(day: ZonedDateTime, dayIndex: number): string {
        const date = formatLongDate(day, scheduler.locale)
        const title = holidays.get(isoDate(day))?.title
        const named = title ? scheduler.labels.holidayDate(date, title) : date
        return scheduler.labels.dayCell(named, counts.get(dayIndex) ?? 0)
    }

    function eventProps(span: SpanPosition<T>) {
        return {
            event: span.event,
            position: span,
            view,
            isDragging: draggingId === span.event.id,
            isResizing: false,
            isSelected: selectedEventId === span.event.id
        }
    }

    function cellProps(day: ZonedDateTime) {
        return {
            date: day,
            view,
            isToday: isToday(day),
            isAnchor: isAnchor(day),
            ...dayFlags(day, holidays, scheduler.businessHours),
            isOutside: isOutside(day)
        }
    }
</script>

<div class={classes.root()} data-sch-month-grid data-sch-gesture={preview?.kind}>
    <div class={classes.header()} style:grid-template-columns={columnTemplate}>
        {#each days.slice(0, columnsPerRow) as day (isoDate(day))}
            <div class={classes.weekday()}>
                {compact
                    ? formatWeekdayCompact(day, scheduler.locale)
                    : formatWeekdayLong(day, scheduler.locale)}
            </div>
        {/each}
    </div>

    <div
        class={classes.body()}
        style:grid-template-rows="repeat({rows.length}, minmax({minRowHeight}px, 1fr))"
        bind:clientHeight={bodyHeight}
        bind:clientWidth={bodyWidth}
        {@attach interactions.grid}
    >
        {#each rows as row (row)}
            <div class={classes.row()}>
                <div class={classes.cells()} style:grid-template-columns={columnTemplate}>
                    {#each days.slice(row * columnsPerRow, row * columnsPerRow + columnsPerRow) as day, column (isoDate(day))}
                        {@const dayIndex = row * columnsPerRow + column}
                        {@const more = overflow.get(dayIndex) ?? 0}
                        {@const holiday = holidays.get(isoDate(day))}
                        {@const week = column === 0 ? isoWeekOfRow(day).week : null}
                        <div
                            class={classes.cell({
                                class: [
                                    holiday ? classes.cellHoliday() : '',
                                    showTodayColumn && weekDayOf(day) === todayWeekDay
                                        ? classes.cellTodayColumn()
                                        : '',
                                    focus?.dayIndex === dayIndex ? classes.cellFocus() : '',
                                    column === columnsPerRow - 1 ? classes.cellLast() : ''
                                ]
                            })}
                            data-sch-day={isoDate(day)}
                            data-sch-day-index={dayIndex}
                            data-sch-all-day
                            data-sch-day-cell
                            data-sch-focus={focus?.dayIndex === dayIndex ? '' : undefined}
                            data-sch-anchor={isAnchor(day) ? '' : undefined}
                            role="group"
                            aria-label={cellLabel(day, dayIndex)}
                        >
                            <div
                                class={classes.cellHeader({
                                    class: compact ? classes.cellHeaderCompact() : ''
                                })}
                            >
                                <div class={classes.cellLead()}>
                                    <span
                                        class={classes.dayNumber({
                                            class: [
                                                isOutside(day) ? classes.dayNumberOutside() : '',
                                                isAnchor(day) && !isToday(day)
                                                    ? classes.dayNumberAnchor()
                                                    : '',
                                                isToday(day) ? classes.dayNumberToday() : ''
                                            ]
                                        })}
                                        aria-current={isToday(day) ? 'date' : undefined}
                                    >
                                        {formatDayNumber(day, scheduler.locale)}
                                    </span>
                                    {#if scheduler.weekNumbers && week !== null && !compact}
                                        <WeekNumber
                                            {week}
                                            labels={scheduler.labels}
                                            class={classes.weekNumber()}
                                        />
                                    {/if}
                                    {#if holiday?.title && !compact}
                                        <span class={classes.holidayTitle()} data-sch-holiday-title>
                                            {holiday.title}
                                        </span>
                                    {/if}
                                </div>
                                {#if more > 0}
                                    <AnchoredPopover
                                        side="bottom"
                                        align="end"
                                        class={classes.moreTrigger({
                                            class: compact ? classes.moreTriggerCompact() : ''
                                        })}
                                        contentClass={classes.popover()}
                                    >
                                        {#snippet trigger(props)}
                                            <button
                                                {...props}
                                                type="button"
                                                class={classes.more()}
                                                data-sch-more={isoDate(day)}
                                                aria-label={scheduler.labels.more(more)}
                                            >
                                                +{more}
                                            </button>
                                        {/snippet}
                                        {#snippet panel()}
                                            <p class={classes.popoverTitle()}>
                                                {formatPopoverDay(day, scheduler.locale)}
                                            </p>
                                            <div
                                                class={classes.popoverList()}
                                                data-sch-more-list={isoDate(day)}
                                            >
                                                {#each spansOn(dayIndex) as span (span.event.id)}
                                                    <EventChip
                                                        event={span.event}
                                                        color={eventColor(
                                                            span.event,
                                                            scheduler.calendars
                                                        )}
                                                        position={span}
                                                        variant="solid"
                                                        size="sm"
                                                        locale={scheduler.locale}
                                                        hour12={scheduler.hour12}
                                                        selected={selectedEventId === span.event.id}
                                                        onclick={() => onSelectEvent(span.event.id)}
                                                    />
                                                {/each}
                                            </div>
                                        {/snippet}
                                    </AnchoredPopover>
                                {/if}
                            </div>
                            {#if snippets.cell}
                                {@render snippets.cell(cellProps(day))}
                            {/if}
                        </div>
                    {/each}
                </div>

                <div
                    class={classes.events()}
                    style:grid-template-columns={columnTemplate}
                    style:grid-template-rows="repeat({maxLanes}, {LANE_HEIGHT}px)"
                    style:top="{HEADER_HEIGHT}px"
                >
                    {#each visible.filter((span) => span.row === row) as span (span.event.id)}
                        <div
                            class={classes.event({
                                class: [
                                    draggable(span.event),
                                    span.event.id === draggingId ? classes.eventLifted() : ''
                                ]
                            })}
                            style:grid-column="{span.startColumn + 1} / {span.endColumn + 1}"
                            style:grid-row={span.lane + 1}
                            data-sch-event={span.event.id}
                            {@attach interactions.event(span)}
                        >
                            <EventPopover
                                event={span.event}
                                {scheduler}
                                enabled={detailPopover}
                                detail={snippets.detail}
                                onDelete={onDeleteEvent}
                                onOpen={onOpenEvent}
                                onSelect={onSelectEvent}
                            >
                                {#snippet children(trigger)}
                                    {#if snippets.event}
                                        <EventTrigger
                                            snippet={snippets.event}
                                            props={eventProps(span)}
                                            {trigger}
                                        />
                                    {:else}
                                        <EventChip
                                            {...trigger}
                                            event={span.event}
                                            color={eventColor(span.event, scheduler.calendars)}
                                            position={span}
                                            variant="solid"
                                            size="sm"
                                            locale={scheduler.locale}
                                            hour12={scheduler.hour12}
                                            selected={selectedEventId === span.event.id}
                                            dragging={draggingId === span.event.id}
                                            showTime={!compact}
                                        />
                                    {/if}
                                {/snippet}
                            </EventPopover>
                        </div>
                    {/each}
                </div>
            </div>
        {/each}
        {#each ghosts as span, index (`${span.event.id}:${index}`)}
            <div
                class={classes.ghost()}
                style:top="{ghostTop(span)}px"
                style:height="{LANE_HEIGHT}px"
                style:inset-inline-start="{(span.startColumn * 100) / columnsPerRow}%"
                style:width="{((span.endColumn - span.startColumn) * 100) / columnsPerRow}%"
                data-sch-ghost
            >
                <EventChip
                    event={span.event}
                    color={eventColor(span.event, scheduler.calendars)}
                    position={span}
                    variant="solid"
                    size="sm"
                    class={classes.ghostChip()}
                    locale={scheduler.locale}
                    hour12={scheduler.hour12}
                />
            </div>
        {/each}
    </div>
</div>
