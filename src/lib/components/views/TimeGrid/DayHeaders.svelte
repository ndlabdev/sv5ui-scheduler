<script lang="ts">
    import type { ZonedDateTime } from '@internationalized/date'
    import { isoDate } from '../../../core/time/day-flags.js'
    import { formatDayNumber, formatWeekday } from '../../../core/time/format.js'
    import { isSameDay } from '../../../core/time/zone.js'
    import type { SchedulerContext } from '../../../types/context.types.js'
    import type { Holiday } from '../../../types/range.types.js'
    import type { ViewSnippets } from '../../../types/view.types.js'
    import WeekNumber from '../../shared/WeekNumber.svelte'
    import { headerColumns } from './time-grid.js'
    import { timeGridVariants } from './time-grid.variants.js'

    interface Props {
        days: ZonedDateTime[]
        view: string
        anchor: ZonedDateTime
        scheduler: SchedulerContext
        header: ViewSnippets['header']
        todayIndex: number
        holidays: ReadonlyMap<string, Holiday>
        tints: string[][]
        week: number
    }

    let { days, view, anchor, scheduler, header, todayIndex, holidays, tints, week }: Props =
        $props()

    const classes = timeGridVariants()
</script>

<div class={classes.header()} style:grid-template-columns={headerColumns(days.length)}>
    <div class={classes.gutterSpacer()}>
        {#if scheduler.weekNumbers}
            <WeekNumber {week} labels={scheduler.labels} class={classes.weekNumber()} />
        {/if}
    </div>
    {#each days as day, dayIndex (isoDate(day))}
        {@const isToday = dayIndex === todayIndex}
        {@const isAnchor = isSameDay(day, anchor)}
        {@const weekday = formatWeekday(day, scheduler.locale)}
        {@const number = formatDayNumber(day, scheduler.locale)}
        {@const holiday = holidays.get(isoDate(day))}
        <div
            class={classes.dayHeader({ class: tints[dayIndex] })}
            data-sch-day={isoDate(day)}
            data-sch-anchor={isAnchor ? '' : undefined}
            aria-current={isToday ? 'date' : undefined}
        >
            {#if header}
                {@render header({
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
