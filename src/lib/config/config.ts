import type { ComponentDefaults, SchedulerConfig } from './config.types.js'

export type { ComponentDefaults, SchedulerConfig } from './config.types.js'

let config: SchedulerConfig = {}
let resolved = new Map<string, ComponentDefaults>()

export function defineSchedulerConfig(next: SchedulerConfig): void {
    config = next
    resolved = new Map()
}

export function resetSchedulerConfig(): void {
    defineSchedulerConfig({})
}

export function getComponentConfig<T extends ComponentDefaults>(name: string, defaults: T): T {
    const cached = resolved.get(name)
    if (cached) return cached as T
    const overrides = config[name]
    const merged: T = overrides
        ? {
              ...defaults,
              defaultVariants: { ...defaults.defaultVariants, ...overrides.defaultVariants },
              slots: { ...defaults.slots, ...overrides.slots }
          }
        : defaults
    resolved.set(name, merged)
    return merged
}
