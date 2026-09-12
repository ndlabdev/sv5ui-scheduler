<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Empty, ScrollArea } from 'sv5ui'
    import type { SchedulerEvent } from '../../types/event.types.js'
    import type { ViewProps } from '../../types/extension.types.js'
    import { formatLongDate, formatTime } from '../../core/time/format.js'
    import { eachDay, intersect } from '../../core/time/range.js'
    import { isWholeDay } from '../../core/layout/segments.js'
    import { agendaListVariants } from './agenda-list.variants.js'

    const MINUTES_PER_HOUR = 60
    const MS_PER_MINUTE = 60000

    let {
        view,
        range,
        events,
        scheduler,
        snippets,
        interactions,
        selectedEventId,
        onSelectEvent
    }: ViewProps<T> = $props()

    const classes = agendaListVariants()

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
                const onDay = events.filter((event) =>
                    intersect({ start: event.start, end: event.end }, dayRange)
                )
                return {
                    key: day.toString().slice(0, 10),
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
    ) {
        if (isWholeDay(event)) return 0
        const visible = intersect({ start: event.start, end: event.end }, dayRange)
        if (!visible) return 0
        return (visible.end.toDate().getTime() - visible.start.toDate().getTime()) / MS_PER_MINUTE
    }

    function meta(group: Group): string {
        const count = scheduler.labels.eventCount(group.events.length)
        if (group.minutes === 0) return count
        const hours = Math.floor(group.minutes / MINUTES_PER_HOUR)
        const minutes = Math.round(group.minutes % MINUTES_PER_HOUR)
        return `${count} · ${scheduler.labels.duration(hours, minutes)}`
    }

    function time(event: SchedulerEvent<T>): string {
        return formatTime(event.start, scheduler.locale, scheduler.hour12)
    }
</script>

<div class={classes.root()} data-sch-agenda>
    {#if groups.length === 0}
        <div class={classes.empty()}>
            {#if snippets.empty}
                {@render snippets.empty()}
            {:else}
                <Empty icon="lucide:calendar-off" title={scheduler.labels.noEvents} />
            {/if}
        </div>
    {:else}
        <ScrollArea class={classes.scroll()}>
            <div {@attach interactions.grid}>
                {#each groups as group (group.key)}
                    <section class={classes.group()} data-sch-day={group.key}>
                        <header class={classes.groupHeader()}>
                            <h3 class={classes.groupDate()}>
                                {formatLongDate(group.day, scheduler.locale)}
                            </h3>
                            <span class={classes.groupMeta()}>{meta(group)}</span>
                        </header>
                        {#each group.events as event (event.id)}
                            <button
                                type="button"
                                class={classes.event({
                                    class:
                                        selectedEventId === event.id ? classes.eventSelected() : ''
                                })}
                                data-sch-event-id={event.id}
                                aria-pressed={selectedEventId === event.id}
                                onclick={() => onSelectEvent(event.id)}
                            >
                                <span class={classes.time()}>
                                    {#if isWholeDay(event)}
                                        {scheduler.labels.allDay}
                                    {:else}
                                        {time(event)}
                                        <span class={classes.timeEnd()}>
                                            &rarr; {formatTime(
                                                event.end,
                                                scheduler.locale,
                                                scheduler.hour12
                                            )}
                                        </span>
                                    {/if}
                                </span>
                                <span class={classes.bar({ color: event.color ?? 'primary' })}
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
                                        <span class={classes.title()}>{event.title}</span>
                                    {/if}
                                </span>
                            </button>
                        {/each}
                    </section>
                {/each}
            </div>
        </ScrollArea>
    {/if}
</div>
