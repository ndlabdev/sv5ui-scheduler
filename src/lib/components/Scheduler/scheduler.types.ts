import type { ZonedDateTime } from '@internationalized/date'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { PartialLabels } from '../../core/i18n/labels.js'
import type { EventInput } from '../../types/event.types.js'
import type {
    InteractionPlugin,
    LayoutStrategy,
    StoreMiddleware,
    ViewDefinition
} from '../../types/extension.types.js'
import type { MutationHandlers } from '../../types/mutation.types.js'
import type { BusinessHours, Holiday, TimeZoneId, WeekDay } from '../../types/range.types.js'
import type { EventSourceFn } from '../../types/source.types.js'
import type {
    CellSnippetProps,
    EventSnippetProps,
    HeaderSnippetProps
} from '../../types/snippet.types.js'
import type { SchedulerSlots } from './scheduler.variants.js'

/**
 * Props of `Scheduler`, the root component. `T` is the shape of `event.data`.
 */
export type SchedulerProps<T = unknown> = Omit<HTMLAttributes<HTMLDivElement>, 'class'> &
    MutationHandlers<T> & {
        /**
         * Bindable reference to the root element.
         */
        ref?: HTMLElement | null

        /**
         * The events, as a plain bindable array. Changes made through the UI
         * are written back into it, so it stays the single source of truth.
         * Ignored when `source` is set.
         */
        events?: EventInput<T>[]

        /**
         * Loads events for the visible range on demand. When set, the
         * scheduler owns the loaded events and `events` is ignored.
         */
        source?: EventSourceFn<T>

        /**
         * Called when `source` fails to load a range.
         */
        onLoadError?: (error: unknown) => void

        /**
         * Name of the active view. Bindable.
         * @default 'week'
         */
        view?: string

        /**
         * Date the visible range is computed from. Bindable.
         * @default now
         */
        date?: ZonedDateTime

        /**
         * IANA time zone every date is shown in.
         * @default the browser's local zone
         */
        timeZone?: TimeZoneId

        /**
         * BCP 47 locale for formatting.
         * @default 'en-US'
         */
        locale?: string

        /**
         * First day of the week, `0` is Sunday.
         * @default 1
         */
        weekStartsOn?: WeekDay

        /**
         * Force 12 or 24 hour clocks in every time label. Follows the locale
         * when left unset.
         */
        hour12?: boolean

        businessHours?: BusinessHours

        /**
         * @default []
         */
        holidays?: Holiday[]

        /**
         * Display strings. Missing keys fall back to English.
         */
        labels?: PartialLabels

        /**
         * Minutes per grid slot in the time views.
         * @default 30
         */
        slotMinutes?: number

        /**
         * Height of one slot in pixels.
         * @default 24
         */
        slotHeight?: number

        /**
         * Extra or replacement views, matched to `view` by name.
         */
        views?: ViewDefinition<T>[]

        /**
         * Extra or replacement layout strategies, matched by name.
         */
        layouts?: LayoutStrategy[]

        /**
         * Wrap every store patch, in order.
         */
        middleware?: StoreMiddleware<T>[]

        /**
         * Extra pointer or keyboard behaviours.
         */
        interactions?: InteractionPlugin<T>[]

        /**
         * Show the navigation toolbar.
         * @default true
         */
        toolbar?: boolean

        /**
         * Called when the toolbar's menu button is pressed. The button is
         * shown only when this is set; the scheduler does not own a sidebar.
         */
        onMenu?: () => void

        /**
         * Per-slot class overrides.
         */
        ui?: Partial<Record<SchedulerSlots, ClassNameValue>>

        class?: ClassNameValue

        /**
         * Extra controls at the end of the toolbar, such as share or filter
         * buttons.
         */
        toolbarActions?: Snippet

        /**
         * Renders a strip between the toolbar and the view, for a suggestion
         * or a notice.
         */
        banner?: Snippet

        /**
         * Replaces the message shown when the visible range holds no events.
         */
        empty?: Snippet

        /**
         * Renders one event.
         */
        event?: Snippet<[EventSnippetProps<T>]>

        /**
         * Renders the background of a day cell or column.
         */
        cell?: Snippet<[CellSnippetProps]>

        /**
         * Renders a day column header.
         */
        header?: Snippet<[HeaderSnippetProps]>
    }
