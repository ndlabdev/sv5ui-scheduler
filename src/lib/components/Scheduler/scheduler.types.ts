import type { ZonedDateTime } from '@internationalized/date'
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { PartialLabels } from '../../core/i18n/labels.js'
import type { EventInput, SchedulerCalendar, SchedulerEvent } from '../../types/event.types.js'
import type {
    DragSourceData,
    InteractionPlugin,
    SlotSelection
} from '../../types/interaction.types.js'
import type { LayoutStrategy } from '../../types/layout.types.js'
import type { StoreMiddleware } from '../../types/mutation.types.js'
import type { ViewDefinition } from '../../types/view.types.js'
import type { MutationHandlers } from '../../types/mutation.types.js'
import type { BusinessHours, Holiday, TimeZoneId, WeekDay } from '../../types/range.types.js'
import type { EventSourceFn } from '../../types/source.types.js'
import type {
    CellSnippetProps,
    EmptySnippetProps,
    EventDetailSnippetProps,
    CreatePanelSnippetProps,
    EventPanelSnippetProps,
    EventSnippetProps,
    HeaderSnippetProps,
    SidebarSnippetProps,
    ToolbarSnippetProps
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
         * Height of the scheduler, in pixels or any CSS length such as
         * `'70dvh'`. Leave unset to fill the container: give the container a
         * height, or place the scheduler in a flex column with
         * `class="min-h-0 flex-1"` so it takes the remaining space. Without
         * either, it grows with its content.
         */
        height?: number | string

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
         * Number of days the week view shows, starting on the anchor day, for
         * example `4` or `14`. Leave unset for a calendar week that starts on
         * `weekStartsOn`.
         */
        days?: number

        /**
         * Force 12 or 24 hour clocks in every time label. Follows the locale
         * when left unset.
         */
        hour12?: boolean

        /**
         * Opening hours. Slots outside them are drawn muted in the time views
         * and holidays fall outside them. Every hour is open when unset.
         */
        businessHours?: BusinessHours

        /**
         * Days to mark as holidays.
         * @default []
         */
        holidays?: Holiday[]

        /**
         * Show ISO 8601 week numbers in the week, day, month and year views.
         * @default false
         */
        weekNumbers?: boolean

        /**
         * Week days the week and month views leave out, `0` is Sunday. Pass
         * `[0, 6]` for a working week. The day view always shows its day.
         * @default []
         */
        hiddenDays?: WeekDay[]

        /**
         * Groups events can belong to through `calendarId`.
         * @default []
         */
        calendars?: SchedulerCalendar[]

        /**
         * Ids of calendars whose events are hidden. Bindable.
         * @default []
         */
        hiddenCalendars?: string[]

        /**
         * Show only events whose title contains this text, ignoring case and
         * accents. Bindable.
         * @default ''
         */
        search?: string

        /**
         * Extra predicate applied after `hiddenCalendars` and `search`; return
         * `false` to hide an event.
         */
        filter?: (event: SchedulerEvent<T>) => boolean

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
         * First hour the week and day views draw, from `0`. Events that start
         * earlier are cut at the top of the grid; events that end before it are
         * not drawn.
         * @default 0
         */
        dayStartHour?: number

        /**
         * Hour the week and day views end at, up to `24`. Events that end later
         * are cut at the bottom of the grid; events that start after it are not
         * drawn.
         * @default 24
         */
        dayEndHour?: number

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
         * The navigation toolbar. `true` renders the built-in one, `false`
         * hides it, and a snippet replaces it with your own controls fed by
         * `ToolbarSnippetProps`.
         * @default true
         */
        toolbar?: boolean | Snippet<[ToolbarSnippetProps]>

        /**
         * Let users create events by dragging over empty slots or pressing
         * Enter on a focused slot. Selecting a day and dropping `dragSources`
         * keep working when this is `false`.
         * @default true
         */
        creatable?: boolean

        /**
         * Let users move, resize and delete events through the UI. `false`
         * locks every event regardless of its own `editable`; creation follows
         * `creatable`.
         * @default true
         */
        editable?: boolean

        /**
         * Called when an event is clicked or activated with the keyboard,
         * whichever `detail` mode is set. Occurrences of a series
         * arrive with their `seriesId`.
         */
        onEventClick?: (event: SchedulerEvent<T>) => void

        /**
         * Called when an empty slot or day is clicked, or Enter is pressed on
         * a focused slot while `creatable` is `false`. The selection covers one
         * grid slot, or one day in the month view and all-day row.
         */
        onSelectSlot?: (selection: SlotSelection) => void

        /**
         * How an event's details open when it is clicked. `'popover'` anchors a
         * small card to the event, `'slideover'` opens a panel inside the
         * scheduler whose body `eventPanel` can replace, and `false` shows
         * nothing so `onEventClick` can open your own view.
         * @default 'popover'
         */
        detail?: 'popover' | 'slideover' | false

        /**
         * Panel beside the view. `true` renders the built-in sidebar: a date
         * navigator, event search, the calendar list when `calendars` is set
         * and the drag list when `dragSources` is set. A snippet replaces it
         * entirely. The toolbar gains a menu button that shows and hides the
         * panel, and below `sidebarBreakpoint` it opens as a slide-over.
         * @default false
         */
        sidebar?: boolean | Snippet<[SidebarSnippetProps<T>]>

        /**
         * Content above the built-in sidebar, such as a create button.
         */
        sidebarHeader?: Snippet<[SidebarSnippetProps<T>]>

        /**
         * Content below the built-in sidebar.
         */
        sidebarFooter?: Snippet<[SidebarSnippetProps<T>]>

        /**
         * Items the built-in sidebar lists; dropping one on the grid creates
         * an event there.
         * @default []
         */
        dragSources?: DragSourceData<T>[]

        /**
         * Whether the docked sidebar is shown. Bindable.
         * @default true
         */
        sidebarOpen?: boolean

        /**
         * Which side of the view the sidebar docks to.
         * @default 'start'
         */
        sidebarSide?: 'start' | 'end'

        /**
         * Scheduler width in pixels below which the sidebar leaves the layout
         * and opens as a slide-over from the menu button.
         * @default 1024
         */
        sidebarBreakpoint?: number

        /**
         * Called when the toolbar's menu button is pressed, after the sidebar
         * has been toggled. Without a `sidebar` the button is shown only when
         * this is set.
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
         * Replaces the message the week, day and agenda views show, centred in
         * the visible area, when the range holds no events. The month and year
         * grids show none, since their empty cells already read as empty.
         */
        empty?: Snippet<[EmptySnippetProps]>

        /**
         * Extra content under the default details in an event's popover or
         * slide-over.
         */
        eventDetail?: Snippet<[EventDetailSnippetProps<T>]>

        /**
         * Replaces the body of the event slide-over so its content can follow
         * the kind of event. With `detail` set to `'slideover'` the panel opens
         * on click; with `'popover'` the popover gains a button that closes it
         * and opens the panel. The panel keeps its title and close button.
         */
        eventPanel?: Snippet<[EventPanelSnippetProps<T>]>

        /**
         * Fills a panel that opens inside the scheduler when the user marks
         * out a new event: a drag over empty slots or Enter on a focused
         * slot. A plain click only reports through `onSelectSlot`. The snippet
         * receives the picked range and a `create` function; the scheduler
         * never creates an event on its own while this is set. Open it from
         * your own button by setting `draft`.
         */
        createPanel?: Snippet<[CreatePanelSnippetProps<T>]>

        /**
         * The range the create panel is showing, or `null` when it is closed.
         * Bindable: set it to open the panel from your own control, for
         * example a toolbar button with the next free hour.
         * @default null
         */
        draft?: SlotSelection | null

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
