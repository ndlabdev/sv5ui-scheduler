<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Badge, ScrollArea } from 'sv5ui'
    import { untrack } from 'svelte'
    import type { SpanPosition, TimePosition, ViewProps } from '../../types/extension.types.js'
    import { eachDay } from '../../core/time/range.js'
    import {
        formatDayNumber,
        formatHour,
        formatDate,
        formatWeekdayLong,
        formatTime,
        formatWeekday
    } from '../../core/time/format.js'
    import { weekDayOf } from '../../core/time/week.js'
    import { isSameDay } from '../../core/time/zone.js'
    import EventChip from '../EventChip/EventChip.svelte'
    import { timeGridVariants } from './time-grid.variants.js'

    let {
        view,
        range,
        scheduler,
        scale,
        positioned,
        snippets,
        interactions,
        preview,
        focus,
        selectedEventId,
        onSelectEvent
    }: ViewProps<T> = $props()

    const classes = timeGridVariants()
    const days = $derived(eachDay(range))
    const headerTemplate = $derived(`4rem repeat(${days.length}, minmax(0, 1fr))`)
    const bodyTemplate = '4rem minmax(0, 1fr)'
    const dayTemplate = $derived(`repeat(${days.length}, minmax(0, 1fr))`)
    const hourHeight = $derived(scale.slotHeight * (60 / scale.slotMinutes))
    const gridLines = $derived(
        `repeating-linear-gradient(to bottom, var(--color-outline-variant) 0 1px, transparent 1px ${hourHeight}px)`
    )

    const spans = $derived(positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'))
    const laneCount = $derived(spans.reduce((max, p) => Math.max(max, p.lane + 1), 0))
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
    const ghostSpans = $derived(
        (preview?.positioned ?? []).filter((p): p is SpanPosition<T> => p.kind === 'span')
    )
    const draggingId = $derived(preview?.kind === 'create' ? null : (preview?.event.id ?? null))
    const focusTop = $derived(
        focus && focus.minutes !== null
            ? (focus.minutes / scale.slotMinutes) * scale.slotHeight
            : null
    )

    const todayIndex = $derived(days.findIndex((day) => isSameDay(day, scheduler.now)))
    const nowTop = $derived(scale.toPixel(scheduler.now))
    const holidays = $derived(new Set(scheduler.holidays.map((h) => h.date)))
    const hours = Array.from({ length: 23 }, (_, i) => i + 1)
    const single = $derived(days.length === 1)
    const hasAllDay = $derived(spans.length > 0 || ghostSpans.length > 0)
    const isEmpty = $derived(positioned.length === 0)

    let viewport = $state<HTMLDivElement | null>(null)

    $effect(() => {
        const node = viewport
        if (!node) return
        untrack(() => {
            const first = scheduler.businessHours
                ? parseClock(scheduler.businessHours.start)
                : { hour: 8, minute: 0 }
            node.scrollTop = Math.max(scale.toPixel(days[0].set(first)) - hourHeight / 2, 0)
        })
    })

    const isoDate = (day: ZonedDateTime) => day.toString().slice(0, 10)
    const isWeekend = (day: ZonedDateTime) => {
        const weekDay = weekDayOf(day)
        return weekDay === 0 || weekDay === 6
    }

    function offHours(day: ZonedDateTime): { top: number; height: number }[] {
        const hours = scheduler.businessHours
        if (!hours) return []
        if (!hours.days.includes(weekDayOf(day))) return []
        const open = scale.toPixel(day.set(parseClock(hours.start)))
        const close = scale.toPixel(day.set(parseClock(hours.end)))
        return [
            { top: 0, height: open },
            { top: close, height: scale.dayHeight - close }
        ].filter((block) => block.height > 0)
    }

    function isClosedDay(day: ZonedDateTime): boolean {
        const hours = scheduler.businessHours
        return hours ? !hours.days.includes(weekDayOf(day)) : isWeekend(day)
    }

    function parseClock(value: string): { hour: number; minute: number } {
        const [hour, minute] = value.split(':').map(Number)
        return { hour, minute }
    }

    function cellProps(day: ZonedDateTime, dayIndex: number) {
        return {
            date: day,
            view,
            isToday: dayIndex === todayIndex,
            isWeekend: isWeekend(day),
            isHoliday: holidays.has(isoDate(day)),
            isBusinessHours: !isClosedDay(day),
            isOutside: false
        }
    }

    function eventProps(position: TimePosition<T>) {
        return {
            event: position.event,
            position,
            view,
            isDragging: false,
            isResizing: false,
            isSelected: selectedEventId === position.event.id
        }
    }
</script>

<div class={classes.root()} data-sch-time-grid>
    {#if single}
        <div class={classes.dayTitle()} data-sch-day-title>
            <span class={classes.dayTitleWeekday()}>
                {formatWeekdayLong(days[0], scheduler.locale)}
            </span>
            <div class={classes.dayTitleRow()}>
                <h3 class={classes.dayTitleDate()}>
                    {formatDate(days[0], scheduler.locale)}
                </h3>
                {#if todayIndex === 0}
                    <Badge
                        color="primary"
                        variant="soft"
                        size="sm"
                        label={scheduler.labels.today}
                    />
                {/if}
            </div>
        </div>
    {/if}
    <div
        class={classes.header()}
        style:grid-template-columns={headerTemplate}
        class:hidden={single}
    >
        <div class={classes.gutterSpacer()}></div>
        {#each days as day, dayIndex (isoDate(day))}
            {@const isToday = dayIndex === todayIndex}
            {@const weekday = formatWeekday(day, scheduler.locale)}
            {@const number = formatDayNumber(day, scheduler.locale)}
            <div
                class={classes.dayHeader({
                    class: [
                        isClosedDay(day) ? classes.dayHeaderWeekend() : '',
                        isToday && !single ? classes.dayHeaderTodayColumn() : '',
                        isToday ? classes.dayHeaderToday() : ''
                    ]
                })}
                data-sch-day={isoDate(day)}
                aria-current={isToday ? 'date' : undefined}
            >
                {#if snippets.header}
                    {@render snippets.header({
                        date: day,
                        view,
                        label: `${weekday} ${number}`,
                        isToday
                    })}
                {:else}
                    <span class={classes.weekday()}>{weekday}</span>
                    <span
                        class={classes.dayNumber({
                            class: isToday ? classes.dayNumberToday() : ''
                        })}
                    >
                        {number}
                    </span>
                {/if}
            </div>
        {/each}
    </div>

    {#if hasAllDay}
        <div class={classes.allDayRow()} style:grid-template-columns={bodyTemplate}>
            <div class={classes.allDayLabel()}>{scheduler.labels.allDay}</div>
            <div class={classes.allDayCells()} style:grid-template-columns={dayTemplate}>
                {#each days as day, dayIndex (isoDate(day))}
                    <div
                        class={classes.allDayCell({
                            class: isClosedDay(day) ? classes.allDayCellWeekend() : ''
                        })}
                        style:min-height="{Math.max(laneCount, 1) * 1.5 + 0.5}rem"
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
                            class={classes.allDayEvent()}
                            style:grid-column="{position.startColumn + 1} / {position.endColumn +
                                1}"
                            style:grid-row={position.lane + 1}
                            data-sch-event={position.event.id}
                            {@attach interactions.event(position)}
                        >
                            <EventChip
                                event={position.event}
                                {position}
                                size="sm"
                                class="h-full"
                                locale={scheduler.locale}
                                hour12={scheduler.hour12}
                                selected={selectedEventId === position.event.id}
                                dragging={draggingId === position.event.id}
                                onclick={() => onSelectEvent(position.event.id)}
                            />
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
        <ScrollArea class={classes.scroll()} bind:viewportRef={viewport}>
            <div class={classes.bodyGrid()} style:grid-template-columns={bodyTemplate}>
                <div class={classes.gutter()} style:height="{scale.dayHeight}px" aria-hidden="true">
                    {#if todayIndex >= 0}
                        <span class={classes.nowLabel()} style:top="{nowTop}px">
                            {formatTime(scheduler.now, scheduler.locale, scheduler.hour12)}
                        </span>
                    {/if}
                    {#each hours as hour (hour)}
                        {@const date = days[0].set({ hour, minute: 0 })}
                        <span class={classes.hourLabel()} style:top="{scale.toPixel(date)}px">
                            {formatHour(date, scheduler.locale, scheduler.hour12)}
                        </span>
                    {/each}
                </div>
                <div
                    class={classes.columns({ class: classes.gridFocus() })}
                    style:grid-template-columns={dayTemplate}
                    style:height="{scale.dayHeight}px"
                    style:background-image={gridLines}
                    {@attach interactions.grid}
                >
                    {#each days as day, dayIndex (isoDate(day))}
                        <div
                            class={classes.column({
                                class: [
                                    isClosedDay(day) ? classes.columnWeekend() : '',
                                    dayIndex === todayIndex && !single ? classes.columnToday() : ''
                                ]
                            })}
                            data-sch-day={isoDate(day)}
                            data-sch-day-index={dayIndex}
                        >
                            {#each offHours(day) as block (block.top)}
                                <div
                                    class={classes.offHours()}
                                    style:top="{block.top}px"
                                    style:height="{block.height}px"
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
                                    {@const compact = position.height < scale.slotHeight * 1.5}
                                    <div
                                        class={classes.event()}
                                        style:top="{position.top}px"
                                        style:height="{Math.max(
                                            position.height,
                                            scale.slotHeight / 2
                                        )}px"
                                        style:left="{position.left * 100}%"
                                        style:width="{position.width * 100}%"
                                        data-sch-event={position.event.id}
                                        {@attach interactions.event(position)}
                                    >
                                        {#if snippets.event}
                                            {@render snippets.event(eventProps(position))}
                                        {:else}
                                            <EventChip
                                                event={position.event}
                                                {position}
                                                locale={scheduler.locale}
                                                hour12={scheduler.hour12}
                                                size={compact ? 'sm' : 'md'}
                                                showTime={!compact}
                                                selected={selectedEventId === position.event.id}
                                                dragging={draggingId === position.event.id}
                                                class="h-full"
                                                onclick={() => onSelectEvent(position.event.id)}
                                            />
                                        {/if}
                                    </div>
                                {/each}
                            </div>
                            {#each ghostTimed.filter((p) => p.dayIndex === dayIndex) as position (position.event.id)}
                                <div
                                    class={classes.ghost()}
                                    style:top="{position.top}px"
                                    style:height="{Math.max(
                                        position.height,
                                        scale.slotHeight / 2
                                    )}px"
                                    style:left="{position.left * 100}%"
                                    style:width="{position.width * 100}%"
                                    data-sch-ghost
                                >
                                    <EventChip
                                        event={position.event}
                                        {position}
                                        locale={scheduler.locale}
                                        hour12={scheduler.hour12}
                                        size={position.height < scale.slotHeight * 1.5
                                            ? 'sm'
                                            : 'md'}
                                        showTime={position.height >= scale.slotHeight * 1.5}
                                        class={classes.ghostChip({ class: 'h-full' })}
                                    />
                                </div>
                            {/each}
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
                                </div>
                            {/if}
                        </div>
                    {/each}
                    {#if isEmpty}
                        <div class={classes.empty()} data-sch-empty>
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
