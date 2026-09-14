import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { EventColor, SchedulerCalendar } from '../../../types/event.types.js'
import type { DragSourceData } from '../../../types/interaction.types.js'
import type { SchedulerLabels } from '../../../types/labels.types.js'
import type { DragSourceListSlots } from './drag-source-list.variants.js'

/**
 * Argument of the `item` snippet of `DragSourceList`, rendered inside the
 * draggable button of one item.
 */
export interface DragSourceListItemProps<T = unknown> {
    item: DragSourceData<T>

    /**
     * Colour the created event will show: the item's own, then its calendar's.
     */
    color: EventColor
}

/**
 * Props of `DragSourceList`, a list of items that create an event where they
 * are dropped on any scheduler grid.
 */
export type DragSourceListProps<T = unknown> = Omit<HTMLAttributes<HTMLElement>, 'class'> & {
    /**
     * Bindable reference to the root element.
     */
    ref?: HTMLElement | null

    items: DragSourceData<T>[]

    /**
     * Calendars that colour items setting a `calendarId` but no `color`.
     * @default []
     */
    calendars?: SchedulerCalendar[]

    /**
     * Heading above the list; `null` renders none.
     * @default labels.unscheduled
     */
    title?: string | null

    /**
     * Display strings; `unscheduled` and `duration` are read.
     */
    labels?: Pick<SchedulerLabels, 'unscheduled' | 'duration'>

    /**
     * Replaces the content of one item's button.
     */
    item?: Snippet<[DragSourceListItemProps<T>]>

    /**
     * Per-slot class overrides.
     */
    ui?: Partial<Record<DragSourceListSlots, ClassNameValue>>

    class?: ClassNameValue
}
