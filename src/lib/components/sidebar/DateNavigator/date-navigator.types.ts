import type { ZonedDateTime } from '@internationalized/date'
import type { HTMLAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { EventInput } from '../../../types/event.types.js'
import type { SchedulerLabels } from '../../../types/labels.types.js'
import type { TimeZoneId, WeekDay } from '../../../types/range.types.js'
import type { DateNavigatorSlots } from './date-navigator.variants.js'

/**
 * Props of `DateNavigator`, a month-at-a-glance calendar that jumps the
 * scheduler to a day. Days that hold an event carry a dot.
 */
export type DateNavigatorProps<T = unknown> = Omit<HTMLAttributes<HTMLElement>, 'class'> & {
    /**
     * Bindable reference to the root element.
     */
    ref?: HTMLElement | null

    /**
     * Day shown as selected. The displayed month follows it.
     */
    date: ZonedDateTime

    /**
     * Called with the start of the picked day, in `timeZone`.
     */
    onSelect?: (date: ZonedDateTime) => void

    /**
     * Events whose days get a dot. Recurring series are expanded for the
     * displayed month.
     * @default []
     */
    events?: EventInput<T>[]

    /**
     * IANA time zone the days are computed in.
     * @default the browser's local zone
     */
    timeZone?: TimeZoneId

    /**
     * BCP 47 locale for the month heading and weekday names.
     * @default 'en-US'
     */
    locale?: string

    /**
     * First day of the week, `0` is Sunday.
     * @default 1
     */
    weekStartsOn?: WeekDay

    /**
     * Display strings; only `today` is read.
     */
    labels?: Pick<SchedulerLabels, 'today'>

    /**
     * Per-slot class overrides.
     */
    ui?: Partial<Record<DateNavigatorSlots, ClassNameValue>>

    class?: ClassNameValue
}
