<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import { Badge } from 'sv5ui'
    import { formatDate, formatWeekdayLong, formatZoneName } from '../../../core/time/format.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { Holiday } from '../../../types/range.types.js'
    import WeekNumber from '../../shared/WeekNumber.svelte'
    import { timeGridVariants } from './time-grid.variants.js'

    interface Props {
        day: ZonedDateTime
        scheduler: SchedulerContext
        isToday: boolean
        holiday: Holiday | undefined
        week: number
    }

    let { day, scheduler, isToday, holiday, week }: Props = $props()

    const classes = timeGridVariants()
</script>

<div class={classes.dayTitle({ class: holiday ? classes.holidayColumn() : '' })} data-sch-day-title>
    <span class={classes.dayTitleWeekday()}>
        {formatWeekdayLong(day, scheduler.locale)}
    </span>
    <div class={classes.dayTitleRow()}>
        <h3 class={classes.dayTitleDate()}>{formatDate(day, scheduler.locale)}</h3>
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
</div>
