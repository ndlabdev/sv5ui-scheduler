---
name: sv5ui-conventions
description: Code conventions inherited from sv5ui: file layout per component, tailwind-variants with slots, Material 3 tokens only, public type rules, the config/defaults pattern, and the export policy. Use when creating or editing any component, variants file, types file or index barrel.
user-invocable: true
---

# sv5ui Conventions

This package is a sibling of `sv5ui` and follows its conventions exactly. When unsure, open `../../sv5ui/src/lib/components/Button/` and copy the shape.

## Formatting

Prettier: 4 spaces, no tabs, single quotes, no semicolons, no trailing commas, print width 100. ESLint adds `eqeqeq: always`, `quote-props: as-needed`, `max-params: 4`, `complexity: 10`, `no-console: warn`.

## Component file layout

Every component lives in `src/lib/components/<Component>/` with exactly these files:

```
<Component>.svelte              component: imports types + variants, no inline types
<component>.types.ts            public Props type, the only file allowed to have comments
<component>.variants.ts         tv() definition + <component>Defaults for the config system
<Component>.svelte.spec.ts      browser tests (vitest-browser-svelte)
index.ts                        exports the component + user-facing types only
```

Component files are PascalCase; types/variants files are kebab-case. Runes-holding modules end in `.svelte.ts`.

## Component skeleton

```svelte
<script lang="ts" module>
    import type { EventChipProps } from './event-chip.types.js'

    export type Props = EventChipProps
</script>

<script lang="ts">
    import { eventChipVariants, eventChipDefaults } from './event-chip.variants.js'
    import { getComponentConfig } from '../../config.js'

    const config = getComponentConfig('eventChip', eventChipDefaults)

    let {
        ref = $bindable(null),
        ui,
        color = config.defaultVariants.color,
        size = config.defaultVariants.size,
        children,
        class: className,
        ...restProps
    }: Props = $props()

    const classes = $derived.by(() => {
        const slots = eventChipVariants({ color, size })
        return {
            root: slots.root({ class: [config.slots.root, className, ui?.root] }),
            title: slots.title({ class: [config.slots.title, ui?.title] })
        }
    })
</script>

<div bind:this={ref} {...restProps} class={classes.root}>
    <span class={classes.title}>{@render children?.()}</span>
</div>
```

Rules encoded above:

- `ref = $bindable(null)` bound with `bind:this={ref}` on the root element
- `{...restProps}` spread **before** explicit attributes on the root, so explicit attributes win
- Defaults come from `config.defaultVariants`, never hardcoded in the destructure
- Variants are computed **once** in a `$derived.by`, never inline in the template
- `class` is renamed to `className` and merged into the root slot; `ui` overrides per slot

## Variants file

```ts
import { tv, type VariantProps } from 'tailwind-variants'

export const eventChipVariants = tv({
    slots: {
        root: 'flex items-center gap-1 rounded px-1 text-xs',
        title: 'truncate'
    },
    variants: {
        color: {
            primary: { root: 'bg-primary text-on-primary' },
            surface: { root: 'bg-surface-container text-on-surface' }
        },
        size: {
            sm: { root: 'h-5' },
            md: { root: 'h-6' }
        }
    },
    compoundVariants: [],
    defaultVariants: { color: 'primary', size: 'md' }
})

export type EventChipVariantProps = VariantProps<typeof eventChipVariants>
export type EventChipSlots = keyof ReturnType<typeof eventChipVariants>

export const eventChipDefaults = {
    defaultVariants: eventChipVariants.defaultVariants,
    slots: {} as Partial<Record<EventChipSlots, string>>
}
```

- Every class goes through `tv()` slots. No loose class strings in markup.
- `compoundVariants` for color x variant combinations, not inline conditionals.
- Slot names are consistent across components: `root`, `header`, `body`, `footer`, `icon`, `label`.

## Colour tokens: Material 3 only

Use only sv5ui theme tokens. Never a Tailwind palette colour (`bg-blue-500`), never a hex value.

| Purpose          | Tokens                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| Surfaces         | `surface`, `surface-dim`, `surface-bright`, `surface-container-{lowest,low,,high,highest}` |
| Text on surfaces | `on-surface`, `on-surface-variant`                                                         |
| Accents          | `primary`, `secondary`, `tertiary` + `on-*` and `*-container` / `on-*-container`           |
| Status           | `success`, `warning`, `error`, `info` + the same `on-*` / `*-container` forms              |
| Borders          | `outline`, `outline-variant`                                                               |
| Inverse          | `inverse-surface`, `inverse-on-surface`, `inverse-primary`                                 |

Dark mode and theming then work without any extra code.

## Types file rules

```ts
import type { Snippet } from 'svelte'
import type { HTMLAttributes } from 'svelte/elements'
import type { ClassNameValue } from 'tailwind-merge'
import type { EventChipVariantProps, EventChipSlots } from './event-chip.variants.js'

export type EventChipProps = Omit<HTMLAttributes<HTMLDivElement>, 'class' | 'color'> & {
    /**
     * Bindable reference to the root DOM element.
     */
    ref?: HTMLElement | null

    /**
     * Controls the colour of the chip.
     * @default 'primary'
     */
    color?: NonNullable<EventChipVariantProps['color']>

    /**
     * Per-slot class overrides.
     */
    ui?: Partial<Record<EventChipSlots, ClassNameValue>>

    class?: ClassNameValue
    children?: Snippet
}
```

- `Omit<HTMLAttributes<...>, 'class'>` - never raw `HTMLAttributes`, because `class` conflicts with `ClassNameValue`. Also omit any prop the component redefines (`title`, `color`, `children`).
- Extending several HTML attribute sets: surgical `Pick<HTMLButtonAttributes, 'name' | 'form'>`, never a broad `HTMLButtonAttributes & HTMLAnchorAttributes` intersection (it conflicts on `type`, `href`, handlers).
- Variant props typed as `NonNullable<XVariantProps['key']>`.
- **No `any`, `unknown`, `Record<string, unknown>` or `{ [key: string]: unknown }` in public types.** The one accepted `unknown` is a generic default like `SchedulerEvent<T = unknown>` for a user payload the library never reads.
- Every public option carries a JSDoc block; `@default` is mandatory whenever a default exists. This is documentation the app sees as tooltips, not commentary.

## Exports

- `index.ts` per component exports the component and user-facing types only: `Props`, and public `Size` / `Color` / `Variant` aliases. Never `Slots`, `Defaults` or `VariantProps`.
- Type re-exports use `export type { }`.
- `src/lib/index.ts` is the semver contract: an explicit named list, never `export *`. Adding an export later is free; removing one is a breaking change. When in doubt, leave it out.
- Inside the library import modules directly (`../../core/time/range.js`), not through a barrel. Barrels define contracts at boundaries; using them internally is how import cycles start.

## Imports

- Relative imports carry the `.js` extension even for `.ts` sources: `import type { X } from './x.types.js'`.
- Type-only imports use `import type`.

## Runes patterns (sv5ui house style)

- `$derived` for one-expression derivations; `$derived.by` only when the body needs statements.
- `$state` only for genuinely mutable local state - never mirror a prop into `$state`.
- `$state.raw` for arrays, maps and large collections that are replaced wholesale.
- `$effect` only for real side effects (DOM measurement, subscriptions, timers). If it computes a value, it should be `$derived`.
- `$bindable()` for two-way props (`open`, `value`, `events`, `view`).
- Context values must be reactive: pass a getter (`get count() { return count }`) or the `$state` object itself, never a snapshot.
- Class-based state in `*.svelte.ts`: `#private` fields, arrow-function methods when the method is handed out as a callback.

## Reuse sv5ui first, always

`sv5ui` is the parent library and a peer dependency of this package. Anything sv5ui already provides is imported from `'sv5ui'`, never rebuilt here. Writing a second Button, Popover or drag hook is a defect, not a style choice. Check `../../sv5ui/src/lib/components/` and `../../sv5ui/src/lib/hooks/` before creating any file.

What the scheduler takes from sv5ui:

| Need                                 | Use                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| Toolbar buttons, today, prev, next   | `Button`, `Icon`, `Kbd`                                                              |
| View switcher                        | `ToggleGroup` or `SelectMenu`                                                        |
| Date navigator (mini calendar)       | `Calendar`                                                                           |
| Date and time pickers in event forms | `DatePicker`, `DateRangePicker`, `TimeField`                                         |
| Event details on click               | `Popover`                                                                            |
| Event editor                         | `Modal` or `Slideover`, `Form`, `FormField`, `Input`, `Textarea`, `Select`, `Switch` |
| Right click on an event or cell      | `ContextMenu`                                                                        |
| Overflow and actions                 | `DropdownMenu`                                                                       |
| Hover details                        | `Tooltip`                                                                            |
| Event tags and status                | `Chip`, `Badge`                                                                      |
| Loading states                       | `Skeleton`, `Progress`                                                               |
| Empty agenda                         | `Empty`                                                                              |
| Scrollable time grid                 | `ScrollArea`                                                                         |
| Notifications after a mutation       | `Toast`                                                                              |
| Resource or attendee display         | `Avatar`, `AvatarGroup`, `User`                                                      |
| Keyboard listing in help             | `Kbd`                                                                                |

Hooks:

| Need                                      | Use                                                                |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Drag to create, move, resize              | `usePointerDrag` (throttled per frame, pointer capture, axis lock) |
| Escape cancels a drag or closes a popover | `useEscapeKeydown`                                                 |
| Global listeners with cleanup             | `useEventListener`                                                 |
| Click outside a popover                   | `useClickOutside`                                                  |
| Focus inside an open editor               | `useFocusTrap`                                                     |
| Grid resizes                              | `useResizeObserver`                                                |
| Lazy loading agenda                       | `useIntersectionObserver`, `useInfiniteScroll`                     |
| Search and filter input                   | `useDebounce`, `useDebouncedState`, `useThrottle`                  |
| Current time line tick                    | `useTimers`                                                        |
| Narrow screens                            | `useMediaQuery`                                                    |
| Persist last view                         | `useLocalStorage`                                                  |
| Lock body scroll under a modal            | `useScrollLock`                                                    |
| Copy event link                           | `useClipboard`                                                     |

Only build a component here when it is scheduler-specific and has no sv5ui counterpart: the four views, `EventChip`, the time gutter, the current time indicator, the drag ghost. Even those are composed from sv5ui parts and sv5ui tokens.

sv5ui exports `defineConfig` and `UIConfig` but not its internal `getComponentConfig`. The scheduler keeps its own `getComponentConfig` for scheduler components, following the same `{ defaultVariants, slots }` shape so the two config systems read identically to an app.
