<h1 align="center">@sv5ui/scheduler</h1>

<p align="center">
  <strong>The scheduler and calendar component for Svelte 5.</strong><br/>
  Month, week, day, year and agenda views, drag and drop, recurring events and an optimistic save pipeline, built on <a href="https://github.com/ndlabdev/sv5ui">sv5ui</a> and Tailwind CSS 4.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Svelte-5-ff3e00?style=flat-square&logo=svelte&logoColor=white" alt="Svelte 5" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  <img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <a href="https://www.npmjs.com/package/@sv5ui/scheduler"><img src="https://img.shields.io/npm/v/@sv5ui/scheduler?style=flat-square&colorA=18181b&colorB=ff3e00" alt="npm version" /></a>
  <a href="https://ko-fi.com/ndlabdev"><img src="https://img.shields.io/badge/Ko--fi-donate-ff3e00?style=flat-square&colorA=18181b&logo=kofi&logoColor=white" alt="donate on Ko-fi" /></a>
</p>

<p align="center">
  <a href="CONTRIBUTING.md"><strong>Contributing</strong></a> &middot;
  <a href="CHANGELOG.md"><strong>Changelog</strong></a> &middot;
  <a href="SECURITY.md"><strong>Security</strong></a>
</p>

---

Bind an array of events and you have a working calendar. Every change the user makes is written back into that array; pass one async function to persist it and the scheduler handles queueing, rollback and conflicts.

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

## Quick start

```sh
pnpm add @sv5ui/scheduler sv5ui
```

In the stylesheet your app already imports:

```css
@import 'sv5ui/theme.css';
@import '@sv5ui/scheduler/theme.css';
```

The second line lets Tailwind see the classes inside the package; it needs Tailwind imported by the same stylesheet, which `sv5ui/theme.css` does. Add `<ModeWatcher />` from `mode-watcher` to your root layout for dark mode, as sv5ui describes.

```svelte
<div class="flex h-dvh flex-col">
    <header>Your app header</header>
    <Scheduler bind:events class="min-h-0 flex-1" />
</div>
```

The scheduler fills the height its layout gives it and scrolls inside. Without a bounded height it grows with its content; `height={640}` or `height="70dvh"` fixes it.

## What you get

- **One source of truth.** `events` is a plain bindable array. Push into it and the calendar updates; drag a chip and the array updates.
- **Saving is one function.** `onMutate` receives every change. The UI updates first; a failed save slides back, and you decide who wins a conflict.
- **Correct time.** Every date is a `ZonedDateTime`. Events land on the right instant in any time zone and keep their length across DST changes.
- **Accessible.** One tab stop per grid, keyboard for every action, every change announced, right to left layouts.
- **Works on a phone.** Below `compactBreakpoint` (640px of scheduler width) the toolbar fits one row, the week shows `compactDays` days (3), details open in a slide-over and month cells drop secondary detail. `compactBreakpoint={0}` keeps the desktop layout everywhere.
- **Extensible.** Views, layouts, interactions and store middleware are registered per instance through the interfaces the built-in features use.

## Events

| Field          | Type                                                                                                 | Notes                                                                                                                      |
| -------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `id`           | `string`                                                                                             | Unique and stable                                                                                                          |
| `title`        | `string`                                                                                             |                                                                                                                            |
| `start`, `end` | `string` or `ZonedDateTime`                                                                          | Naive ISO strings are read in `timeZone`, `Z` or an offset are instants, date-only strings are all-day. `end` is exclusive |
| `allDay`       | `boolean`                                                                                            | Shown in the all-day row and month cells                                                                                   |
| `calendarId`   | `string`                                                                                             | Groups the event under one of `calendars`                                                                                  |
| `color`        | `'primary'`, `'secondary'`, `'tertiary'`, `'success'`, `'warning'`, `'error'`, `'info'`, `'surface'` | Overrides the calendar colour                                                                                              |
| `background`   | `boolean`                                                                                            | Drawn behind other events, never editable                                                                                  |
| `editable`     | `boolean`                                                                                            | `false` locks this event                                                                                                   |
| `recurrence`   | `RecurrenceRuleInput`                                                                                | `freq`, `interval`, `byDay`, `count`, `until`, `exDates`                                                                   |
| `data`         | `T`                                                                                                  | Your own payload, typed through `EventInput<T>`, handed to every snippet                                                   |

A change to any field, `recurrence` included, reaches the calendar. `data` is compared by reference, so assign a new object rather than editing it in place. Events the scheduler hands back carry `ZonedDateTime` values: send `event.start.toAbsoluteString()` to an API that stores UTC.

Recurring series are expanded for the visible range only. A series given as a `ZonedDateTime` repeats in its own zone, and `until` and `exDates` written as strings are read in that zone. Occurrences are read only; edit the series. Other RFC 5545 fields are accepted, reported once in development and ignored.

## Saving changes

```svelte
<Scheduler
    bind:events
    onMutate={async (mutation) => api.save(mutation)}
    onConflict={(mutation, server) => 'keep-server'}
    onError={(mutation, error) => toast.error(String(error))}
/>
```

- `mutation.kind` is `create`, `update`, `move`, `resize` or `delete`, with `before` and `after`.
- Return nothing to confirm, or return the server's version. When it differs from `after`, `onConflict` picks `'keep-server'` or `'keep-local'`. A new `id` from the server is adopted. An answer that cannot be read rolls back like a rejection.
- Changes to different events run in parallel; changes to the same event run in order. A confirmed save survives a refetch of `events` that lands while it is in flight.
- Limit: when the server assigns a new id on create and the user moves that event again before the answer arrives, the second change carries the client id.

### Your own editor

Pass `createPanel` and a panel opens inside the calendar after a drag over empty slots or Enter on a focused slot. A plain click only reports through `onSelectSlot`. `draft` is bindable, so your own button can open the panel.

```svelte
<Scheduler bind:events bind:draft createPanel={form} />

{#snippet form({ start, end, allDay, close, create })}
    <Input bind:value={title} />
    <Button label="Save" onclick={() => create({ title, start, end, allDay })} />
    <Button label="Cancel" variant="ghost" onclick={close} />
{/snippet}
```

`create` saves through the same pipeline as drag and drop. To use your own dialog instead, leave `createPanel` out and listen to `onSelectSlot` and `onEventClick` with `detail={false}`.

### Details in a panel

`detail="slideover"` opens an event in a panel inside the calendar instead of a popover. `eventPanel` replaces its body and receives `update` and `remove`, both going through the pipeline:

```svelte
<Scheduler bind:events detail="slideover" eventPanel={panel} />

{#snippet panel({ event, close, remove, update, deletable })}
    <Input bind:value={title} />
    <Button label="Save" onclick={() => update({ title })} />
    {#if deletable}<Button label="Delete" color="error" onclick={remove} />{/if}
{/snippet}
```

## Loading on demand

Pass `source` instead of `events` and the scheduler asks only for the range on screen. Held ranges are not requested again, stale requests are aborted, a slow request shows a thin progress bar, and `onLoadError` reports failures. To fetch again, pass a new function.

```svelte
<Scheduler
    source={async ({ range, timeZone, signal }) => {
        const response = await fetch(`/api/events?from=${range.start}&to=${range.end}`, { signal })
        return response.json()
    }}
/>
```

## Props

| Prop                                               | Default     |                                                                                             |
| -------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `view`                                             | `'week'`    | `month`, `week`, `day`, `year`, `agenda` or a registered view. Bindable                     |
| `date`                                             | today       | Date the visible range is computed from. Bindable                                           |
| `days`                                             |             | Number of days the week view shows, for example `3` or `14`                                 |
| `weekStartsOn`                                     | `1`         | `0` is Sunday                                                                               |
| `hiddenDays`                                       | `[]`        | Week days left out of the week and month views, for example `[0, 6]`                        |
| `dayStartHour`, `dayEndHour`                       | `0`, `24`   | Hours the week and day views draw                                                           |
| `slotMinutes`, `slotHeight`                        | `30`, `24`  | Size of a time slot                                                                         |
| `weekNumbers`                                      | `false`     | ISO 8601 week numbers                                                                       |
| `businessHours`                                    |             | `{ start: '09:00', end: '18:00', days: [1, 2, 3, 4, 5] }`; other time is shaded             |
| `holidays`                                         | `[]`        | `{ date, title }`; tinted and named in every view                                           |
| `timeZone`                                         | device zone | Any IANA zone; changes at runtime without a refetch. Set it when rendering on the server    |
| `locale`, `hour12`, `labels`, `dir`                |             | BCP 47 locale, 12 or 24 hour clock, a label pack, `rtl`                                     |
| `creatable`                                        | `true`      | Create by dragging over empty slots or pressing Enter                                       |
| `editable`                                         | `true`      | Move, resize and delete. `false` locks every event                                          |
| `detail`                                           | `'popover'` | `'popover'`, `'slideover'` or `false`                                                       |
| `calendars`, `hiddenCalendars`, `search`, `filter` |             | Group, colour and filter events. `hiddenCalendars` and `search` are bindable                |
| `sidebar`                                          | `false`     | Date navigator, search, calendar list and drag list; a slide-over below `sidebarBreakpoint` |
| `dragSources`                                      | `[]`        | Items the sidebar lists; dropping one on the grid creates an event                          |
| `toolbar`                                          | `true`      | `false` hides it; a snippet replaces it                                                     |
| `height`                                           |             | Pixels or any CSS length                                                                    |
| `compactBreakpoint`, `compactDays`                 | `640`, `3`  | The phone layout switch and its week length                                                 |
| `onEventClick`, `onSelectSlot`                     |             | A click on an event, a click or Enter on an empty slot                                      |

Label packs: `ar`, `de`, `en`, `es`, `fr`, `it`, `ja`, `ko`, `nl`, `pt`, `ru`, `vi`, `zh` from `@sv5ui/scheduler/locales`. Partial packs fall back to English.

Any element can be a drag source:

```svelte
<button {@attach dragSource(() => ({ title: 'Write release notes', durationMinutes: 60 }))}>
    Write release notes
</button>
```

## Custom rendering

| Snippet          | Receives                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| `event`          | `{ event, position, view, isDragging, isResizing, isSelected }`, everywhere an event is drawn                        |
| `cell`           | `{ date, view, isToday, isAnchor, isWeekend, isHoliday, isBusinessHours, isOutside }`, timed columns and month cells |
| `header`         | `{ date, view, label, isToday, isAnchor, holiday }`, week headers and the day title                                  |
| `eventDetail`    | `{ event, close }`, under the default details in the popover or slide-over                                           |
| `eventPanel`     | `{ event, close, remove, update, deletable }`, the body of the details slide-over                                    |
| `createPanel`    | `{ start, end, allDay, close, create }`, the panel that creates an event                                             |
| `empty`          | `{ view, range }`, the message of an empty week, day or agenda                                                       |
| `toolbar`        | `{ title, date, range, view, views, step, today, navigate, setView, toggleSidebar, compact }`                        |
| `toolbarActions` | Nothing; extra controls at the end of the built-in toolbar                                                           |
| `sidebar`        | `{ date, view, range, events, navigate, close, docked }`, plus `sidebarHeader` and `sidebarFooter`                   |

A custom event keeps the behaviour of the default chip: a click reports `onEventClick`, opens the configured `detail` and selects the event. Render a `button` inside it for keyboard users.

`DateNavigator`, `CalendarList`, `SearchBox`, `DragSourceList` and `EventChip` are also exported on their own.

## Extending

| Prop           | Interface           | What it adds                                                                    |
| -------------- | ------------------- | ------------------------------------------------------------------------------- |
| `views`        | `ViewDefinition`    | A name, a range, a step, a layout and a component that receives `ViewProps`     |
| `layouts`      | `LayoutStrategy`    | Turns events into placements for a view                                         |
| `interactions` | `InteractionPlugin` | Attachments for the grid and each event, with an `InteractionContext` to commit |
| `middleware`   | `StoreMiddleware`   | Wraps every patch that reaches the event store                                  |

```ts
const workWeek: ViewDefinition = {
    name: 'workweek',
    label: 'Work week',
    layout: 'time-grid',
    range: (anchor) => ({
        start: startOfWeek(anchor, 'en-GB'),
        end: startOfWeek(anchor, 'en-GB').add({ days: 5 })
    }),
    step: (anchor, direction) => anchor.add({ weeks: direction }),
    component: WeekView
}
```

## Theming

Drawn with sv5ui theme tokens, so it follows your theme and dark mode. Adjust a part through its slot, per instance or once for all:

```svelte
<Scheduler bind:events ui={{ root: 'rounded-2xl border', toolbar: 'bg-surface-container-low' }} />
```

```ts
// src/scheduler.config.ts, imported once from your root layout next to sv5ui.config
import { defineSchedulerConfig } from '@sv5ui/scheduler'

defineSchedulerConfig({ scheduler: { slots: { root: 'rounded-2xl border' } } })
```

Configurable: `scheduler`, `eventChip`, `dateNavigator`, `calendarList`, `searchBox`, `dragSourceList`. Inside the calendar each view picks the chip `size` and `variant` that fit its cells; `defaultVariants` apply to components you render yourself.

## Keyboard

| Keys               | Action                                                              |
| ------------------ | ------------------------------------------------------------------- |
| Arrow keys         | Move between slots and days; past the edge the view steps a period  |
| Home, End          | First or last slot of the day, or start or end of the week          |
| Page Up, Page Down | Previous or next period                                             |
| Enter              | Create an event at the focused slot, or report it to `onSelectSlot` |
| Space              | Select the event at the focused slot; again for the next one        |
| Escape             | Cancel a drag, or clear the selection                               |
| Delete             | Delete the selected event; a locked one announces why it stays      |

## Requirements

| Peer          | Version  |
| ------------- | -------- |
| `svelte`      | `^5.0.0` |
| `tailwindcss` | `^4.0.0` |
| `sv5ui`       | `^2.7.0` |

`@internationalized/date`, `tailwind-variants` and `tailwind-merge` come with the package. Add `@internationalized/date` to your own dependencies only if your code builds or types `ZonedDateTime` values; under pnpm a transitive package cannot be imported.

## Contributing

```sh
pnpm install
pnpm dev      # demo site
pnpm test     # vitest, node and browser
pnpm check    # svelte-check
pnpm lint     # prettier and eslint
pnpm build    # package build and publint
```

Open an issue first, branch from `dev`, open the pull request against `dev`. See [CONTRIBUTING.md](CONTRIBUTING.md). Report a vulnerability privately through [SECURITY.md](SECURITY.md).

## Support

Free and developed in the open. If it saves you time, a coffee helps keep it maintained. Starring the repository or sending a pull request helps just as much.

<p>
  <a href="https://ko-fi.com/ndlabdev"><img src="https://img.shields.io/badge/Ko--fi-Support%20this%20project-ff3e00?style=for-the-badge&logo=kofi&logoColor=white&colorA=18181b" alt="Support this project on Ko-fi" /></a>
</p>

## License

[MIT](LICENSE) &copy; [ndlabdev](https://github.com/ndlabdev)
