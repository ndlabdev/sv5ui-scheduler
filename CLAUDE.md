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
  core/
    store/        event-store.svelte.ts, mutations.svelte.ts, sources.ts
    time/         scale.ts (public TimeScale), range.ts, zone.ts
    layout/       overlap.ts, timegrid.ts, monthgrid.ts   INTERNAL, never exported
    registry/     views.ts, layout.ts, middleware.ts, interactions.ts
  components/     Scheduler/ MonthView/ WeekView/ DayView/ AgendaView/ EventChip/
  interactions/   drag-create.ts, drag-move.ts, resize.ts, keyboard.ts
  scheduler.types.ts
  scheduler.variants.ts
  index.ts        root: export * from each area barrel, nothing else
  types/index.ts  area barrel: explicit named list, the semver contract
  core/index.ts   area barrel: explicit named list
```

Each component: `Component.svelte`, `component.types.ts`, `component.variants.ts`, `Component.svelte.spec.ts`, `index.ts`.

## Local notes

`docs/` is local-only and gitignored. It holds design notes and the reasoning behind the rules above. Nothing tracked in the repo may depend on it, but keep it current. It is where the _why_ lives.
