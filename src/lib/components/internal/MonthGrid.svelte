<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Popover } from 'sv5ui'
    import type { SpanPosition, ViewProps } from '../../types/extension.types.js'
    import { countByCell, overflowByCell } from '../../core/layout/spans.js'
    import { formatDayNumber, formatLongDate, formatWeekday } from '../../core/time/format.js'
    import { eachDay } from '../../core/time/range.js'
    import { weekDayOf } from '../../core/time/week.js'
    import { isSameDay } from '../../core/time/zone.js'
    import EventChip from '../EventChip/EventChip.svelte'
    import { monthGridVariants } from './month-grid.variants.js'

    const COLUMNS = 7
    const LANE_HEIGHT = 22
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
        onSelectEvent
    }: ViewProps<T> = $props()

    const classes = monthGridVariants()
    const days = $derived(eachDay(range))
    const rows = $derived(Math.ceil(days.length / COLUMNS))
    const columnTemplate = `repeat(${COLUMNS}, minmax(0, 1fr))`
    const spans = $derived(positioned.filter((p): p is SpanPosition<T> => p.kind === 'span'))
    let bodyHeight = $state(0)
    const cellHeight = $derived(bodyHeight > 0 ? bodyHeight / rows : 120)
    const maxLanes = $derived(
        Math.max(Math.floor((cellHeight - HEADER_HEIGHT - LANE_HEIGHT) / LANE_HEIGHT), 1)
    )
    const visible = $derived(spans.filter((span) => span.lane < maxLanes))
    const overflow = $derived(overflowByCell(spans, maxLanes, COLUMNS))
    const hidden = $derived(spans.filter((span) => span.lane >= maxLanes))
    const ghosts = $derived(
        (preview?.positioned ?? []).filter((p): p is SpanPosition<T> => p.kind === 'span')
    )
    const draggingId = $derived(preview?.kind === 'create' ? null : (preview?.event.id ?? null))

    const holidays = $derived(new Set(scheduler.holidays.map((h) => h.date)))
    const isoDate = (day: ZonedDateTime) => day.toString().slice(0, 10)
    const isWeekend = (day: ZonedDateTime) => weekDayOf(day) === 0 || weekDayOf(day) === 6
    const isOutside = (day: ZonedDateTime) => day.month !== anchor.month
    const isToday = (day: ZonedDateTime) => isSameDay(day, scheduler.now)

    const counts = $derived(countByCell(spans, COLUMNS))

    function hiddenOn(dayIndex: number) {
        const row = Math.floor(dayIndex / COLUMNS)
        const column = dayIndex % COLUMNS
        return hidden.filter(
            (span) => span.row === row && span.startColumn <= column && span.endColumn > column
        )
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
            <div class={classes.weekday({ class: isWeekend(day) ? classes.weekdayWeekend() : '' })}>
                {formatWeekday(day, scheduler.locale)}
            </div>
        {/each}
    </div>

    <div
        class={classes.body()}
        style:grid-template-rows="repeat({rows}, minmax(0, 1fr))"
        bind:clientHeight={bodyHeight}
        {@attach interactions.grid}
    >
        {#each Array.from({ length: rows }, (_, row) => row) as row (row)}
            <div class={classes.row()}>
                <div class={classes.cells()} style:grid-template-columns={columnTemplate}>
                    {#each days.slice(row * COLUMNS, row * COLUMNS + COLUMNS) as day, column (isoDate(day))}
                        {@const dayIndex = row * COLUMNS + column}
                        {@const count = counts.get(dayIndex) ?? 0}
                        <div
                            class={classes.cell({
                                class: [
                                    isWeekend(day) ? classes.cellWeekend() : '',
                                    isOutside(day) ? classes.cellOutside() : '',
                                    isToday(day) ? classes.cellToday() : '',
                                    focus?.dayIndex === dayIndex ? classes.cellFocus() : ''
                                ]
                            })}
                            data-sch-focus={focus?.dayIndex === dayIndex ? '' : undefined}
                            data-sch-day={isoDate(day)}
                            data-sch-day-index={dayIndex}
                            data-sch-all-day
                            aria-label={scheduler.labels.dayCell(
                                formatLongDate(day, scheduler.locale),
                                count
                            )}
                        >
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
                                    isDragging: false,
                                    isResizing: false,
                                    isSelected: selectedEventId === span.event.id
                                })}
                            {:else}
                                <EventChip
                                    event={span.event}
                                    position={span}
                                    size="sm"
                                    class="h-full"
                                    locale={scheduler.locale}
                                    selected={selectedEventId === span.event.id}
                                    dragging={draggingId === span.event.id}
                                    onclick={() => onSelectEvent(span.event.id)}
                                />
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
                                size="sm"
                                class={classes.ghostChip({ class: 'h-full' })}
                                locale={scheduler.locale}
                            />
                        </div>
                    {/each}
                </div>

                <div
                    class={classes.moreRow()}
                    style:grid-template-columns={columnTemplate}
                    style:top="{HEADER_HEIGHT + maxLanes * LANE_HEIGHT}px"
                >
                    {#each Array.from({ length: COLUMNS }, (_, column) => column) as column (column)}
                        {@const dayIndex = row * COLUMNS + column}
                        {@const count = overflow.get(dayIndex) ?? 0}
                        {#if count > 0}
                            {@const day = days[dayIndex]}
                            <div class={classes.moreCell()} style:grid-column={column + 1}>
                                <Popover ui={{ content: 'p-2' }} class={classes.moreTrigger()}>
                                    <span class={classes.more()} data-sch-more={isoDate(day)}>
                                        {scheduler.labels.more(count)}
                                    </span>
                                    {#snippet content()}
                                        <div class={classes.popover()}>
                                            <p class={classes.popoverTitle()}>
                                                {formatLongDate(day, scheduler.locale)}
                                            </p>
                                            {#each hiddenOn(dayIndex) as span (span.event.id)}
                                                <EventChip
                                                    event={span.event}
                                                    size="sm"
                                                    locale={scheduler.locale}
                                                    selected={selectedEventId === span.event.id}
                                                    onclick={() => onSelectEvent(span.event.id)}
                                                />
                                            {/each}
                                        </div>
                                    {/snippet}
                                </Popover>
                            </div>
                        {/if}
                    {/each}
                </div>
            </div>
        {/each}
    </div>
</div>
