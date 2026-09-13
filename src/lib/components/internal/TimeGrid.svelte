<script lang="ts" generics="T">
    import { parseZonedDateTime, type ZonedDateTime } from '@internationalized/date'
    import { Badge, ScrollArea } from 'sv5ui'
    import { untrack } from 'svelte'
    import type { SchedulerEvent } from '../../types/event.types.js'
    import type { SpanPosition, TimePosition, ViewProps } from '../../types/extension.types.js'
    import { insertSpans } from '../../core/layout/spans.js'
    import { eachDay } from '../../core/time/range.js'
    import {
        formatDate,
        formatDayNumber,
        formatHourParts,
        formatTime,
        formatWeekday,
        formatWeekdayLong
    } from '../../core/time/format.js'
    import {
        dayFlags,
        holidaysByDate,
        isBusinessDay,
        isoDate,
        parseClock
    } from '../../core/time/day-flags.js'
    import { isoWeek, isoWeekOfRow } from '../../core/time/week.js'
    import { isEditable } from '../../core/store/normalize.js'
    import { isSameDay } from '../../core/time/zone.js'
    import EventChip from '../EventChip/EventChip.svelte'
    import EventPopover from './EventPopover.svelte'
    import WeekNumber from './WeekNumber.svelte'
    import { timeGridVariants } from './time-grid.variants.js'

    const COMPACT_HEIGHT = 38
    const DEFAULT_SCROLL_HOUR = 7
    const NOW_LABEL_CLEARANCE = 12
    const MINUTES_PER_HOUR = 60
    const EMPTY_OFFSET = 20

    let {
        view,
        anchor,
        range,
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
    const days = $derived(eachDay(range))
    const single = $derived(days.length === 1)
    const headerTemplate = $derived(`4rem repeat(${days.length}, minmax(0, 1fr))`)
    const bodyTemplate = '4rem minmax(0, 1fr)'
    const dayTemplate = $derived(`repeat(${days.length}, minmax(0, 1fr))`)
    const hourHeight = $derived(scale.slotHeight * (60 / scale.slotMinutes))
    const gridLines = $derived(
        `repeating-linear-gradient(to bottom, color-mix(in oklab, var(--color-outline-variant) 45%, transparent) 0 1px, transparent 1px ${hourHeight}px)`
    )

    const laidOutSpans = $derived(positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'))
    const timed = $derived(positioned.filter((p): p is TimePosition<T> => p.kind === 'time'))
    const byDay = $derived(
        days.map((_, dayIndex) => {
            const inDay = timed.filter((p) => p.dayIndex === dayIndex)
            return {
                background: inDay.filter((p) => p.event.background),
                foreground: inDay.filter((p) => !p.event.background)
            }
        })
    )
    const ghostTimed = $derived(
        (preview?.positioned ?? []).filter((p): p is TimePosition<T> => p.kind === 'time')
    )
    const previewSpans = $derived(
        (preview?.positioned ?? []).filter((p): p is SpanPosition<T> => p.kind === 'span')
    )
    const draggingId = $derived(preview?.kind === 'create' ? null : (preview?.event.id ?? null))
    const inserted = $derived(
        preview
            ? insertSpans(laidOutSpans, previewSpans, draggingId)
            : { spans: laidOutSpans, ghosts: [] }
    )
    const ghostSpans = $derived(inserted.ghosts)
    const lifted = $derived(laidOutSpans.filter((span) => span.event.id === draggingId))
    const spans = $derived([...inserted.spans, ...lifted])
    const laneCount = $derived(
        [...inserted.spans, ...ghostSpans].reduce((max, p) => Math.max(max, p.lane + 1), 0)
    )
    const focusTop = $derived(
        focus && focus.minutes !== null
            ? (focus.minutes / scale.slotMinutes) * scale.slotHeight
            : null
    )

    const todayIndex = $derived(days.findIndex((day) => isSameDay(day, scheduler.now)))
    const nowTop = $derived(scale.toPixel(scheduler.now))
    const nowLabel = $derived(formatTime(scheduler.now, scheduler.locale, scheduler.hour12))
    const holidays = $derived(holidaysByDate(scheduler.holidays))
    const week = $derived(single ? isoWeek(days[0]) : isoWeekOfRow(days[0]))
    const hourLabels = $derived(
        Array.from({ length: 23 }, (_, i) => {
            const hour = i + 1
            const clock = parseZonedDateTime(`2000-01-03T${String(hour).padStart(2, '0')}:00[UTC]`)
            return {
                hour,
                top: (hour * MINUTES_PER_HOUR * scale.slotHeight) / scale.slotMinutes,
                parts: formatHourParts(clock, scheduler.locale, scheduler.hour12)
            }
        }).filter((label) => todayIndex < 0 || Math.abs(label.top - nowTop) >= NOW_LABEL_CLEARANCE)
    )
    const hasAllDay = $derived(spans.length > 0 || ghostSpans.length > 0)
    const isEmpty = $derived(positioned.length === 0)
    const emptyTop = $derived(
        todayIndex >= 0
            ? Math.min(nowTop + EMPTY_OFFSET, scale.dayHeight - EMPTY_OFFSET * 2)
            : scale.dayHeight / 2
    )

    let viewport = $state<HTMLDivElement | null>(null)

    $effect(() => {
        const node = viewport
        void range
        if (!node) return
        untrack(() => {
            node.scrollTop = Math.max(scrollTarget() - hourHeight / 2, 0)
        })
    })

    function scrollTarget(): number {
        const starts = timed.filter((p) => p.segmentStart.compare(p.event.start) === 0)
        const first = starts.length > 0 ? Math.min(...starts.map((p) => p.top)) : null
        const now = todayIndex >= 0 ? nowTop : null
        const opening = scheduler.businessHours
            ? parseClock(scheduler.businessHours.start)
            : { hour: DEFAULT_SCROLL_HOUR, minute: 0 }
        const fallback = scale.toPixel(days[0].set(opening))
        return single ? (first ?? now ?? fallback) : (now ?? first ?? fallback)
    }

    const columnTint = (day: ZonedDateTime, dayIndex: number) => [
        holidays.has(isoDate(day)) ? classes.holidayColumn() : '',
        dayIndex === todayIndex && !single ? classes.todayColumn() : ''
    ]

    function offHours(day: ZonedDateTime): { top: number; height: number }[] {
        const hours = scheduler.businessHours
        if (!hours || holidays.has(isoDate(day)) || !isBusinessDay(day, hours)) return []
        const open = scale.toPixel(day.set(parseClock(hours.start)))
        const close = scale.toPixel(day.set(parseClock(hours.end)))
        return [
            { top: 0, height: open },
            { top: close, height: scale.dayHeight - close }
        ].filter((block) => block.height > 0)
    }

    function cellProps(day: ZonedDateTime, dayIndex: number) {
        return {
            date: day,
            view,
            isToday: dayIndex === todayIndex,
            isAnchor: isSameDay(day, anchor),
            ...dayFlags(day, holidays, scheduler.businessHours),
            isOutside: false
        }
    }

    const columnOffset = (position: TimePosition<T>) =>
        `${((position.dayIndex + position.left) * 100) / days.length}%`
    const columnWidth = (position: TimePosition<T>) => `${(position.width * 100) / days.length}%`

    const draggable = (event: SchedulerEvent<T>) =>
        isEditable(event) ? classes.eventDraggable() : ''
    const draggableSpan = (event: SchedulerEvent<T>) =>
        isEditable(event) ? classes.allDayEventDraggable() : ''

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

<div class={classes.root()} data-sch-time-grid data-sch-gesture={preview?.kind}>
    {#if single}
        {@const holiday = holidays.get(isoDate(days[0]))}
        <div
            class={classes.dayTitle({ class: holiday ? classes.holidayColumn() : '' })}
            data-sch-day-title
        >
            <span class={classes.dayTitleWeekday()}>
                {formatWeekdayLong(days[0], scheduler.locale)}
            </span>
            <div class={classes.dayTitleRow()}>
                <h3 class={classes.dayTitleDate()}>{formatDate(days[0], scheduler.locale)}</h3>
                {#if todayIndex === 0}
                    <Badge
                        color="primary"
                        variant="soft"
                        size="sm"
                        label={scheduler.labels.today}
                        class={classes.todayBadge()}
                    />
                {/if}
                {#if holiday?.title}
                    <Badge
                        color="tertiary"
                        variant="soft"
                        size="sm"
                        label={holiday.title}
                        class={classes.todayBadge()}
                    />
                {/if}
                {#if scheduler.weekNumbers}
                    <WeekNumber
                        week={week.week}
                        labels={scheduler.labels}
                        class={classes.weekNumber()}
                    />
                {/if}
            </div>
        </div>
    {:else}
        <div class={classes.header()} style:grid-template-columns={headerTemplate}>
            <div class={classes.gutterSpacer()}>
                {#if scheduler.weekNumbers}
                    <WeekNumber
                        week={week.week}
                        labels={scheduler.labels}
                        class={classes.weekNumber()}
                    />
                {/if}
            </div>
            {#each days as day, dayIndex (isoDate(day))}
                {@const isToday = dayIndex === todayIndex}
                {@const isAnchor = isSameDay(day, anchor)}
                {@const weekday = formatWeekday(day, scheduler.locale)}
                {@const number = formatDayNumber(day, scheduler.locale)}
                {@const holiday = holidays.get(isoDate(day))}
                <div
                    class={classes.dayHeader({ class: columnTint(day, dayIndex) })}
                    data-sch-day={isoDate(day)}
                    data-sch-anchor={isAnchor ? '' : undefined}
                    aria-current={isToday ? 'date' : undefined}
                >
                    {#if snippets.header}
                        {@render snippets.header({
                            date: day,
                            view,
                            label: `${weekday} ${number}`,
                            isToday,
                            isAnchor,
                            holiday
                        })}
                    {:else}
                        <span class={classes.weekday()}>{weekday}</span>
                        <span
                            class={classes.dayNumber({
                                class: [
                                    isAnchor && !isToday ? classes.dayNumberAnchor() : '',
                                    isToday ? classes.dayNumberToday() : ''
                                ]
                            })}
                        >
                            {number}
                        </span>
                        {#if holiday?.title}
                            <span class={classes.holidayTitle()} data-sch-holiday-title>
                                {holiday.title}
                            </span>
                        {/if}
                    {/if}
                </div>
            {/each}
        </div>
    {/if}

    {#if hasAllDay}
        <div class={classes.allDayRow()} style:grid-template-columns={bodyTemplate}>
            <div class={classes.allDayLabel()}>{scheduler.labels.allDay}</div>
            <div class={classes.allDayCells()} style:grid-template-columns={dayTemplate}>
                {#each days as day, dayIndex (isoDate(day))}
                    <div
                        class={classes.allDayCell({ class: columnTint(day, dayIndex) })}
                        style:min-height="{Math.max(laneCount, 1) * 1.625 + 0.5}rem"
                        data-sch-day-index={dayIndex}
                        data-sch-all-day
                    >
                        {#if focus && focus.minutes === null && focus.dayIndex === dayIndex}
                            <div
                                class={classes.focusRing({ class: 'inset-y-0' })}
                                data-sch-focus
                            ></div>
                        {/if}
                    </div>
                {/each}
                <div
                    class={classes.allDayEvents()}
                    style:grid-template-columns={dayTemplate}
                    style:grid-template-rows="repeat({Math.max(laneCount, 1)}, 1.375rem)"
                >
                    {#each spans as position (position.event.id + position.row)}
                        <div
                            class={classes.allDayEvent({
                                class: [
                                    draggableSpan(position.event),
                                    position.event.id === draggingId
                                        ? classes.allDayEventLifted()
                                        : ''
                                ]
                            })}
                            style:grid-column="{position.startColumn + 1} / {position.endColumn +
                                1}"
                            style:grid-row={position.lane + 1}
                            data-sch-event={position.event.id}
                            {@attach interactions.event(position)}
                        >
                            <EventPopover
                                event={position.event}
                                {scheduler}
                                enabled={detailPopover}
                                detail={snippets.detail}
                                onDelete={onDeleteEvent}
                                onSelect={onSelectEvent}
                                side="bottom"
                            >
                                {#snippet children(trigger)}
                                    <EventChip
                                        {...trigger}
                                        event={position.event}
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
                    {#each ghostSpans as position (position.event.id + position.row)}
                        <div
                            class={classes.allDayGhost()}
                            style:grid-column="{position.startColumn + 1} / {position.endColumn +
                                1}"
                            style:grid-row={position.lane + 1}
                            data-sch-ghost
                        >
                            <EventChip
                                event={position.event}
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
    {/if}

    <div class={classes.body()}>
        <ScrollArea class={classes.scroll()} dir={scheduler.direction} bind:viewportRef={viewport}>
            <div class={classes.bodyGrid()} style:grid-template-columns={bodyTemplate}>
                <div class={classes.gutter()} style:height="{scale.dayHeight}px" aria-hidden="true">
                    {#each hourLabels as label (label.hour)}
                        <span class={classes.hourLabel()} style:top="{label.top}px"
                            ><span class={classes.hourStrong()}>{label.parts.hour}</span><span
                                class={classes.hourFaint()}>{label.parts.rest}</span
                            ></span
                        >
                    {/each}
                    {#if todayIndex >= 0}
                        <span class={classes.nowLabel()} style:top="{nowTop}px">{nowLabel}</span>
                    {/if}
                </div>
                <div
                    class={classes.columns()}
                    style:grid-template-columns={dayTemplate}
                    style:height="{scale.dayHeight}px"
                    style:background-image={gridLines}
                    {@attach interactions.grid}
                >
                    {#each days as day, dayIndex (isoDate(day))}
                        <div
                            class={classes.column({ class: columnTint(day, dayIndex) })}
                            data-sch-day={isoDate(day)}
                            data-sch-day-index={dayIndex}
                        >
                            {#each offHours(day) as block (block.top)}
                                <div
                                    class={classes.offHours()}
                                    style:top="{block.top}px"
                                    style:height="{block.height}px"
                                    data-sch-off-hours
                                ></div>
                            {/each}
                            {#if snippets.cell}
                                {@render snippets.cell(cellProps(day, dayIndex))}
                            {/if}
                            {#each byDay[dayIndex].background as position (position.event.id)}
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
                                {#each byDay[dayIndex].foreground as position (position.event.id + position.dayIndex)}
                                    {@const compact = position.height < COMPACT_HEIGHT}
                                    <div
                                        class={classes.event({
                                            class: draggable(position.event)
                                        })}
                                        style:top="{position.top}px"
                                        style:height="{Math.max(
                                            position.height,
                                            scale.slotHeight / 2
                                        )}px"
                                        style:inset-inline-start="{position.left * 100}%"
                                        style:width="{position.width * 100}%"
                                        data-sch-event={position.event.id}
                                        {@attach interactions.event(position)}
                                    >
                                        {#if snippets.event}
                                            {@render snippets.event(eventProps(position))}
                                        {:else}
                                            <EventPopover
                                                event={position.event}
                                                {scheduler}
                                                enabled={detailPopover}
                                                detail={snippets.detail}
                                                onDelete={onDeleteEvent}
                                                onSelect={onSelectEvent}
                                                side={single ? 'bottom' : 'right'}
                                            >
                                                {#snippet children(trigger)}
                                                    <EventChip
                                                        {...trigger}
                                                        event={position.event}
                                                        {position}
                                                        locale={scheduler.locale}
                                                        hour12={scheduler.hour12}
                                                        size={compact ? 'sm' : 'md'}
                                                        showTime={!compact}
                                                        selected={selectedEventId ===
                                                            position.event.id}
                                                        dragging={draggingId === position.event.id}
                                                        class="h-full"
                                                    />
                                                {/snippet}
                                            </EventPopover>
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                            {#if focusTop !== null && focus?.dayIndex === dayIndex}
                                <div
                                    class={classes.focusRing()}
                                    style:top="{focusTop}px"
                                    style:height="{scale.slotHeight}px"
                                    data-sch-focus
                                ></div>
                            {/if}
                            {#if dayIndex === todayIndex}
                                <div class={classes.nowLine()} style:top="{nowTop}px" data-sch-now>
                                    <span class={classes.nowDot()}></span>
                                    <span class={classes.nowRule()}></span>
                                </div>
                            {/if}
                        </div>
                    {/each}
                    {#each ghostTimed as position, index (`${position.event.id}:${index}`)}
                        <div
                            class={classes.ghost()}
                            style:top="{position.top}px"
                            style:height="{Math.max(position.height, scale.slotHeight / 2)}px"
                            style:inset-inline-start={columnOffset(position)}
                            style:width={columnWidth(position)}
                            data-sch-ghost
                        >
                            <EventChip
                                event={position.event}
                                {position}
                                locale={scheduler.locale}
                                hour12={scheduler.hour12}
                                size={position.height < COMPACT_HEIGHT ? 'sm' : 'md'}
                                showTime={position.height >= COMPACT_HEIGHT}
                                class={classes.ghostChip({ class: 'h-full' })}
                            />
                        </div>
                    {/each}
                    {#if isEmpty}
                        <div class={classes.empty()} style:top="{emptyTop}px" data-sch-empty>
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
