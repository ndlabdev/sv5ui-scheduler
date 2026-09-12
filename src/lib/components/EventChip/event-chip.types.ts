import type { Snippet } from 'svelte'
import type { HTMLButtonAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { SchedulerEvent } from '../../types/event.types.js'
import type { PositionedEvent } from '../../types/extension.types.js'
import type { EventChipSlots, EventChipVariantProps } from './event-chip.variants.js'

/**
 * Props of `EventChip`, the default rendering of one event segment.
 */
export type EventChipProps<T = unknown> = Omit<HTMLButtonAttributes, 'class' | 'color' | 'type'> & {
    /**
     * Bindable reference to the root element.
     */
    ref?: HTMLElement | null

    event: SchedulerEvent<T>

    /**
     * Placement the chip is rendered at. Drives the continuation edges and
     * decides whether the time line is shown.
     */
    position?: PositionedEvent<T>

    /**
     * BCP 47 locale used to format the time line.
     * @default 'en-US'
     */
    locale?: string

    /**
     * Force 12 or 24 hour clocks in the time line.
     */
    hour12?: boolean

    /**
     * Overrides `event.color`.
     */
    color?: NonNullable<EventChipVariantProps['color']>

    /**
     * @default 'md'
     */
    size?: NonNullable<EventChipVariantProps['size']>

    /**
     * Show the start and end time under the title. Ignored for all-day
     * events and span placements, which never show it.
     * @default true
     */
    showTime?: boolean

    /**
     * @default false
     */
    selected?: boolean

    /**
     * @default false
     */
    dragging?: boolean

    /**
     * Per-slot class overrides.
     */
    ui?: Partial<Record<EventChipSlots, ClassNameValue>>

    class?: ClassNameValue

    /**
     * Replaces the default title and time lines.
     */
    children?: Snippet
}
