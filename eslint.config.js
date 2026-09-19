import prettier from 'eslint-config-prettier'
import path from 'node:path'
import js from '@eslint/js'
import svelte from 'eslint-plugin-svelte'
import { defineConfig, includeIgnoreFile } from 'eslint/config'
import globals from 'globals'
import ts from 'typescript-eslint'

const gitignorePath = path.resolve(import.meta.dirname, '.gitignore')

const OUTSIDE_LIB = ['tests', 'routes']
const ABOVE_CORE = ['dom', 'interactions', 'components', 'config']

function layer(files, forbidden, extra = []) {
    return {
        files: [files],
        ignores: ['**/*.spec.ts'],
        rules: {
            'no-restricted-imports': [
                'error',
                {
                    patterns: [
                        {
                            regex: `(^|/)(${[...forbidden, ...OUTSIDE_LIB].join('|')})/`,
                            message: 'This import breaks the layer order described in CLAUDE.md.'
                        },
                        ...extra
                    ]
                }
            ]
        }
    }
}

const layers = [
    layer(
        'src/lib/types/**',
        [],
        [{ regex: '^\\.\\./', message: 'Type files only import other type files.' }]
    ),
    layer('src/lib/locales/**', ['core', 'config', 'dom', 'interactions', 'components']),
    layer('src/lib/config/**', ['core', 'locales', 'dom', 'interactions', 'components']),
    layer('src/lib/dom/**', ['core', 'locales', 'config', 'interactions', 'components']),
    layer('src/lib/core/*.ts', [...ABOVE_CORE, 'locales']),
    layer('src/lib/core/utils/**', [
        'time',
        'recurrence',
        'store',
        'layout',
        'a11y',
        'i18n',
        'registry',
        ...ABOVE_CORE,
        'locales'
    ]),
    layer('src/lib/core/time/**', [
        'recurrence',
        'store',
        'layout',
        'a11y',
        'i18n',
        'registry',
        ...ABOVE_CORE,
        'locales'
    ]),
    layer('src/lib/core/recurrence/**', [
        'store',
        'layout',
        'a11y',
        'i18n',
        'registry',
        ...ABOVE_CORE,
        'locales'
    ]),
    layer('src/lib/core/store/**', [
        'layout',
        'a11y',
        'i18n',
        'registry',
        ...ABOVE_CORE,
        'locales'
    ]),
    layer('src/lib/core/layout/**', [
        'store',
        'a11y',
        'i18n',
        'registry',
        ...ABOVE_CORE,
        'locales'
    ]),
    layer('src/lib/core/a11y/**', [
        'store',
        'layout',
        'i18n',
        'registry',
        ...ABOVE_CORE,
        'locales'
    ]),
    layer('src/lib/core/i18n/**', ['store', 'layout', 'a11y', 'registry', ...ABOVE_CORE]),
    layer('src/lib/core/registry/**', [...ABOVE_CORE, 'locales']),
    layer('src/lib/interactions/*.ts', ['components', 'config', 'locales']),
    layer('src/lib/interactions/engine/**', ['plugins', 'components', 'config', 'locales']),
    layer('src/lib/interactions/plugins/**', ['components', 'config', 'locales']),
    layer('src/lib/components/shared/**', [
        'event',
        'views',
        'sidebar',
        'Scheduler',
        'state',
        'parts'
    ]),
    layer('src/lib/components/event/**', ['views', 'sidebar', 'Scheduler', 'state', 'parts']),
    layer('src/lib/components/views/**', ['sidebar', 'Scheduler', 'state', 'parts']),
    layer('src/lib/components/sidebar/**', ['views', 'Scheduler', 'state', 'parts']),
    layer('src/lib/components/Scheduler/**', [])
]

export default defineConfig(
    includeIgnoreFile(gitignorePath),
    js.configs.recommended,
    ts.configs.recommended,
    svelte.configs.recommended,
    prettier,
    svelte.configs.prettier,
    {
        languageOptions: { globals: { ...globals.browser, ...globals.node } },
        rules: {
            'no-undef': 'off',
            semi: ['error', 'never'],
            indent: 'off',
            quotes: ['error', 'single', { avoidEscape: true }],
            'comma-dangle': ['error', 'never'],
            eqeqeq: ['error', 'always'],
            'no-console': 'warn',
            'no-unused-vars': 'off',
            'quote-props': ['error', 'as-needed'],
            'max-params': ['warn', 4],
            complexity: ['warn', 10]
        }
    },
    {
        files: ['src/lib/core/utils/dev.ts'],
        rules: {
            'no-console': 'off'
        }
    },
    ...layers,
    {
        files: ['**/*.svelte', '**/*.svelte.ts', '**/*.svelte.js'],
        languageOptions: {
            parserOptions: {
                projectService: true,
                extraFileExtensions: ['.svelte'],
                parser: ts.parser
            }
        }
    }
)
