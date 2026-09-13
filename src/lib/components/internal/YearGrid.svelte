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
    import { isSameDay } from '../../core/time/zone.js'
    import { yearGridVariants } from './year-grid.variants.js'

    const DAYS_PER_WEEK = 7

    let { range, events, scheduler, navigate }: ViewProps<T> = $props()

    const classes = yearGridVariants()
    const busy = $derived(daysWithEvents(events, range))
    const months = $derived(
        Array.from({ length: 12 }, (_, index) => {
            const first = range.start.add({ months: index })
            return { first, days: eachDay(monthRange(first, scheduler.weekStartsOn)) }
        })
    )

    const isoDate = (day: ZonedDateTime) => day.toString().slice(0, 10)
</script>

<div class={classes.root()} data-sch-year-grid>
    <ScrollArea class={classes.scroll()}>
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
                    <div class={classes.weekdays()} aria-hidden="true">
                        {#each month.days.slice(0, DAYS_PER_WEEK) as day (isoDate(day))}
                            <span class={classes.weekday()}>
                                {formatWeekdayNarrow(day, scheduler.locale)}
                            </span>
                        {/each}
                    </div>
                    <div class={classes.days()}>
                        {#each month.days as day (isoDate(day))}
                            {@const inMonth = day.month === month.first.month}
                            {@const today = inMonth && isSameDay(day, scheduler.now)}
                            <button
                                type="button"
                                class={classes.day()}
                                data-sch-day={inMonth ? isoDate(day) : undefined}
                                data-sch-busy={inMonth && busy.has(isoDate(day)) ? '' : undefined}
                                tabindex={inMonth ? undefined : -1}
                                aria-label={formatLongDate(day, scheduler.locale)}
                                onclick={() => navigate(day, 'day')}
                            >
                                <span
                                    class={classes.number({
                                        class: today
                                            ? classes.numberToday()
                                            : inMonth
                                              ? ''
                                              : classes.numberOutside()
                                    })}
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
                    </div>
                </section>
            {/each}
        </div>
    </ScrollArea>
</div>
