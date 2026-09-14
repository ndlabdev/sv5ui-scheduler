# @sv5ui/scheduler

A scheduler and calendar component for Svelte 5, built on [sv5ui](https://github.com/ndlabdev/sv5ui). Bind an array of events and get month, week, day, year and agenda views, drag and drop, full keyboard access, time zones, recurring events and an optimistic update pipeline that rolls back and resolves conflicts for you.

> Under active development. Not yet published.

## Features

- Month, week, day, year and agenda views, plus any number of days in a row
- Create, move and resize with a mouse, a finger or the keyboard
- Drop items from any element on the page onto the grid
- Optimistic updates with per event queues, animated rollback and conflict handling
- Load only the visible range from an API, with caching and aborted stale requests
- Recurring events: daily, weekly, monthly and yearly with interval, count, end date and exceptions
- Correct across time zones and daylight saving changes
- Thirteen label packs, right to left layouts, 12 or 24 hour clocks, ISO week numbers
- Business hours, holidays and background events
- A built-in sidebar with a date navigator, search, calendar list and drag list, each also usable on its own
- Snippets for events, cells, headers, details and empty states
- Custom views, layouts, interactions and store middleware, registered per scheduler
- Theme tokens from sv5ui, dark mode and SSR

## Installation

```sh
pnpm add @sv5ui/scheduler sv5ui
```

Peer dependencies: `svelte` 5, `tailwindcss` 4 and `sv5ui` 2.

Import the sv5ui theme and let Tailwind scan the scheduler, in the stylesheet your app already loads:

```css
@import 'sv5ui/theme.css';
@source '../node_modules/@sv5ui/scheduler/dist';
```

The `@source` path is relative to the stylesheet. Add `<ModeWatcher />` from `mode-watcher` to your root layout for dark mode, as sv5ui describes.

## Quick start

```svelte
<script lang="ts">
    import { Scheduler, type EventInput } from '@sv5ui/scheduler'

    let events = $state<EventInput[]>([
        { id: 'standup', title: 'Standup', start: '2026-09-14T09:00', end: '2026-09-14T09:15' },
        {
            id: 'offsite',
            title: 'Team offsite',
            start: '2026-09-17',
            end: '2026-09-19',
            allDay: true
        }
    ])
</script>

<div style="height: 720px">
    <Scheduler bind:events view="week" timeZone="Europe/London" />
</div>
```

The scheduler fills its container, so give the container a height.

## Events

| Field          | Type                                                                                                 | Notes                                                                         |
| -------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `id`           | `string`                                                                                             | Unique                                                                        |
| `title`        | `string`                                                                                             |                                                                               |
| `start`, `end` | `string` or `ZonedDateTime`                                                                          | ISO strings are read in the scheduler's `timeZone`. `end` is exclusive        |
| `allDay`       | `boolean`                                                                                            | Whole day event                                                               |
| `calendarId`   | `string`                                                                                             | Groups the event under one of `calendars`                                     |
| `color`        | `'primary'`, `'secondary'`, `'tertiary'`, `'success'`, `'warning'`, `'error'`, `'info'`, `'surface'` | Overrides the calendar colour                                                 |
| `background`   | `boolean`                                                                                            | Drawn behind other events and never takes a column                            |
| `editable`     | `boolean`                                                                                            | `false` locks the event                                                       |
| `recurrence`   | `RecurrenceRuleInput`                                                                                | See [Recurring events](#recurring-events)                                     |
| `data`         | `T`                                                                                                  | Your own payload, typed through `EventInput<T>`, handed back to every snippet |

## Saving changes

Everything the user changes is written back into the bound array. To persist changes, pass `onMutate`. The change shows immediately; if `onMutate` throws, the event slides back to where it was.

```svelte
<Scheduler
    bind:events
    onMutate={async (mutation) => {
        const saved = await api.save(mutation)
        return saved
    }}
    onConflict={(mutation, server) => 'keep-server'}
    onError={(mutation, error) => toast.error(String(error))}
/>
```

- `mutation.kind` is `create`, `update`, `move`, `resize` or `delete`, with `before` and `after`.
- Return nothing to confirm the change, or the server's version of the event. If it differs from `after`, `onConflict` decides between `'keep-server'` and `'keep-local'`.
- Changes to different events never wait for each other; changes to the same event run in order.

## Loading events on demand

Pass `source` instead of `events` and the scheduler asks only for the range on screen. Ranges it already holds are not requested again, and requests that are no longer needed are aborted.

```svelte
<Scheduler
    source={async ({ range, timeZone, signal }) => {
        const response = await fetch(`/api/events?from=${range.start}&to=${range.end}`, { signal })
        return response.json()
    }}
    onLoadError={(error) => toast.error(String(error))}
/>
```

## Views

| Prop                         | Default    |                                                                         |
| ---------------------------- | ---------- | ----------------------------------------------------------------------- |
| `view`                       | `'week'`   | `month`, `week`, `day`, `year`, `agenda` or a registered view. Bindable |
| `date`                       | today      | Date the range is computed from. Bindable                               |
| `days`                       |            | Number of days the week view shows, for example `3` or `14`             |
| `weekStartsOn`               | `1`        | `0` is Sunday                                                           |
| `slotMinutes`, `slotHeight`  | `30`, `24` | Size of a time slot                                                     |
| `dayStartHour`, `dayEndHour` | `0`, `24`  | Hours the week and day views draw                                       |
| `hiddenDays`                 | `[]`       | Week days the week and month views leave out, for example `[0, 6]`      |
| `weekNumbers`                | `false`    | ISO 8601 week numbers                                                   |
| `toolbar`                    | `true`     | Show the navigation toolbar                                             |
| `creatable`                  | `true`     | Create events by dragging on empty slots or pressing Enter              |
| `detailPopover`              | `true`     | Open a popover with details when an event is clicked                    |

## Recurring events

```ts
{
    id: 'yoga',
    title: 'Yoga',
    start: '2026-09-15T07:00',
    end: '2026-09-15T08:00',
    recurrence: { freq: 'weekly', byDay: [2, 4], count: 6, exDates: ['2026-09-24T07:00'] }
}
```

Supported: `freq` (`daily`, `weekly`, `monthly`, `yearly`), `interval`, `byDay` (week days), `count`, `until` and `exDates`. Series are expanded only for the visible range. A series given as a `ZonedDateTime` repeats in its own time zone. Occurrences are read only; edit the series to change them all. Other RFC 5545 fields are accepted, reported once in development and ignored.

## Time zones and languages

```svelte
<script lang="ts">
    import { vi } from '@sv5ui/scheduler/locales'
</script>

<Scheduler bind:events timeZone="Asia/Ho_Chi_Minh" locale="vi-VN" labels={vi} hour12={false} />
```

- Every date is a `ZonedDateTime` from `@internationalized/date`. Events show at the right instant in `timeZone`, with correct lengths on the days clocks change.
- Label packs: `ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `nl`, `pt`, `ru`, `vi`, `zh`. Missing keys in your own pack fall back to English.
- Set `dir="rtl"` for right to left layouts; drag and keyboard navigation follow it.

## Business hours and holidays

```svelte
<Scheduler
    bind:events
    businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
    holidays={[{ date: '2026-09-02', title: 'National Day' }]}
/>
```

Time outside business hours is shaded, and holidays are marked in every view.

## Calendars, search and the sidebar

```svelte
<Scheduler
    bind:events
    bind:hiddenCalendars
    bind:search
    calendars={[
        { id: 'work', title: 'Work', color: 'primary' },
        { id: 'personal', title: 'Personal', color: 'success' }
    ]}
    dragSources={[{ title: 'Focus time', durationMinutes: 120, calendarId: 'work' }]}
    sidebar
/>
```

- `sidebar` adds a panel with a date navigator, search, the calendar list and the drag list, and a toolbar button to show and hide it. Below `sidebarBreakpoint` it opens as a slide-over.
- Pass a snippet to `sidebar` to replace the panel, or add content with `sidebarHeader` and `sidebarFooter`. `sidebarOpen` is bindable and `sidebarSide` docks it to `start` or `end`.
- `filter` takes a predicate that runs after `hiddenCalendars` and `search`.
- `DateNavigator`, `CalendarList`, `SearchBox`, `DragSourceList` and `EventChip` are exported to build your own layout.

Any element can become a drag source:

```svelte
<script lang="ts">
    import { dragSource } from '@sv5ui/scheduler'
</script>

<button {@attach dragSource(() => ({ title: 'Write release notes', durationMinutes: 60 }))}>
    Write release notes
</button>
```

## Custom rendering

| Snippet          | Receives                                                                              |
| ---------------- | ------------------------------------------------------------------------------------- |
| `event`          | `{ event, position, view, isDragging, isResizing, isSelected }`                       |
| `cell`           | `{ date, view, isToday, isAnchor, isWeekend, isHoliday, isBusinessHours, isOutside }` |
| `header`         | `{ date, view, label, isToday, isAnchor, holiday }`                                   |
| `eventDetail`    | `{ event, close }`, shown under the default details in the popover                    |
| `empty`          | Nothing; replaces the empty state message                                             |
| `toolbarActions` | Nothing; extra controls at the end of the toolbar                                     |

## Extending

Views, layouts, interactions and store middleware are registered per scheduler. The built-in features use the same interfaces.

```svelte
<script lang="ts">
    import { getDayOfWeek } from '@internationalized/date'
    import {
        Scheduler,
        WeekView,
        type ViewDefinition,
        type StoreMiddleware
    } from '@sv5ui/scheduler'

    const workWeek: ViewDefinition = {
        name: 'workweek',
        label: 'Work week',
        layout: 'time-grid',
        range: (anchor) => {
            const start = anchor
                .set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
                .subtract({ days: getDayOfWeek(anchor, 'en-GB') })
            return { start, end: start.add({ days: 5 }) }
        },
        step: (anchor, direction) => anchor.add({ weeks: direction }),
        component: WeekView
    }

    const logger: StoreMiddleware = (next) => (patch) => {
        console.log(patch.type)
        next(patch)
    }
</script>

<Scheduler bind:events views={[workWeek]} middleware={[logger]} />
```

- `views`: a `ViewDefinition` gives a name, an optional label, a range, a step, a layout and a component that receives `ViewProps`.
- `layouts`: a `LayoutStrategy` turns events into placements.
- `interactions`: an `InteractionPlugin` returns attachments for the grid and for each event, and receives an `InteractionContext` to hit test, preview and commit changes.
- `middleware`: wraps every patch that reaches the event store.

## Theming

The scheduler is drawn with sv5ui theme tokens, so it follows your theme and dark mode. Adjust any part through its named slots:

```svelte
<Scheduler bind:events ui={{ root: 'rounded-2xl border', toolbar: 'bg-surface-container-low' }} />
```

Or set defaults for every instance:

```ts
import { defineSchedulerConfig } from '@sv5ui/scheduler'

defineSchedulerConfig({
    scheduler: { slots: { root: 'rounded-2xl border' } },
    eventChip: { defaultVariants: { size: 'sm' } }
})
```

Configurable components: `scheduler`, `eventChip`, `dateNavigator`, `calendarList`, `searchBox`, `dragSourceList`.

## Keyboard

The grid is a single tab stop. Every move is announced to screen readers.

| Keys               | Action                                                             |
| ------------------ | ------------------------------------------------------------------ |
| Arrow keys         | Move between slots and days; past the edge the view steps a period |
| Home, End          | First or last slot of the day, or start or end of the week         |
| Page Up, Page Down | Previous or next period                                            |
| Enter              | Create an event at the focused slot                                |
| Escape             | Cancel a drag, or clear the selection                              |
| Delete             | Delete the selected event                                          |

## Development

```sh
pnpm install
pnpm dev      # demo site with a page per feature
pnpm test
pnpm check
pnpm lint
pnpm build
```
