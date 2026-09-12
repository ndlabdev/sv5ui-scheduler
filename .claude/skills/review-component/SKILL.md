---
name: review-component
description: Review and optimise a scheduler component or core module. Checks structure, reactivity, type safety, variants, bugs, accessibility, export hygiene and the no-comments rule, then reports findings by severity.
argument-hint: <ComponentName | core/path>
user-invocable: true
---

# Review Component

Perform a full review of one component (`Scheduler`, `WeekView`, `EventChip`, ...) or one core module (`core/layout/overlap.ts`, `core/store/event-store.svelte.ts`).

## 1. Gather all files

For a component read every file in `src/lib/components/<Component>/`:

```
<Component>.svelte
<component>.types.ts
<component>.variants.ts
<Component>.svelte.spec.ts
index.ts
```

For a core module read the module, its colocated `*.spec.ts`, and every importer (`grep -rn "from './<name>.js'" src/lib`).

Also read for context: `src/lib/scheduler.types.ts`, `src/lib/index.ts`, and the `scheduler-architecture` skill.

## 2. Checklist

### A. Structure

- [ ] Five files present for a component; spec colocated for a core module
- [ ] Slot structure is clear (`root`, `header`, `body`, ...) and consistent with sibling components
- [ ] `{...restProps}` spread before explicit attributes on the root
- [ ] Snippets rendered with `{@render}`; no duplicated markup between branches
- [ ] No comments outside `*.types.ts`; every public option in `*.types.ts` has JSDoc with `@default`
- [ ] No suppression comments (`eslint-disable`, `svelte-ignore`, `@ts-ignore`, `@ts-expect-error`)

### B. Reactivity

- [ ] `$derived` for one-liners, `$derived.by` only for multi-statement bodies
- [ ] `$state` only for truly mutable local state, never a mirrored prop
- [ ] `$state.raw` for collections replaced wholesale
- [ ] No `$effect` where a `$derived` would do; no writes to reactive state from inside a derived
- [ ] Variants computed once in a `$derived.by`, not in the template
- [ ] Module-level constants computed at import time, not per instance
- [ ] No local named `state`, `props`, `derived`, `effect`

### C. Types

- [ ] No `any`, `unknown`, `Record<string, unknown>` in public types (generic `T = unknown` for user payload is the one exception)
- [ ] `Omit<HTMLAttributes<...>, 'class'>` plus omits for any redefined prop
- [ ] `Pick<...>` over broad attribute intersections
- [ ] `NonNullable<VariantProps['x']>` for variant props
- [ ] `ui?: Partial<Record<Slots, ClassNameValue>>`, `class?: ClassNameValue`, `ref?: HTMLElement | null`
- [ ] Time fields are `ZonedDateTime`, never `Date` or `string`, past the boundary
- [ ] No `as` casts outside a serialisation boundary

### D. Props and defaults

- [ ] `ref = $bindable(null)` bound via `bind:this={ref}`
- [ ] Defaults from `config.defaultVariants`
- [ ] Two-way props use `$bindable()`
- [ ] `...restProps` last in the destructure

### E. Variants and tokens

- [ ] All classes through `tv()` slots; no loose class strings in markup
- [ ] Material 3 tokens only - grep for `-(red|blue|green|gray|slate|zinc|neutral|stone)-\d` and `#[0-9a-f]{3,6}`
- [ ] `compoundVariants` for colour x variant combinations
- [ ] `<component>Defaults` exported with `{ defaultVariants, slots }`

### F. Bugs

- [ ] Every variant prop is actually passed to the variant function
- [ ] Spread order cannot override critical handlers (`onclick`, `onpointerdown`)
- [ ] Context values are reactive (getter or `$state` object), and `getContext` absence is handled
- [ ] `x !== undefined` rather than a falsy check where `0` or `''` is valid
- [ ] Range boundaries: end-exclusive everywhere; an event ending exactly at range start is not in the range
- [ ] DST: any arithmetic on hours has a golden-table test

### G. Purity (core modules)

- [ ] No `window`, `document`, `Date.now()`, `Math.random()` - inputs are parameters
- [ ] Returns new values; never mutates its arguments
- [ ] Tested in the node project by comparing returned values

### H. Accessibility

- [ ] Correct `role` on grid, row, gridcell, button
- [ ] `aria-label` on every icon-only control; `aria-selected`, `aria-current` where they apply
- [ ] Every pointer interaction has a keyboard equivalent
- [ ] Focus is managed on open/close and after a drag ends or is cancelled

### I. Exports

- [ ] `index.ts` exports the component and user-facing types only
- [ ] Nothing from `core/layout/` and no concrete layout strategy reachable from `src/lib/index.ts`
- [ ] `export type { }` for type re-exports

## 3. Output

```
## <Name> Review

### Bugs
1. **[Critical|Medium|Low]** finding - file:line

### Reactivity
### Types
### Accessibility
### Exports
### Clean code

### Verdict
Clean | Has issues
Action items: numbered
```

Skip empty categories. Lead with the problem, not the explanation. Prove every runtime finding with a probe before calling it a bug; if it does not reproduce, say so and withdraw it.
