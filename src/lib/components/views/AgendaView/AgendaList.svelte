<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Badge, Empty, ScrollArea } from 'sv5ui'
    import type { SchedulerEvent } from '../../../types/event.types.js'
    import type { ViewProps } from '../../../types/view.types.js'
    import { isWholeDay } from '../../../core/layout/segments.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { formatAgendaDay, formatTime } from '../../../core/time/format.js'
    import { eachDay, intersect } from '../../../core/time/range.js'
    import { holidaysByDate, isoDate } from '../../../core/time/day-flags.js'
    import { isSameDay, minutesBetween } from '../../../core/time/zone.js'
    import { EVENT_SWATCH } from '../../event/EventChip/event-chip.variants.js'
    import EventPopover from '../../event/EventPopover/EventPopover.svelte'
    import { agendaListVariants } from './agenda-list.variants.js'

    const MINUTES_PER_HOUR = 60

    let {
        view,
        range,
        events,
        scheduler,
        snippets,
        selectedEventId,
        onSelectEvent,
        detailPopover,
        onDeleteEvent
    }: ViewProps<T> = $props()

    const classes = agendaListVariants()
    const holidays = $derived(holidaysByDate(scheduler.holidays))

    interface Group {
        readonly key: string
        readonly day: ZonedDateTime
        readonly events: SchedulerEvent<T>[]
        readonly minutes: number
    }

    const groups = $derived.by((): Group[] =>
        eachDay(range)
            .map((day) => {
                const dayRange = { start: day, end: day.add({ days: 1 }) }
                const onDay = events.filter((event) => intersect(event, dayRange) !== null)
                return {
                    key: isoDate(day),
                    day,
                    events: onDay,
                    minutes: onDay.reduce(
                        (total, event) => total + bookedMinutes(event, dayRange),
                        0
                    )
                }
            })
            .filter((group) => group.events.length > 0)
    )

    function bookedMinutes(
        event: SchedulerEvent<T>,
        dayRange: { start: ZonedDateTime; end: ZonedDateTime }
    ): number {
        if (isWholeDay(event)) return 0
        const visible = intersect(event, dayRange)
        if (!visible) return 0
        return minutesBetween(visible.start, visible.end)
    }

    function meta(group: Group): string {
        const count = scheduler.labels.eventCount(group.events.length)
        if (group.minutes === 0) return count
        const hours = Math.floor(group.minutes / MINUTES_PER_HOUR)
        const minutes = Math.round(group.minutes % MINUTES_PER_HOUR)
        return `${count} · ${scheduler.labels.duration(hours, minutes)}`
    }
</script>

<div class={classes.root()} data-sch-agenda>
    {#if groups.length === 0}
        <div class={classes.empty()}>
            {#if snippets.empty}
                {@render snippets.empty()}
            {:else}
                <Empty icon="lucide:calendar-x" title={scheduler.labels.noEvents} />
            {/if}
        </div>
    {:else}
        <ScrollArea class={classes.scroll()} dir={scheduler.direction}>
            <ul class={classes.list()}>
                {#each groups as group (group.key)}
                    {@const holiday = holidays.get(group.key)}
                    <li data-sch-day={group.key}>
                        <div class={classes.groupHeader()}>
                            <h3 class={classes.groupDate()}>
                                {formatAgendaDay(group.day, scheduler.locale)}
                            </h3>
                            {#if isSameDay(group.day, scheduler.now)}
                                <Badge
                                    color="primary"
                                    size="sm"
                                    label={scheduler.labels.today}
                                    class={classes.todayBadge()}
                                />
                            {/if}
                            {#if holiday?.title}
                                <span class={classes.groupHoliday()} data-sch-holiday-title>
                                    {holiday.title}
                                </span>
                            {/if}
                            <span class={classes.groupMeta()}>{meta(group)}</span>
                        </div>
                        <ul class={classes.rows()}>
                            {#each group.events as event (event.id)}
                                <li>
                                    <EventPopover
                                        {event}
                                        {scheduler}
                                        enabled={detailPopover}
                                        detail={snippets.detail}
                                        onDelete={onDeleteEvent}
                                        onSelect={onSelectEvent}
                                        side="bottom"
                                    >
                                        {#snippet children(trigger)}
                                            <button
                                                {...trigger}
                                                type="button"
                                                class={classes.row({
                                                    class:
                                                        selectedEventId === event.id
                                                            ? classes.rowSelected()
                                                            : ''
                                                })}
                                                data-sch-event-id={event.id}
                                                aria-pressed={selectedEventId === event.id}
                                            >
                                                <span class={classes.time()}>
                                                    {#if isWholeDay(event)}
                                                        <span class={classes.start()}
                                                            >{scheduler.labels.allDay}</span
                                                        >
                                                    {:else}
                                                        <span class={classes.start()}>
                                                            {formatTime(
                                                                event.start,
                                                                scheduler.locale,
                                                                scheduler.hour12
                                                            )}
                                                        </span>
                                                        <span class={classes.end()}>
                                                            <span
                                                                class={classes.arrow()}
                                                                aria-hidden="true">&rarr;</span
                                                            >
                                                            {formatTime(
                                                                event.end,
                                                                scheduler.locale,
                                                                scheduler.hour12
                                                            )}
                                                        </span>
                                                    {/if}
                                                </span>
                                                <span
                                                    class={classes.bar({
                                                        class: EVENT_SWATCH[
                                                            eventColor(event, scheduler.calendars)
                                                        ]
                                                    })}
                                                ></span>
                                                <span class={classes.body()}>
                                                    {#if snippets.event}
                                                        {@render snippets.event({
                                                            event,
                                                            view,
                                                            isDragging: false,
                                                            isResizing: false,
                                                            isSelected: selectedEventId === event.id
                                                        })}
                                                    {:else}
                                                        <span class={classes.title()}
                                                            >{event.title}</span
                                                        >
                                                    {/if}
                                                </span>
                                            </button>
                                        {/snippet}
                                    </EventPopover>
                                </li>
                            {/each}
                        </ul>
                    </li>
                {/each}
            </ul>
        </ScrollArea>
    {/if}
</div>
