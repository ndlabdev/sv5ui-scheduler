import type { ClassNameValue } from 'tailwind-merge'
import type { HTMLInputAttributes } from 'svelte/elements'
import type { SchedulerLabels } from '../../../types/labels.types.js'
import type { SearchBoxSlots } from './search-box.variants.js'

/**
 * Props of `SearchBox`, a text field for the scheduler's `search`. Other
 * attributes reach the input element.
 */
export type SearchBoxProps = Omit<
    HTMLInputAttributes,
    'class' | 'value' | 'size' | 'color' | 'width' | 'height' | 'placeholder' | 'aria-label'
> & {
    /**
     * Bindable reference to the input element.
     */
    ref?: HTMLInputElement | null

    /**
     * Search text. Bind it to the scheduler's `search`. Bindable.
     * @default ''
     */
    value?: string

    /**
     * Key that focuses the field from anywhere on the page, unless focus is
     * already in another text field; `null` turns it off.
     * @default '/'
     */
    shortcut?: string | null

    /**
     * Display strings; only `searchEvents` is read.
     */
    labels?: Pick<SchedulerLabels, 'searchEvents'>

    /**
     * Per-slot class overrides.
     */
    ui?: Partial<Record<SearchBoxSlots, ClassNameValue>>

    class?: ClassNameValue
}
