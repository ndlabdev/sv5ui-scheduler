<script lang="ts" generics="T">
    import { Icon } from 'sv5ui'
    import type { ClassNameValue } from 'tailwind-merge'
    import type { SchedulerEvent } from '../../../types/event.types.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import { getLocalTimeZone } from '@internationalized/date'
    import {
        formatDayRange,
        formatLongDate,
        formatTimeRange,
        formatZoneName
    } from '../../../core/time/format.js'
    import { eventColor } from '../../../core/store/filters.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import { EVENT_SWATCH } from '../EventChip/event-chip.variants.js'
    import { eventDetailsVariants } from './event-details.variants.js'

    interface Props {
        event: SchedulerEvent<T>
        scheduler: SchedulerContext
        class?: ClassNameValue
    }

    let { event, scheduler, class: className }: Props = $props()

    const classes = eventDetailsVariants()
    const allDay = $derived(event.allDay === true)
    const lastDay = $derived(allDay ? event.end.subtract({ days: 1 }) : event.end)
    const primary = $derived(
        allDay && !isSameDay(event.start, lastDay)
            ? formatDayRange(event, scheduler.locale)
            : formatLongDate(event.start, scheduler.locale)
    )
    const foreignZone = $derived(!allDay && scheduler.timeZone !== getLocalTimeZone())
    const secondary = $derived(
        allDay
            ? scheduler.labels.allDay
            : formatTimeRange(event.start, event.end, scheduler.locale, scheduler.hour12)
    )
    const zoneName = $derived(foreignZone ? formatZoneName(event.start, scheduler.locale) : null)
    const color = $derived(eventColor(event, scheduler.calendars))
    const calendar = $derived(
        scheduler.calendars.find((candidate) => candidate.id === event.calendarId)
    )
</script>

<div class={classes.root({ class: className })}>
    <div class={classes.row()}>
        <Icon name="lucide:calendar" size={16} class={classes.icon()} />
        <div>
            <p class={classes.primary()}>{primary}</p>
            <p class={classes.secondary()}>
                {secondary}
                {#if zoneName}
                    <span class={classes.zone()} title={scheduler.timeZone} data-sch-zone>
                        ({zoneName})
                    </span>
                {/if}
            </p>
        </div>
    </div>
    {#if calendar}
        <div class={classes.row()} data-sch-detail-calendar>
            <span class={classes.calendarSwatch({ class: EVENT_SWATCH[color] })}></span>
            <p class={classes.secondary()}>{calendar.title}</p>
        </div>
    {/if}
</div>
