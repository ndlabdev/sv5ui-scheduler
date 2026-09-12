import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const ENTRY = 'src/lib/index.ts'

const PUBLIC_TYPES = [
    'BusinessHours',
    'CellSnippetProps',
    'ConflictResolution',
    'DateInput',
    'DateRange',
    'EventColor',
    'EventInput',
    'EventPatch',
    'EventSnippetProps',
    'EventSource',
    'EventSourceFn',
    'HeaderSnippetProps',
    'HitTarget',
    'Holiday',
    'InteractionContext',
    'InteractionPlugin',
    'InteractionPreview',
    'LayoutContext',
    'LayoutStrategy',
    'LoadContext',
    'Mutation',
    'MutationHandlers',
    'MutationKind',
    'MutationResult',
    'OrdinalWeekDay',
    'PositionedEvent',
    'RecurrenceFrequency',
    'RecurrenceRule',
    'RecurrenceRuleInput',
    'SchedulerContext',
    'SchedulerEvent',
    'SchedulerLabels',
    'SchedulerResource',
    'SpanPosition',
    'StoreMiddleware',
    'StorePatch',
    'TimePosition',
    'TimeScale',
    'TimeZoneId',
    'ViewDefinition',
    'ViewProps',
    'ViewSnippets',
    'WeekDay'
]

const PUBLIC_VALUES: string[] = []

const NAMED_EXPORT = /export\s+(type\s+)?\{([^}]*)\}/g

function exportedNames(source: string): { types: string[]; values: string[] } {
    const types: string[] = []
    const values: string[] = []
    for (const [, typeOnly, body] of source.matchAll(NAMED_EXPORT)) {
        for (const raw of body.split(',')) {
            const name = raw
                .trim()
                .replace(/^default as\s+/, '')
                .split(/\s+as\s+/)
                .pop()
            if (!name) continue
            ;(typeOnly ? types : values).push(name)
        }
    }
    return { types: types.sort(), values: values.sort() }
}

describe('public api', () => {
    const source = readFileSync(ENTRY, 'utf8')
    const names = exportedNames(source)

    it('exports exactly the agreed types', () => {
        expect(names.types).toEqual([...PUBLIC_TYPES].sort())
    })

    it('exports exactly the agreed values', () => {
        expect(names.values).toEqual([...PUBLIC_VALUES].sort())
    })

    it('never re-exports with a star', () => {
        expect(source).not.toMatch(/export\s+\*/)
    })
})
