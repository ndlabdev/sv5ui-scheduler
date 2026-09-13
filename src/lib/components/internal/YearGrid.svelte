<script lang="ts" generics="T">
    import type { ZonedDateTime } from '@internationalized/date'
    import { ScrollArea } from 'sv5ui'
    import type { ViewProps } from '../../types/extension.types.js'
    import { daysWithEvents } from '../../core/layout/segments.js'
    import {
        formatDayNumber,
        formatLongDate,
        formatMonthName,
        formatWeekdayNarrow
    } from '../../core/time/format.js'
    import { eachDay } from '../../core/time/range.js'
    import { monthRange } from '../../core/time/view-ranges.js'
    import { isoWeekOfRow } from '../../core/time/week.js'
    import { isSameDay } from '../../core/time/zone.js'
    import WeekNumber from './WeekNumber.svelte'
    import { yearGridVariants } from './year-grid.variants.js'

    const DAYS_PER_WEEK = 7

    let { range, events, scheduler, navigate }: ViewProps<T> = $props()

    const classes = yearGridVariants()
    const busy = $derived(daysWithEvents(events, range))
    const months = $derived(
        Array.from({ length: 12 }, (_, index) => {
            const first = range.start.add({ months: index })
            const days = eachDay(monthRange(first, scheduler.weekStartsOn))
            const weeks = Array.from({ length: days.length / DAYS_PER_WEEK }, (_, row) =>
                days.slice(row * DAYS_PER_WEEK, (row + 1) * DAYS_PER_WEEK)
            )
            return { first, weeks }
        })
    )
    const holidays = $derived(new Map(scheduler.holidays.map((holiday) => [holiday.date, holiday])))

    const isoDate = (day: ZonedDateTime) => day.toString().slice(0, 10)

    function dayLabel(day: ZonedDateTime): string {
        const date = formatLongDate(day, scheduler.locale)
        const title = holidays.get(isoDate(day))?.title
        return title ? scheduler.labels.holidayDate(date, title) : date
    }

    function numberClass(day: ZonedDateTime, inMonth: boolean): string {
        if (!inMonth) return classes.numberOutside()
        if (isSameDay(day, scheduler.now)) return classes.numberToday()
        return holidays.has(isoDate(day)) ? classes.numberHoliday() : ''
    }
</script>

<div class={classes.root()} data-sch-year-grid>
    <ScrollArea class={classes.scroll()} dir={scheduler.direction}>
        <div class={classes.months()}>
            {#each months as month (month.first.month)}
                <section class={classes.month()} data-sch-month={month.first.month}>
                    <button
                        type="button"
                        class={classes.monthTitle()}
                        onclick={() => navigate(month.first, 'month')}
                    >
                        {formatMonthName(month.first, scheduler.locale)}
                    </button>
                    <div
                        class={classes.weekdays({
                            class: scheduler.weekNumbers ? classes.withWeekNumbers() : ''
                        })}
                        aria-hidden="true"
                    >
                        {#if scheduler.weekNumbers}
                            <span></span>
                        {/if}
                        {#each month.weeks[0] as day (isoDate(day))}
                            <span class={classes.weekday()}>
                                {formatWeekdayNarrow(day, scheduler.locale)}
                            </span>
                        {/each}
                    </div>
                    <div
                        class={classes.days({
                            class: scheduler.weekNumbers ? classes.withWeekNumbers() : ''
                        })}
                    >
                        {#each month.weeks as week (isoDate(week[0]))}
                            {#if scheduler.weekNumbers}
                                {@const number = isoWeekOfRow(week[0]).week}
                                <WeekNumber
                                    week={number}
                                    labels={scheduler.labels}
                                    class={classes.weekNumber()}
                                />
                            {/if}
                            {#each week as day (isoDate(day))}
                                {@const inMonth = day.month === month.first.month}
                                <button
                                    type="button"
                                    class={classes.day()}
                                    data-sch-day={inMonth ? isoDate(day) : undefined}
                                    data-sch-busy={inMonth && busy.has(isoDate(day))
                                        ? ''
                                        : undefined}
                                    tabindex={inMonth ? undefined : -1}
                                    data-sch-holiday={inMonth && holidays.has(isoDate(day))
                                        ? ''
                                        : undefined}
                                    aria-label={dayLabel(day)}
                                    onclick={() => navigate(day, 'day')}
                                >
                                    <span
                                        class={classes.number({ class: numberClass(day, inMonth) })}
                                    >
                                        {formatDayNumber(day, scheduler.locale)}
                                    </span>
                                    <span
                                        class={classes.dot({
                                            class:
                                                inMonth && busy.has(isoDate(day))
                                                    ? classes.dotBusy()
                                                    : ''
                                        })}
                                    ></span>
                                </button>
                            {/each}
                        {/each}
                    </div>
                </section>
            {/each}
        </div>
    </ScrollArea>
</div>
