<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Badge } from 'sv5ui'
    import type { Snippet } from 'svelte'
    import { formatDate, formatWeekdayLong, formatZoneName } from '../../../core/time/format.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { Holiday } from '../../../types/range.types.js'
    import type { HeaderSnippetProps } from '../../../types/snippet.types.js'
    import WeekNumber from '../../shared/WeekNumber.svelte'
    import { timeGridVariants } from './time-grid.variants.js'

    interface Props {
        day: ZonedDateTime
        view: string
        anchor: ZonedDateTime
        scheduler: SchedulerContext
        isToday: boolean
        holiday: Holiday | undefined
        week: number
        header?: Snippet<[HeaderSnippetProps]>
    }

    let { day, view, anchor, scheduler, isToday, holiday, week, header }: Props = $props()

    const classes = timeGridVariants()
    const weekday = $derived(formatWeekdayLong(day, scheduler.locale))
    const date = $derived(formatDate(day, scheduler.locale))
</script>

<div class={classes.dayTitle({ class: holiday ? classes.holidayColumn() : '' })} data-sch-day-title>
    {#if header}
        {@render header({
            date: day,
            view,
            label: `${weekday} ${date}`,
            isToday,
            isAnchor: isSameDay(day, anchor),
            holiday
        })}
        <div class={classes.dayTitleRow()}>
            {#if scheduler.weekNumbers}
                <WeekNumber {week} labels={scheduler.labels} class={classes.weekNumber()} />
            {/if}
            <span class={classes.dayTitleZone()} title={scheduler.timeZone} data-sch-zone>
                {formatZoneName(day, scheduler.locale)}
            </span>
        </div>
    {:else}
        <span class={classes.dayTitleWeekday()}>
            {weekday}
        </span>
        <div class={classes.dayTitleRow()}>
            <h3 class={classes.dayTitleDate()}>{date}</h3>
            {#if isToday}
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
                <WeekNumber {week} labels={scheduler.labels} class={classes.weekNumber()} />
            {/if}
            <span class={classes.dayTitleZone()} title={scheduler.timeZone} data-sch-zone>
                {formatZoneName(day, scheduler.locale)}
            </span>
        </div>
    {/if}
</div>
