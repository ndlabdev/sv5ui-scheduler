<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Popover } from 'sv5ui'
    import type { SpanPosition, ViewProps } from '../../types/extension.types.js'
    import { countByCell, overflowByCell } from '../../core/layout/spans.js'
    import {
        formatDayNumber,
        formatLongDate,
        formatPopoverDay,
        formatWeekdayLong
    } from '../../core/time/format.js'
    import { eachDay } from '../../core/time/range.js'
    import { weekDayOf } from '../../core/time/week.js'
    import { isSameDay } from '../../core/time/zone.js'
    import EventChip from '../EventChip/EventChip.svelte'
    import EventPopover from './EventPopover.svelte'
    import { monthGridVariants } from './month-grid.variants.js'

    const COLUMNS = 7
    const LANE_HEIGHT = 24
    const HEADER_HEIGHT = 30

    let {
        view,
        anchor,
        range,
        scheduler,
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

    const classes = monthGridVariants()
    const days = $derived(eachDay(range))
    const rows = $derived(Array.from({ length: Math.ceil(days.length / COLUMNS) }, (_, row) => row))
    const columnTemplate = `repeat(${COLUMNS}, minmax(0, 1fr))`

    let bodyHeight = $state(0)
    const cellHeight = $derived(bodyHeight > 0 ? bodyHeight / rows.length : 120)
    const maxLanes = $derived(
        Math.max(Math.floor((cellHeight - HEADER_HEIGHT - 4) / LANE_HEIGHT), 1)
    )

    const spans = $derived(positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'))
    const visible = $derived(spans.filter((span) => span.lane < maxLanes))
    const overflow = $derived(overflowByCell(spans, maxLanes, COLUMNS))
    const counts = $derived(countByCell(spans, COLUMNS))
    const ghosts = $derived(
        (preview?.positioned ?? []).filter((p): p is SpanPosition<T> => p.kind === 'span')
    )
    const draggingId = $derived(preview?.kind === 'create' ? null : (preview?.event.id ?? null))
    const todayWeekDay = $derived(weekDayOf(scheduler.now))
    const showTodayColumn = $derived(days.some((day) => isSameDay(day, scheduler.now)))
    const holidays = $derived(new Set(scheduler.holidays.map((h) => h.date)))

    const isoDate = (day: ZonedDateTime) => day.toString().slice(0, 10)
    const isWeekend = (day: ZonedDateTime) => weekDayOf(day) === 0 || weekDayOf(day) === 6
    const isOutside = (day: ZonedDateTime) => day.month !== anchor.month
    const isToday = (day: ZonedDateTime) => isSameDay(day, scheduler.now)

    function spansOn(dayIndex: number) {
        const row = Math.floor(dayIndex / COLUMNS)
        const column = dayIndex % COLUMNS
        return spans
            .filter(
                (span) => span.row === row && span.startColumn <= column && span.endColumn > column
            )
            .sort((a, b) => a.lane - b.lane)
    }

    function cellProps(day: ZonedDateTime) {
        return {
            date: day,
            view,
            isToday: isToday(day),
            isWeekend: isWeekend(day),
            isHoliday: holidays.has(isoDate(day)),
            isBusinessHours: scheduler.businessHours
                ? scheduler.businessHours.days.includes(weekDayOf(day))
                : !isWeekend(day),
            isOutside: isOutside(day)
        }
    }
</script>

<div class={classes.root()} data-sch-month-grid>
    <div class={classes.header()} style:grid-template-columns={columnTemplate}>
        {#each days.slice(0, COLUMNS) as day (isoDate(day))}
            <div class={classes.weekday()}>{formatWeekdayLong(day, scheduler.locale)}</div>
        {/each}
    </div>

    <div
        class={classes.body()}
        style:grid-template-rows="repeat({rows.length}, minmax(0, 1fr))"
        bind:clientHeight={bodyHeight}
        {@attach interactions.grid}
    >
        {#each rows as row (row)}
            <div class={classes.row()}>
                <div class={classes.cells()} style:grid-template-columns={columnTemplate}>
                    {#each days.slice(row * COLUMNS, row * COLUMNS + COLUMNS) as day, column (isoDate(day))}
                        {@const dayIndex = row * COLUMNS + column}
                        {@const more = overflow.get(dayIndex) ?? 0}
                        <div
                            class={classes.cell({
                                class: [
                                    showTodayColumn && weekDayOf(day) === todayWeekDay
                                        ? classes.cellTodayColumn()
                                        : '',
                                    focus?.dayIndex === dayIndex ? classes.cellFocus() : ''
                                ]
                            })}
                            data-sch-day={isoDate(day)}
                            data-sch-day-index={dayIndex}
                            data-sch-all-day
                            data-sch-focus={focus?.dayIndex === dayIndex ? '' : undefined}
                            role="group"
                            aria-label={scheduler.labels.dayCell(
                                formatLongDate(day, scheduler.locale),
                                counts.get(dayIndex) ?? 0
                            )}
                        >
                            <div class={classes.cellHeader()}>
                                <span
                                    class={classes.dayNumber({
                                        class: [
                                            isOutside(day) ? classes.dayNumberOutside() : '',
                                            isToday(day) ? classes.dayNumberToday() : ''
                                        ]
                                    })}
                                    aria-current={isToday(day) ? 'date' : undefined}
                                >
                                    {formatDayNumber(day, scheduler.locale)}
                                </span>
                                {#if more > 0}
                                    <Popover
                                        side="bottom"
                                        align="end"
                                        class={classes.moreTrigger()}
                                        ui={{ content: classes.popover() }}
                                    >
                                        <button
                                            type="button"
                                            class={classes.more()}
                                            data-sch-more={isoDate(day)}
                                            aria-label={scheduler.labels.more(more)}
                                        >
                                            +{more}
                                        </button>
                                        {#snippet content()}
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
                                    </Popover>
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
                            class={classes.event()}
                            style:grid-column="{span.startColumn + 1} / {span.endColumn + 1}"
                            style:grid-row={span.lane + 1}
                            data-sch-event={span.event.id}
                            {@attach interactions.event(span)}
                        >
                            {#if snippets.event}
                                {@render snippets.event({
                                    event: span.event,
                                    position: span,
                                    view,
                                    isDragging: draggingId === span.event.id,
                                    isResizing: false,
                                    isSelected: selectedEventId === span.event.id
                                })}
                            {:else}
                                <EventPopover
                                    event={span.event}
                                    {scheduler}
                                    enabled={detailPopover}
                                    detail={snippets.detail}
                                    onDelete={onDeleteEvent}
                                >
                                    <EventChip
                                        event={span.event}
                                        position={span}
                                        variant="solid"
                                        size="sm"
                                        locale={scheduler.locale}
                                        hour12={scheduler.hour12}
                                        selected={selectedEventId === span.event.id}
                                        dragging={draggingId === span.event.id}
                                        onclick={() => onSelectEvent(span.event.id)}
                                    />
                                </EventPopover>
                            {/if}
                        </div>
                    {/each}
                    {#each ghosts.filter((span) => span.row === row) as span (span.event.id)}
                        <div
                            class={classes.ghost()}
                            style:grid-column="{span.startColumn + 1} / {span.endColumn + 1}"
                            style:grid-row={Math.min(span.lane, maxLanes - 1) + 1}
                            data-sch-ghost
                        >
                            <EventChip
                                event={span.event}
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
        {/each}
    </div>
</div>
