# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

First release.

### Added

- **Scheduler**: one component with month, week, day, year and agenda views. `bind:events` keeps a plain array as the single source of truth; every change made through the UI is written back into it, and a change to any field of an event in the array, its `recurrence` included, reaches the calendar. `view` and `date` are bindable.
- **Scheduler**: saving through `onMutate`. Changes show immediately, run in order per event and in parallel across events, and animate back with `onError` when a save fails. `onConflict` picks `keep-server` or `keep-local` when the server answers with a different version, an id assigned by the server is adopted, a confirmed save survives a refetch of `events` that lands while it is in flight, and an answer that cannot be read rolls back like a rejection.
- **Scheduler**: `source` loads events for the visible range only. Covered ranges are not requested again, stale requests are aborted, a slow request shows a thin progress bar, and `onLoadError` reports failures.
- **Scheduler**: `createPanel` and bindable `draft` open your own form inside the calendar after a drag over empty slots or Enter on a focused slot; `create` saves through the same pipeline as drag and drop. `onSelectSlot` and `onEventClick` let an app open its own dialog instead.
- **Scheduler**: event details with `detail="popover"`, `detail="slideover"` (a panel inside the calendar whose body `eventPanel` can replace, with `update` and `remove` going through the save pipeline) or `detail={false}`; `eventDetail` adds content to both. Popover actions carry tooltips, and with `eventPanel` set the popover gains an Open details button.
- **Scheduler**: `days` for custom week lengths, `weekStartsOn`, `hiddenDays`, `dayStartHour` and `dayEndHour`, `slotMinutes` and `slotHeight`, ISO 8601 `weekNumbers`, `businessHours` and `holidays`.
- **Scheduler**: `height` in pixels or any CSS length; without one the scheduler fills a bounded parent or grows with its content.
- **Scheduler**: a layout for phones below `compactBreakpoint` (640px of scheduler width): a one row toolbar with a view menu and short titles, `compactDays` days in the week view, month cells without week numbers and holiday names, details in a slide-over, and popovers kept inside the screen. `SchedulerContext.compact` exposes the switch to views.
- **Scheduler**: `timeZone` accepts any IANA zone and can change at runtime without a refetch. ISO strings with `Z` or an offset, naive strings, date-only strings and `ZonedDateTime` values are read; events that cannot be read are skipped with a development warning. The week and day views name the zone, and event details name it when it differs from the device zone.
- **Scheduler**: `locale`, `hour12`, `dir="rtl"` and label packs for ar, de, en, es, fr, it, ja, ko, nl, pt, ru, vi and zh through `@sv5ui/scheduler/locales`. Partial `labels` fall back to English.
- **Scheduler**: recurring events with `freq`, `interval`, `byDay`, `count`, `until` and `exDates`, expanded for the visible range only. A series given as a `ZonedDateTime` keeps its zone, for `until` and `exDates` written as plain strings as well. Other RFC 5545 fields are accepted, reported once in development and ignored.
- **Scheduler**: `calendars` with colours, bindable `hiddenCalendars` and `search`, and a `filter` predicate.
- **Scheduler**: `sidebar` with a date navigator, search, calendar list and drag list, docked at `sidebarSide` or opened as a slide-over below `sidebarBreakpoint`. `sidebarOpen` is bindable; `sidebarHeader`, `sidebarFooter` or a `sidebar` snippet customise it.
- **Scheduler**: snippets for `event`, `cell`, `header`, `eventDetail`, `eventPanel`, `createPanel`, `empty`, `toolbar` and `toolbarActions`; `toolbar={false}` hides the toolbar. The `event` snippet is used in every place an event is drawn, including the all-day row and the `+N` list, keeps the click behaviour of the default chip (`onEventClick` once per opening click, the configured `detail` and selection), and tells a move from a resize through `isDragging` and `isResizing`. The `header` snippet also covers the day view title.
- **Scheduler**: per instance extension points `views`, `layouts`, `interactions` and `middleware`, used by the built-in features as well.
- **Interactions**: select, drag to create, move, resize from both ends and across days, drop a timed event on the all-day row, and move month events to another day keeping their time. Touch drags start after a short press so the page still scrolls. `creatable` and `editable` switch creation and editing off, and `editable: false` locks a single event.
- **Interactions**: `dragSource` turns any element into something that can be dropped on the grid to create an event.
- **Keyboard and screen readers**: the grid is a single named tab stop with arrow, Home, End, Page Up, Page Down, Enter, Space, Escape and Delete keys; Space selects the event at the focused slot and cycles through overlapping ones. Delete on an event that may not be edited, a locked one or an occurrence of a series, announces why nothing happened. Moves, creations, deletions, rollbacks and conflicts are announced.
- **DateNavigator**, **CalendarList**, **SearchBox**, **DragSourceList**, **EventChip**: exported for layouts of your own, together with the five views. Each forwards HTML attributes to its root element.
- **Package**: the manifest now carries the description, license, author, homepage, repository and issue tracker, so the npm page describes the package and links back to the repository.
- **Package**: `@internationalized/date` is accepted in the same range as sv5ui asks for, so one copy serves both packages.
- **Theming**: `@sv5ui/scheduler/theme.css` tells Tailwind where the classes of the package live, so an app imports it next to `sv5ui/theme.css` instead of writing a path into its own stylesheet.
- **Theming**: drawn with sv5ui theme tokens, including dark mode. `ui` slots per instance and `defineSchedulerConfig` for defaults across instances. Rendering on the server never touches `window`.
