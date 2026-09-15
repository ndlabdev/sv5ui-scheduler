<h1 align="center">@sv5ui/scheduler</h1>

<p align="center">
  <strong>The scheduler and calendar component for Svelte 5.</strong><br/>
  Month, week, day, year and agenda views, drag and drop, recurring events and an optimistic save pipeline, built on <a href="https://github.com/ndlabdev/sv5ui">sv5ui</a> and Tailwind CSS 4.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

> Under active development. Not yet published to npm.

---

Bind an array of events and you have a working calendar. Every change the user makes through the UI is written back into that array; pass one async function to persist it and the scheduler handles queueing, rollback and conflicts for you.

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

<Scheduler bind:events view="week" timeZone="Europe/London" onMutate={api.save} height="80dvh" />
```

## Why @sv5ui/scheduler

- **One source of truth.** `events` is a plain bindable array. Push into it and the calendar updates; drag a chip and the array updates. No imperative API to learn.
- **Saving is one function.** `onMutate` receives every change. The UI updates first; if the save fails the event slides back, and if the server answers with a different version you decide which wins.
- **Correct time.** Every date is a `ZonedDateTime` from `@internationalized/date`. Events land on the right instant in any time zone and keep the right length on the days clocks change.
- **Native Svelte 5.** Runes, snippets and attachments throughout. Customise the event, the cell, the header, the popover, the toolbar and the sidebar with snippets, not render functions.
- **Accessible.** One tab stop per grid, arrow keys between slots, Enter to create, Escape to cancel, every move announced to screen readers, right to left layouts.
- **Works on a phone.** Long press to drag, a compact month grid, a slide-over sidebar and an agenda view for narrow screens.
- **Extensible by design.** Views, layouts, interactions and store middleware are registered per instance through the same interfaces the built-in features use.
- **Themed by sv5ui.** Drawn with sv5ui design tokens, so it follows your theme and dark mode without extra styling.

## Quick start

**1. Install**

```sh
pnpm add @sv5ui/scheduler sv5ui
```

**2. Load the theme and let Tailwind see the package**, in the stylesheet your app already imports:

```css
@import 'sv5ui/theme.css';
@source '../node_modules/@sv5ui/scheduler/dist';
```

The `@source` path is relative to the stylesheet. Add `<ModeWatcher />` from `mode-watcher` to your root layout for dark mode, as sv5ui describes.

**3. Render it**

```svelte
<script lang="ts">
    import { Scheduler, type EventInput } from '@sv5ui/scheduler'

    let events = $state<EventInput[]>([])
</script>

<div class="flex h-dvh flex-col">
    <header>Your app header</header>
    <Scheduler bind:events class="min-h-0 flex-1" />
</div>
```

The scheduler takes the remaining height of the page and scrolls inside it. See [Sizing](#sizing) for the other layouts.

## Sizing

The scheduler fills whatever height its layout gives it and scrolls inside. Three layouts cover every case, and none of them needs a hard-coded number for the common one:

| Layout             | How                                                                               | When                                       |
| ------------------ | --------------------------------------------------------------------------------- | ------------------------------------------ |
| Rest of the page   | Put it in a flex column: `<Scheduler class="min-h-0 flex-1" />` under your header | The calendar is the main screen of the app |
| Grows with content | Nothing to do; without a bounded height every view expands to its content         | A calendar in the middle of a long page    |
| Fixed size         | `height={640}` or `height="70dvh"`, or size the parent                            | A card, a dashboard tile, a modal          |

## On phones

Below `compactBreakpoint` (640px of scheduler width by default) the calendar switches to a layout made for touch, with no configuration:

- The toolbar fits on one row: a today button, arrows, a short title such as `Sep 15 – 17`, and a menu to pick the view. Every control is at least 36px.
- The week view shows `compactDays` days from the current date (3 by default) and the arrows step by that many. Pass `compactDays={null}` to keep the whole week.
- Clicking an event opens its details in a slide-over inside the calendar instead of a popover.
- Month cells drop week numbers and holiday names so day numbers stay readable; the agenda view remains the best fit for long lists.
- Popovers that do open are kept inside the screen, so the page never scrolls sideways.

Set `compactBreakpoint={0}` to keep the desktop layout everywhere. A custom `toolbar` snippet receives `compact` to follow the same switch, and views may provide a `shortTitle`.

## Events

| Field          | Type                                                                                                 | Notes                                                                              |
| -------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `id`           | `string`                                                                                             | Unique and stable                                                                  |
| `title`        | `string`                                                                                             |                                                                                    |
| `start`, `end` | `string` or `ZonedDateTime`                                                                          | ISO strings are read in the scheduler's `timeZone`. `end` is exclusive             |
| `allDay`       | `boolean`                                                                                            | Shown in the all-day row and month cells                                           |
| `calendarId`   | `string`                                                                                             | Groups the event under one of `calendars`                                          |
| `color`        | `'primary'`, `'secondary'`, `'tertiary'`, `'success'`, `'warning'`, `'error'`, `'info'`, `'surface'` | Overrides the calendar colour                                                      |
| `background`   | `boolean`                                                                                            | Drawn behind other events, never takes a column                                    |
| `editable`     | `boolean`                                                                                            | `false` locks this event                                                           |
| `recurrence`   | `RecurrenceRuleInput`                                                                                | See [Recurring events](#recurring-events)                                          |
| `data`         | `T`                                                                                                  | Your own payload, typed through `EventInput<T>`, handed to every snippet unchanged |

## Saving changes

Pass `onMutate` to persist what the user does. The change is shown immediately; if `onMutate` throws or rejects, the event animates back to where it was and `onError` is called.

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
- Return nothing to confirm the change, or return the server's version of the event. When it differs from `after`, `onConflict` decides between `'keep-server'` and `'keep-local'`. If the server assigns a new `id`, as most do on create, the event adopts it.
- A save is confirmed even if you reassign `events` from a refetch while it is in flight: the confirmed state is written back once the server answers.
- `start` and `end` accept ISO strings with `Z`, an offset, or no zone (read in `timeZone`), and date-only strings for all-day events.
- Changes to different events never wait for each other. Changes to the same event run in order.

### Your own editor

Every app stores something different, so the form is yours and the scheduler provides the flow. Pass `createPanel` and a panel opens inside the calendar when the user marks out a new event: a drag over empty slots, or Enter on a focused slot. A plain click only reports through `onSelectSlot`. The snippet receives the picked range and a `create` function that saves through the same pipeline as drag and drop, so `onMutate` runs, the server may assign the id, and a failure rolls back.

```svelte
<Scheduler bind:events bind:draft createPanel={form} />

{#snippet form({ start, end, allDay, close, create })}
    <Input bind:value={title} />
    <Button label="Save" onclick={() => create({ title, start, end, allDay })} />
    <Button label="Cancel" variant="ghost" onclick={close} />
{/snippet}

<Button
    label="Create event"
    onclick={() => (draft = { start: nextHour, end: nextHour.add({ hours: 1 }), allDay: false })}
/>
```

- While `createPanel` is set the scheduler never creates an event on its own; dragging over empty slots only selects the range. Set `creatable={false}` to keep the grid from opening the panel at all, leaving `draft` as the only way in.
- `draft` is bindable: set it to open the panel from your own button, read it to know what is being planned.
- To skip the panel and open your own dialog instead, leave `createPanel` out and listen to `onSelectSlot` and `onEventClick`:

```svelte
<Scheduler
    bind:events
    creatable={false}
    detail={false}
    onEventClick={(event) => openEditor(event)}
    onSelectSlot={({ start, end, allDay }) => openEditor({ start, end, allDay })}
/>
```

### Details in a panel

Set `detail="slideover"` and a click opens the event in a panel inside the calendar instead of a popover. Without a snippet it shows the date, time, calendar and a delete button. Pass `eventPanel` to fill it with whatever the kind of event needs:

```svelte
<Scheduler bind:events detail="slideover" eventPanel={panel} />

{#snippet panel({ event, close, remove, deletable })}
    <p>{event.data.location}</p>
    <Button label="Done" onclick={close} />
    {#if deletable}
        <Button label="Cancel meeting" color="error" onclick={remove} />
    {/if}
{/snippet}
```

## Loading events on demand

Pass `source` instead of `events` and the scheduler asks only for the range on screen. Ranges it already holds are not requested again, requests that are no longer needed are aborted, and a request that takes longer than a moment shows a thin progress bar while the calendar stays usable.

```svelte
<Scheduler
    source={async ({ range, timeZone, signal }) => {
        const response = await fetch(`/api/events?from=${range.start}&to=${range.end}`, { signal })
        return response.json()
    }}
    onLoadError={(error) => toast.error(String(error))}
/>
```

## Views and navigation

| Prop                         | Default    |                                                                         |
| ---------------------------- | ---------- | ----------------------------------------------------------------------- |
| `view`                       | `'week'`   | `month`, `week`, `day`, `year`, `agenda` or a registered view. Bindable |
| `date`                       | today      | Date the visible range is computed from. Bindable                       |
| `days`                       |            | Number of days the week view shows, for example `3` or `14`             |
| `weekStartsOn`               | `1`        | `0` is Sunday                                                           |
| `hiddenDays`                 | `[]`       | Week days the week and month views leave out, for example `[0, 6]`      |
| `dayStartHour`, `dayEndHour` | `0`, `24`  | Hours the week and day views draw                                       |
| `slotMinutes`, `slotHeight`  | `30`, `24` | Size of a time slot                                                     |
| `weekNumbers`                | `false`    | ISO 8601 week numbers                                                   |
| `toolbar`                    | `true`     | `false` hides the toolbar; a snippet replaces it                        |

### Your own toolbar

Pass a snippet as `toolbar` to put navigation anywhere in your page. It receives the title, the registered views and the same actions the built-in buttons use.

```svelte
<Scheduler bind:events toolbar={header} />

{#snippet header({ title, step, today, view, views, setView })}
    <div class="flex items-center gap-2">
        <Button icon="lucide:chevron-left" onclick={() => step(-1)} />
        <Button label="Today" onclick={today} />
        <Button icon="lucide:chevron-right" onclick={() => step(1)} />
        <h2>{title}</h2>
        <ToggleGroup
            items={views.map(({ name, label }) => ({ value: name, label }))}
            value={view}
            onValueChange={setView}
        />
    </div>
{/snippet}
```

## Interactions

| Prop          | Default     |                                                                                        |
| ------------- | ----------- | -------------------------------------------------------------------------------------- |
| `creatable`   | `true`      | Create events by dragging over empty slots or pressing Enter on a focused slot         |
| `editable`    | `true`      | Move, resize and delete events. `false` locks every event                              |
| `detail`      | `'popover'` | `'popover'` or `'slideover'` opens an event's details on click; `false` turns them off |
| `dragSources` | `[]`        | Items the built-in sidebar lists; dropping one on the grid creates an event there      |

Any element on the page can become a drag source:

```svelte
<script lang="ts">
    import { dragSource } from '@sv5ui/scheduler'
</script>

<button {@attach dragSource(() => ({ title: 'Write release notes', durationMinutes: 60 }))}>
    Write release notes
</button>
```

Dropping it on a time slot creates a timed event; dropping it on a month cell or the all-day row creates an all-day one. On touch screens a drag starts after a short press, so the page still scrolls.

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

- `freq` is `daily`, `weekly`, `monthly` or `yearly`, with `interval`, `byDay`, `count`, `until` and `exDates`.
- Series are expanded only for the visible range, and a series given as a `ZonedDateTime` repeats in its own time zone.
- Occurrences are read only. Edit the series to change them all.
- Other RFC 5545 fields are accepted, reported once in development and ignored, so your data never has to change shape.

## Time zones and languages

```svelte
<script lang="ts">
    import { vi } from '@sv5ui/scheduler/locales'
</script>

<Scheduler bind:events timeZone="Asia/Ho_Chi_Minh" locale="vi-VN" labels={vi} hour12={false} />
```

- `timeZone` is the zone every date is shown in; the week and day views name it above the hour gutter, and the event details name it when it differs from the device zone. Change it at runtime and every event moves to its new wall clock time without another fetch.
- Reading: `start` and `end` accept ISO strings with `Z` or an offset (absolute instants), naive strings such as `2026-09-14T09:00` (read in `timeZone`), date-only strings (all-day) and `ZonedDateTime` values. A recurring series given as a `ZonedDateTime` repeats in its own zone, so a 9:00 standup in Sydney stays at 9:00 Sydney time whatever `timeZone` shows.
- An event whose dates cannot be read, or that ends before it starts, is skipped with a warning in development instead of breaking the calendar.
- Writing: every event the scheduler hands back (`mutation.after`, `onEventClick`, snippets) carries `ZonedDateTime` values in `timeZone`. Send `event.start.toAbsoluteString()` to an API that stores UTC, or `event.start.toString()` to keep the zone.
- `locale` drives every date and time format. `hour12` forces a 12 or 24 hour clock.
- Label packs: `ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `nl`, `pt`, `ru`, `vi`, `zh`. Missing keys in a pack of your own fall back to English.
- Set `dir="rtl"` for right to left layouts. Dragging and keyboard navigation follow it.

## Business hours and holidays

```svelte
<Scheduler
    bind:events
    businessHours={{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }}
    holidays={[{ date: '2026-09-02', title: 'National Day' }]}
/>
```

Time outside business hours is shaded, and holidays are named in every view.

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

- `calendars` groups events through `calendarId` and gives them a colour. `hiddenCalendars` and `search` filter what is shown; `filter` adds a predicate of your own.
- `sidebar` adds a panel with a date navigator, search, the calendar list and the drag list, plus a toolbar button to show and hide it. Below `sidebarBreakpoint` it opens as a slide-over.
- Pass a snippet to `sidebar` to replace the panel, or add content with `sidebarHeader` and `sidebarFooter`. `sidebarOpen` is bindable and `sidebarSide` docks it to `start` or `end`.
- `DateNavigator`, `CalendarList`, `SearchBox`, `DragSourceList` and `EventChip` are exported on their own for layouts of your own.

## Custom rendering

Every visual part can be replaced with a snippet. Your `data` payload arrives typed.

| Snippet          | Receives                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `event`          | `{ event, position, view, isDragging, isResizing, isSelected }`                                                                                      |
| `cell`           | `{ date, view, isToday, isAnchor, isWeekend, isHoliday, isBusinessHours, isOutside }`                                                                |
| `header`         | `{ date, view, label, isToday, isAnchor, holiday }`                                                                                                  |
| `eventDetail`    | `{ event, close }`, shown under the default details in the popover or slide-over                                                                     |
| `eventPanel`     | `{ event, close, remove, deletable }`, replaces the body of the details slide-over; with `detail="popover"` the popover gains an Open details button |
| `createPanel`    | `{ start, end, allDay, close, create }`, fills the panel that opens to create an event                                                               |
| `empty`          | `{ view, range }`; replaces the message the week, day and agenda views show when the range holds no events                                           |
| `toolbar`        | `{ title, date, range, view, views, step, today, navigate, setView, toggleSidebar }`                                                                 |
| `toolbarActions` | Nothing; extra controls at the end of the built-in toolbar                                                                                           |
| `sidebar`        | `{ date, view, range, events, navigate, close, docked }`                                                                                             |

```svelte
<Scheduler bind:events event={card} />

{#snippet card({ event, isSelected })}
    <div class={['h-full rounded-lg bg-primary-container p-2', isSelected && 'ring-2']}>
        {event.title}
        <p class="text-xs">{event.data.location}</p>
    </div>
{/snippet}
```

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

| Prop           | Interface           | What it adds                                                                                     |
| -------------- | ------------------- | ------------------------------------------------------------------------------------------------ |
| `views`        | `ViewDefinition`    | A name, an optional label, a range, a step, a layout and a component that receives `ViewProps`   |
| `layouts`      | `LayoutStrategy`    | Turns events into placements for a view                                                          |
| `interactions` | `InteractionPlugin` | Attachments for the grid and for each event, with an `InteractionContext` to hit test and commit |
| `middleware`   | `StoreMiddleware`   | Wraps every patch that reaches the event store                                                   |

## Theming

The scheduler is drawn with sv5ui theme tokens, so it follows your theme and dark mode. Adjust any part through its named slots:

```svelte
<Scheduler bind:events ui={{ root: 'rounded-2xl border', toolbar: 'bg-surface-container-low' }} />
```

Or set defaults once for every instance:

```ts
import { defineSchedulerConfig } from '@sv5ui/scheduler'

defineSchedulerConfig({
    scheduler: { slots: { root: 'rounded-2xl border' } },
    eventChip: { defaultVariants: { size: 'sm' } }
})
```

Configurable components: `scheduler`, `eventChip`, `dateNavigator`, `calendarList`, `searchBox`, `dragSourceList`.

## Keyboard and screen readers

The grid is a single tab stop with a descriptive name. Every move, creation, deletion and rollback is announced.

| Keys               | Action                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Arrow keys         | Move between slots and days; past the edge the view steps a period  |
| Home, End          | First or last slot of the day, or start or end of the week          |
| Page Up, Page Down | Previous or next period                                             |
| Enter              | Create an event at the focused slot, or report it to `onSelectSlot` |
| Escape             | Cancel a drag, or clear the selection                               |
| Delete             | Delete the selected event                                           |

## Requirements

| Peer          | Version  |
| ------------- | -------- |
| `svelte`      | `^5.0.0` |
| `tailwindcss` | `^4.0.0` |
| `sv5ui`       | `^2.7.0` |

`@internationalized/date`, `tailwind-variants` and `tailwind-merge` are installed with the package and shared with sv5ui.

## Contributing

Issues and pull requests are welcome. To run the project locally:

```sh
pnpm install
pnpm dev      # demo site with a page per feature
pnpm test     # vitest, node and real browser
pnpm check    # svelte-check
pnpm lint     # prettier and eslint
pnpm build    # package build and publint
```
