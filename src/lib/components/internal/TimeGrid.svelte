<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import type { SpanPosition, TimePosition, ViewProps } from '../../types/extension.types.js'
    import { eachDay } from '../../core/time/range.js'
    import { formatDayNumber, formatHour, formatWeekday } from '../../core/time/format.js'
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
        selectedEventId,
        onSelectEvent
    }: ViewProps<T> = $props()

    const classes = timeGridVariants()
    const days = $derived(eachDay(range))
    const headerTemplate = $derived(`4rem repeat(${days.length}, minmax(0, 1fr))`)
    const bodyTemplate = '4rem minmax(0, 1fr)'
    const dayTemplate = $derived(`repeat(${days.length}, minmax(0, 1fr))`)

    const spans = $derived(positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'))
    const laneCount = $derived(spans.reduce((max, p) => Math.max(max, p.lane + 1), 0))
    const timed = $derived(positioned.filter((p): p is TimePosition<T> => p.kind === 'time'))
    const byDay = $derived(days.map((_, dayIndex) => timed.filter((p) => p.dayIndex === dayIndex)))

    const todayIndex = $derived(days.findIndex((day) => isSameDay(day, scheduler.now)))
    const nowTop = $derived(scale.toPixel(scheduler.now))

    const holidays = $derived(new Set(scheduler.holidays.map((h) => h.date)))
    const isoDate = (day: ZonedDateTime) => day.toString().slice(0, 10)

    function offHours(day: ZonedDateTime): { top: number; height: number }[] {
        const hours = scheduler.businessHours
        if (!hours) return []
        if (!hours.days.includes(weekDayOf(day))) return [{ top: 0, height: scale.dayHeight }]
        const open = scale.toPixel(day.set(parseClock(hours.start)))
        const close = scale.toPixel(day.set(parseClock(hours.end)))
        return [
            { top: 0, height: open },
            { top: close, height: scale.dayHeight - close }
        ].filter((block) => block.height > 0)
    }

    function parseClock(value: string): { hour: number; minute: number } {
        const [hour, minute] = value.split(':').map(Number)
        return { hour, minute }
    }

    function cellProps(day: ZonedDateTime, dayIndex: number) {
        const weekDay = weekDayOf(day)
        return {
            date: day,
            view,
            isToday: dayIndex === todayIndex,
            isWeekend: weekDay === 0 || weekDay === 6,
            isHoliday: holidays.has(isoDate(day)),
            isBusinessHours: scheduler.businessHours?.days.includes(weekDay) ?? true,
            isOutside: false
        }
    }
</script>

<div class={classes.root()} data-sch-time-grid>
    <div class={classes.header()} style:grid-template-columns={headerTemplate}>
        <div class={classes.gutterSpacer()}></div>
        {#each days as day, dayIndex (isoDate(day))}
            {@const isToday = dayIndex === todayIndex}
            {@const label = `${formatWeekday(day, scheduler.locale)} ${formatDayNumber(day, scheduler.locale)}`}
            <div
                class={classes.dayHeader({ class: isToday ? classes.dayHeaderToday() : '' })}
                data-sch-day={isoDate(day)}
                aria-current={isToday ? 'date' : undefined}
            >
                {#if snippets.header}
                    {@render snippets.header({ date: day, view, label, isToday })}
                {:else}
                    <span>{formatWeekday(day, scheduler.locale)}</span>
                    <span
                        class={classes.dayNumber({
                            class: isToday ? classes.dayNumberToday() : ''
                        })}
                    >
                        {formatDayNumber(day, scheduler.locale)}
                    </span>
                {/if}
            </div>
        {/each}
    </div>

    <div class={classes.allDayRow()} style:grid-template-columns={bodyTemplate}>
        <div class={classes.allDayLabel()}>{scheduler.labels.allDay}</div>
        <div class={classes.allDayCells()} style:grid-template-columns={dayTemplate}>
            {#each days as day (isoDate(day))}
                <div
                    class={classes.allDayCell()}
                    style:min-height="{Math.max(laneCount, 1) * 1.5}rem"
                ></div>
            {/each}
            <div
                class={classes.allDayEvents()}
                style:grid-template-columns={dayTemplate}
                style:grid-template-rows="repeat({Math.max(laneCount, 1)}, 1.25rem)"
            >
                {#each spans as position (position.event.id + position.row)}
                    <div
                        class={classes.allDayEvent()}
                        style:grid-column="{position.startColumn + 1} / {position.endColumn + 1}"
                        style:grid-row={position.lane + 1}
                        {@attach interactions.event(position)}
                    >
                        <EventChip
                            event={position.event}
                            {position}
                            size="sm"
                            locale={scheduler.locale}
                            selected={selectedEventId === position.event.id}
                            onclick={() => onSelectEvent(position.event.id)}
                        />
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <div class={classes.body()}>
        <div class={classes.bodyGrid()} style:grid-template-columns={bodyTemplate}>
            <div class={classes.gutter()} style:height="{scale.dayHeight}px" aria-hidden="true">
                {#each Array.from({ length: 23 }, (_, i) => i + 1) as hour (hour)}
                    {@const date = days[0].set({ hour, minute: 0 })}
                    <span class={classes.hourLabel()} style:top="{scale.toPixel(date)}px">
                        {formatHour(date, scheduler.locale)}
                    </span>
                {/each}
            </div>
            <div
                class={classes.columns()}
                style:grid-template-columns={dayTemplate}
                style:height="{scale.dayHeight}px"
                style:background-image="repeating-linear-gradient(to bottom,
                var(--color-outline-variant) 0 1px, transparent 1px {scale.slotHeight *
                    (60 / scale.slotMinutes)}px)"
                {@attach interactions.grid}
            >
                {#each days as day, dayIndex (isoDate(day))}
                    <div
                        class={classes.column({
                            class: dayIndex === todayIndex ? classes.columnToday() : ''
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
                        {#each byDay[dayIndex].filter((p) => p.event.background) as position (position.event.id)}
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
                            {#each byDay[dayIndex].filter((p) => !p.event.background) as position (position.event.id + position.dayIndex)}
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
                                    {@attach interactions.event(position)}
                                >
                                    {#if snippets.event}
                                        {@render snippets.event({
                                            event: position.event,
                                            position,
                                            view,
                                            isDragging: false,
                                            isResizing: false,
                                            isSelected: selectedEventId === position.event.id
                                        })}
                                    {:else}
                                        <EventChip
                                            event={position.event}
                                            {position}
                                            locale={scheduler.locale}
                                            size={compact ? 'sm' : 'md'}
                                            showTime={!compact}
                                            selected={selectedEventId === position.event.id}
                                            class="h-full"
                                            onclick={() => onSelectEvent(position.event.id)}
                                        />
                                    {/if}
                                </div>
                            {/each}
                        </div>
                        {#if dayIndex === todayIndex}
                            <div class={classes.nowLine()} style:top="{nowTop}px" data-sch-now>
                                <span class={classes.nowDot()}></span>
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    </div>
</div>
