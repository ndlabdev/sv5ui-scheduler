---
name: clean-code
description: The no-comments rule and what replaces it, naming, function size, purity, suppression-comment ban, and the traps that have cost time in sibling repos. Use before writing or reviewing any source file.
user-invocable: true
---

# Clean Code

## No comments in `src/`, with one exception

Not "few". None. The name, the type and the test carry the meaning; a comment is a second copy that goes stale. Why a thing is done the way it is belongs in the commit message, the CHANGELOG or `docs/`, all of which are read when the question is actually asked.

**The exception is `*.types.ts`**, which is documentation rather than commentary: those JSDoc blocks are the tooltips an app sees over every option, and `@default` says what the type cannot. Every public option in a `*.types.ts` file must carry one. Both halves are enforced: none anywhere else, and never none there.

Before writing a comment anywhere else, ask: *would deleting this line let someone undo a decision without noticing?* If the answer is no, do not write it. If the answer is yes, the code is not clear enough yet: rename, extract or restructure until it is.

What replaces comments:

| Instead of | Do |
|---|---|
| `// check if the event spans midnight` | `if (spansMidnight(event))` |
| `// convert to minutes since start of day` | `const minutesFromDayStart = ...` |
| `// TODO: handle DST` | A failing test, or an issue |
| `// this is needed because Safari...` | The commit message, and a test that fails without it |
| A block explaining an algorithm | A function per step, named for what it does |

## No suppression comments, ever

`eslint-disable`, `svelte-ignore`, `@ts-ignore`, `@ts-expect-error` are banned in `src/`. A rule firing is either a real finding (fix the code) or wrong for a whole module (put the exception in `eslint.config.js`, where it is reviewable and counted).

## Naming

- Name for what a thing **is** or **does**, not how it is implemented: `visibleRange` not `computedRangeResult`, `placeEvents` not `runLayoutAlgo`.
- Booleans read as predicates: `isAllDay`, `hasOverlap`, `canResize`.
- Functions that return a value are nouns or `get*`/`to*`; functions that do something are verbs.
- No abbreviations that are not universal: `event`, not `evt`; `resource`, not `res`. `id`, `min`, `max`, `dx`, `dy` are fine.
- File names describe the module: `overlap.ts` holds the overlap solver, `scale.ts` holds `TimeScale`.
- **Never name a local `state`, `props`, `derived` or `effect` in a `.svelte` or `.svelte.ts` file.** `state` shadows the `$state` rune and Svelte then reads every `$state(...)` in that file as a store auto-subscription - the error talks about `subscribe`, not shadowing, so it reads as nonsense. This has cost hours in sibling repos. Name it for what it is: `dragState`, `selection`, `layout`.

## Functions

- One level of abstraction per function. If a function both decides and does, split it.
- `max-params: 4` - beyond that, pass an options object with a named type.
- `complexity: 10` - a function that trips it is two functions.
- Early return over nested `if`.
- Pure by default. Anything in `core/` takes data and returns data: no DOM, no `window`, no `Date.now()` (take `now` as an argument), no reads of module-level mutable state. Purity is what makes it testable in the `node` Vitest project.
- No default exports except Svelte components.

## Types over runtime checks

- Encode invariants in types: `DateRange` with `start < end` established at construction, not checked at every call site.
- Discriminated unions over optional-field soup: `{ kind: 'create'; before: null; after: Event }` not `{ before?: Event; after?: Event }`.
- No `as` casts except at a serialisation boundary; a cast is a missing type.
- No `any`, no `unknown` in public types (see `sv5ui-conventions`).

## Reactivity hygiene

- Never write reactive state from inside a `$derived` or a pure transform. Collect, then apply in `queueMicrotask` if it truly must happen.
- A pure-logic module that a `.svelte.ts` file needs lives in its own plain `.ts` - `svelte/prefer-svelte-reactivity` rejects a bare `Map` / `Set` inside a runes file even when it is only ever replaced wholesale under `$state.raw`, and suppression comments are banned.

## Tests are part of the code

- Pure logic: `*.spec.ts` colocated next to the module, runs in node. Compare returned values (coordinates, ranges, ids) - never DOM snapshots.
- Components: `*.svelte.spec.ts`, runs in chromium. Assert behaviour the user can observe.
- `expect: { requireAssertions: true }` is on: a test without an assertion fails.
- A bug fix ships with the test that would have caught it.

## Definition of done

```bash
pnpm check   # 0 errors, 0 warnings
pnpm lint
pnpm test
```

All three green, every temporary probe deleted, only intended files touched.
