import type { InteractionPlugin } from '../../types/interaction.types.js'
import type { LayoutStrategy } from '../../types/layout.types.js'
import type { ViewDefinition } from '../../types/view.types.js'
import { builtinLayouts } from '../layout/strategies.js'

export interface RegistryOptions<T = unknown> {
    views: readonly ViewDefinition<T>[]
    layouts?: readonly LayoutStrategy[]
    interactions?: readonly InteractionPlugin<T>[]
}

export interface Registry<T = unknown> {
    readonly views: readonly ViewDefinition<T>[]
    readonly interactions: readonly InteractionPlugin<T>[]
    view(name: string): ViewDefinition<T>
    layout(name: string): LayoutStrategy
    hasView(name: string): boolean
}

export function createRegistry<T>(options: RegistryOptions<T>): Registry<T> {
    const views = byName(options.views)
    const layouts = byName([...builtinLayouts, ...(options.layouts ?? [])])
    const interactions = [...byName(options.interactions ?? []).values()]

    return {
        views: [...views.values()],
        interactions,
        view(name) {
            const definition = views.get(name)
            if (!definition) throw new Error(`Unknown view "${name}". Known: ${keys(views)}`)
            return definition
        },
        layout(name) {
            const strategy = layouts.get(name)
            if (!strategy) throw new Error(`Unknown layout "${name}". Known: ${keys(layouts)}`)
            return strategy
        },
        hasView(name) {
            return views.has(name)
        }
    }
}

function byName<T extends { name: string }>(items: readonly T[]): Map<string, T> {
    const map = new Map<string, T>()
    for (const item of items) map.set(item.name, item)
    return map
}

function keys(map: Map<string, unknown>): string {
    return [...map.keys()].join(', ')
}
