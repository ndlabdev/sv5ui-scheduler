/**
 * What a component contributes to the config system: its default variant
 * values and the classes appended to each of its slots.
 */
export interface ComponentDefaults {
    defaultVariants: Record<string, string | number | boolean | undefined>
    slots: Record<string, string>
}

/**
 * Recursive partial, so an override may name only the keys it changes.
 */
export type DeepPartial<T> = {
    [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

/**
 * Per-component overrides for the scheduler, keyed by component name in
 * camelCase (`scheduler`, `eventChip`, `weekView`). Each entry may replace
 * default variant values and add classes to named slots.
 */
export type SchedulerConfig = Record<string, DeepPartial<ComponentDefaults> | undefined>
