# CLAUDE.md

Working guide for AI agents and humans in `@sv5ui/scheduler`, a scheduler and calendar library for Svelte 5, built on SvelteKit, Tailwind 4 and the sv5ui design system. Sibling repos live at `../../sv5ui` (the design system, the source of every convention here) and `../../sv5ui-datagrid`.

## Commands

| Command                     | What it does                                                                   |
| --------------------------- | ------------------------------------------------------------------------------ |
| `pnpm dev`                  | demo app (`src/routes`)                                                        |
| `pnpm check`                | svelte-check, must stay at 0 errors, 0 warnings                                |
| `pnpm lint` / `pnpm format` | prettier + eslint                                                              |
| `pnpm test`                 | vitest: `server` (node, `*.spec.ts`) + `client` (chromium, `*.svelte.spec.ts`) |
| `pnpm build`                | build + `svelte-package` + publint                                             |

Definition of done: `check`, `lint`, `test` green; `build` too when exports changed.

## Skills: read the one that matches before acting

| Skill                    | When                                                                              |
| ------------------------ | --------------------------------------------------------------------------------- |
| `svelte5`                | Writing any `.svelte` or `.svelte.ts` file. Runes only; training data is Svelte 4 |
| `sv5ui-conventions`      | Creating or editing a component, variants, types or barrel                        |
| `clean-code`             | Before writing or reviewing any source file                                       |
| `scheduler-architecture` | Before adding an export, touching `core/`, or starting a view                     |
| `reactivity-performance` | Before writing any view, store or interaction code, and when something feels slow |
| `algorithms`             | Before implementing or changing anything in `core/`                               |
| `review-component`       | Reviewing a component or core module                                              |
| `git-workflow`           | Before any git or GitHub action                                                   |

## Non-negotiables

- **Svelte 5 runes only.** No `export let`, no `$:`, no `on:click`, no stores, no slots.
- **No comments in `src/`** except JSDoc in `*.types.ts`, where every public option carries one with `@default`. No suppression comments anywhere.
- **Time is `ZonedDateTime`** from `@internationalized/date`, always. Never a bare `Date`.
- **`core/layout/` is internal and pure.** Never exported, never touches the DOM.
- **Material 3 tokens only** (`surface`, `on-surface`, `primary`, `outline-variant`, ...). No hardcoded colours.
- **Reuse sv5ui first.** `sv5ui` is a peer dependency; every component and hook it provides is imported, never rebuilt. Only scheduler-specific parts (views, `EventChip`, time gutter, drag ghost) are built here.
- **No runtime dependency beyond the sv5ui peer set** (`sv5ui`, `@internationalized/date`, `tailwind-merge`, `tailwind-variants`).
- **Keyed `{#each}`, `$state.raw` for collections, one `$derived` per question.** The store is untouched during a drag; it receives one `apply()` on drop.
- **Public types carry no `any` / `unknown`** beyond a generic user-payload default.
- **Never name a local `state`, `props`, `derived` or `effect`** in a runes file.
- **Never commit, push, or open a PR without explicit permission** in the current turn. No AI attribution in commits or PRs.
- **Build order:** types -> store and mutation pipeline -> DST golden table -> first view. Do not reorder.

## Layout

```
src/lib/
  index.ts              root: export * from each area barrel, nothing else
  types/                public types, one file per concern (context, layout, view, interaction, ...)
  config/               defineSchedulerConfig, getComponentConfig
  locales/              one file per locale; index.ts is the ./locales entry
  dom/                  browser helpers shared by interactions and components
  core/                 pure logic, tested in node
    time/               zone, range, week, format, scale (public TimeScale)
    layout/             overlap, lanes, spans, timegrid   INTERNAL, never exported
    store/              event-store, mutations, sources, normalize, filters
    recurrence/  registry/  a11y/  i18n/  utils/
  interactions/
    engine/             gesture controller, hit test, snapping, pointer, autoscroll, motion
    plugins/            create, move, resize, keyboard, external, builtin
  components/
    Scheduler/          root component; state/ holds its runes classes, parts/ its Toolbar
    views/              the five views, TimeGrid (internal, split into parts), builtin.ts
    sidebar/            DateNavigator, CalendarList, SearchBox, DragSourceList, DefaultSidebar
    event/              EventChip, EventPopover
    shared/             internal parts used by more than one component
src/tests/              cross-component specs grouped by area: a11y, interactions, views, sidebar, contract
src/routes/             demo site: overview plus one page per feature under demos/
src/demo/               demo-only parts (nav, sample data, PageHeader, DemoCard, CodeBlock, LogPanel), never packaged
```

Each public component: `Component.svelte`, `component.types.ts`, `component.variants.ts`, `Component.svelte.spec.ts`, `index.ts`. A part private to one component lives in that component's folder; a part used by several lives in `components/shared/`. Every area barrel (`types`, `core`, `components`, `interactions`, `config`) is an explicit named list.

Imports only point down the layers: `types`, then `config`, `locales` and `dom`, then `core`, `interactions` and `components` (`shared` and `event` below `views` and `sidebar`, `Scheduler` on top). `eslint.config.js` enforces the order with `no-restricted-imports`; when it fires, move the code, not the rule.

## Local notes

`docs/` is local-only and gitignored. It holds design notes and the reasoning behind the rules above. Nothing tracked in the repo may depend on it, but keep it current. It is where the _why_ lives.
