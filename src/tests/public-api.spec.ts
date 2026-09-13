import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = 'src/lib/index.ts'

const AREAS = [
    './types/index.js',
    './core/index.js',
    './components/index.js',
    './interactions/index.js'
]

const PUBLIC_TYPES = [
    'BusinessHours',
    'EventChipProps',
    'PartialLabels',
    'SchedulerConfig',
    'SchedulerProps',
    'CellSnippetProps',
    'ConflictResolution',
    'DateInput',
    'DateNavigatorProps',
    'DateRange',
    'DragSourceData',
    'EventColor',
    'EventDetailSnippetProps',
    'EventInput',
    'EventPatch',
    'EventSnippetProps',
    'EventSource',
    'EventSourceFn',
    'GridFocus',
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
    'SidebarSnippetProps',
    'SpanPosition',
    'StoreMiddleware',
    'TimePosition',
    'TimeScale',
    'TimeScaleOptions',
    'TimeZoneId',
    'ViewDefinition',
    'ViewPreview',
    'ViewProps',
    'ViewSnippets',
    'WeekDay'
]

const PUBLIC_VALUES = [
    'AgendaView',
    'DateNavigator',
    'DayView',
    'EventChip',
    'MonthView',
    'Scheduler',
    'WeekView',
    'YearView',
    'createTimeScale',
    'defaultLabels',
    'defineSchedulerConfig',
    'dragSource',
    'mergeLabels',
    'resetSchedulerConfig'
]

const LOCALES_ENTRY = 'src/lib/locales.ts'
const PUBLIC_LOCALES = ['en', 'vi']

const STAR_EXPORT = /export\s+\*\s+from\s+'([^']+)'/g
const NAMED_EXPORT = /export\s+(type\s+)?\{([^}]*)\}/g

function read(path: string): string {
    return readFileSync(path.replace(/\.js$/, '.ts'), 'utf8')
}

function starTargets(source: string): string[] {
    return [...source.matchAll(STAR_EXPORT)].map(([, target]) => target)
}

function namedExports(source: string): { types: string[]; values: string[] } {
    const types: string[] = []
    const values: string[] = []
    for (const [, typeOnly, body] of source.matchAll(NAMED_EXPORT)) {
        for (const raw of body.split(',')) {
            const entry = raw.trim()
            const inlineType = entry.startsWith('type ')
            const name = entry
                .replace(/^type\s+/, '')
                .replace(/^default as\s+/, '')
                .split(/\s+as\s+/)
                .pop()
            if (!name) continue
            ;(typeOnly || inlineType ? types : values).push(name)
        }
    }
    return { types, values }
}

describe('root entry', () => {
    const source = read(ROOT)

    it('joins the area barrels and the config module only', () => {
        expect(starTargets(source)).toEqual(AREAS)
        expect(namedExports(source)).toEqual({
            types: ['SchedulerConfig'],
            values: ['defineSchedulerConfig', 'resetSchedulerConfig']
        })
    })
})

describe('locales entry', () => {
    it('exports exactly the agreed locales by name', () => {
        const source = read(LOCALES_ENTRY)
        expect(starTargets(source)).toEqual([])
        expect(namedExports(source).values.sort()).toEqual(PUBLIC_LOCALES)
    })
})

describe('area barrels', () => {
    const barrels = AREAS.map((area) => join(dirname(ROOT), area))

    it.each(barrels)('%s lists every export by name', (barrel) => {
        expect(starTargets(read(barrel))).toEqual([])
    })

    const collected = [...barrels.map((barrel) => read(barrel)), read(ROOT)].map(namedExports)
    const types = collected.flatMap((entry) => entry.types).sort()
    const values = collected.flatMap((entry) => entry.values).sort()

    it('export exactly the agreed types', () => {
        expect(types).toEqual([...PUBLIC_TYPES].sort())
    })

    it('export exactly the agreed values', () => {
        expect(values).toEqual([...PUBLIC_VALUES].sort())
    })

    it('never export the same name twice', () => {
        const all = [...types, ...values]
        expect(new Set(all).size).toBe(all.length)
    })
})
