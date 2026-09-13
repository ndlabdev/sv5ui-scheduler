<script lang="ts" module>
    import type { DateNavigatorProps } from './date-navigator.types.js'

    export type Props<T = unknown> = DateNavigatorProps<T>
</script>

<script lang="ts" generics="T">
    import {
        getLocalTimeZone,
        toCalendarDate,
        toZoned,
        type DateValue
    } from '@internationalized/date'
    import { Button, Calendar } from 'sv5ui'
    import { getComponentConfig } from '../../config.js'
    import { defaultLabels } from '../../core/i18n/labels.js'
    import { daysWithEvents } from '../../core/layout/segments.js'
    import { normalizeEvents } from '../../core/store/normalize.js'
    import { indexFrom, queryIndex } from '../../core/store/sorted-index.js'
    import { isoDate } from '../../core/time/day-flags.js'
    import { monthRange } from '../../core/time/view-ranges.js'
    import { nowIn, startOfDay } from '../../core/time/zone.js'
    import { dateNavigatorDefaults, dateNavigatorVariants } from './date-navigator.variants.js'

    const config = getComponentConfig('dateNavigator', dateNavigatorDefaults)

    let {
        ref = $bindable(null),
        date,
        onSelect,
        events = [],
        timeZone = getLocalTimeZone(),
        locale = 'en-US',
        weekStartsOn = 1,
        labels = defaultLabels,
        ui,
        class: className,
        ...restProps
    }: Props<T> = $props()

    let placeholder: DateValue = $derived(toCalendarDate(date))
    const selected = $derived(toCalendarDate(date))
    const shown = $derived(startOfDay(toZoned(placeholder, timeZone)))
    const index = $derived(indexFrom(normalizeEvents(events, timeZone)))
    const busy = $derived.by(() => {
        const range = monthRange(shown, weekStartsOn)
        return daysWithEvents(queryIndex(index, range, { weekStartsOn }), range)
    })

    const classes = $derived.by(() => {
        const slots = dateNavigatorVariants()
        return {
            root: slots.root({ class: [config.slots.root, className, ui?.root] }),
            calendar: slots.calendar({ class: [config.slots.calendar, ui?.calendar] }),
            today: slots.today({ class: [config.slots.today, ui?.today] })
        }
    })

    function pick(value: DateValue | undefined) {
        if (value) onSelect?.(startOfDay(toZoned(value, timeZone)))
    }

    function today() {
        onSelect?.(startOfDay(nowIn(timeZone)))
    }
</script>

<section bind:this={ref} {...restProps} class={classes.root} data-sch-date-navigator>
    <Calendar
        type="single"
        value={selected}
        bind:placeholder
        {weekStartsOn}
        {locale}
        size="sm"
        isDateHighlightable={(day) => busy.has(isoDate(toZoned(day, timeZone)))}
        onValueChange={pick}
        class={classes.calendar}
    />
    <Button
        variant="link"
        color="primary"
        ui={{ base: 'p-0' }}
        class={classes.today}
        onclick={today}
    >
        {labels.today}
    </Button>
</section>
