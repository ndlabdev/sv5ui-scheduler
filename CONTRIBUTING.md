# Contributing to @sv5ui/scheduler

Thanks for taking the time to help. This guide covers the setup, the checks a change has to pass, the way work travels from an issue to a release, and the conventions the code follows.

## Prerequisites

- Node.js 22 or newer, the version CI runs
- pnpm 10 or newer, the package manager the lockfile belongs to

## Setup

```bash
pnpm install
pnpm dev
```

`pnpm dev` serves the demo site from `src/routes`, one page per feature under `demos/`.

## Quality gates

Run these before opening a pull request. CI runs the same on every pull request and push to `dev` and `main`.

```bash
pnpm check   # svelte-check, must stay at 0 errors and 0 warnings
pnpm lint    # prettier and eslint
pnpm test    # vitest, a node project and a real browser project
pnpm build   # package build and publint, required when exports change
```

`pnpm format` fixes formatting.

## Workflow

`dev` is the integration branch and `main` is the released branch. Both are protected, so every change arrives through a pull request.

1. **Open an issue** from one of the templates and wait for triage, unless the change is trivial.
2. **Branch from `dev`** using the naming below.
3. **Implement** with tests and an entry in `CHANGELOG.md` under `## [Unreleased]`.
4. **Open a pull request into `dev`** with `Closes #<issue>` in the body and the checklist filled in. It is merged with a squash.
5. **Releases** open a pull request from `dev` into `main`, merged with a merge commit, then a `vX.Y.Z` tag on `main` publishes the package.

### Branch naming

```
fix/<issue#>-short-slug
feat/<issue#>-short-slug
docs/<issue#>-short-slug
chore/<short-slug>
hotfix/<issue#>-short-slug
```

A hotfix, and only a hotfix, branches from `main`: it fixes the released version, goes into `main`, and is then merged back into `dev`.

### Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), with the module or component as the scope:

```
feat(store): adopt the id the server returns on create
fix(week-view): keep an event in place across a DST fall back
test(time): add a DST golden table for Australia/Sydney
```

Allowed types: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`. The message carries the reason for the change, since the code carries no comments.

## Conventions

- **Svelte 5 runes only.** No `export let`, no `$:`, no `on:click`, no stores, no slots.
- **No comments in `src/`**, except JSDoc in `*.types.ts`, where every public option documents its default. No suppression comments anywhere.
- **Time is always a `ZonedDateTime`** from `@internationalized/date`, never a bare `Date`.
- **Design tokens only** (`surface`, `on-surface`, `primary`, `outline-variant`), never a hardcoded colour.
- **Reuse sv5ui.** Everything sv5ui provides is imported, not rebuilt. Only scheduler specific parts live here.
- **Public types carry no `any` or `unknown`**, beyond the generic payload an event can hold.
- The layout engine under `src/lib/core/layout/` is internal, pure, and never exported or allowed to touch the DOM.

## Project layout

```
src/lib/types/         public types, one file per concern
src/lib/core/          pure logic: time, layout, store, recurrence, i18n
src/lib/interactions/  gesture engine and the plugins built on it
src/lib/components/    Scheduler, the views, the sidebar parts, the event parts
src/tests/             cross component specs: a11y, interactions, views, sidebar, contract
src/routes/            the demo site
```

Each public component is a folder holding the component, its `*.types.ts`, its `*.variants.ts`, its spec and an `index.ts`. Imports only point down the layers, and eslint enforces that order.

## Tests

Specs ending in `*.svelte.spec.ts` run in Chromium, everything else runs in node. A fix carries a test that fails without it: reintroduce the defect once and watch the test go red before you trust it.

## Changelog

[Keep a Changelog](https://keepachangelog.com/) and [semantic versioning](https://semver.org/). Add a line under `## [Unreleased]`, grouped by `Added`, `Changed`, `Fixed` or `Removed` and scoped by component:

```
- **WeekView**: keep the all-day row hidden until an event needs it.
```

Say what changed and why, not which files moved.

## Security

Do not open a public issue for a vulnerability. See [SECURITY.md](./SECURITY.md).
