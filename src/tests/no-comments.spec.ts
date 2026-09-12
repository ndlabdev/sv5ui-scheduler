import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROOT = 'src'
const SELF = join('src', 'tests', 'no-comments.spec.ts')
const SOURCE = /\.(ts|svelte)$/
const DOCUMENTED = /\.types\.ts$/
const STRINGS = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`/g
const LINE_COMMENT = /(^|[^:])\/\/.*/m
const BLOCK_COMMENT = /\/\*[\s\S]*?\*\//
const HTML_COMMENT = /<!--[\s\S]*?-->/
const EXPORTED_DECLARATION = /^export\s+(?:interface|type|const|function|class|enum)\s+(\w+)/gm
const DOC_BEFORE = /\*\/\s*\n\s*$/

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? walk(path) : SOURCE.test(name) ? [path] : []
    })
}

const files = walk(ROOT)
const plain = files.filter((file) => !DOCUMENTED.test(file) && file !== SELF)
const documented = files.filter((file) => DOCUMENTED.test(file))

describe('no comments outside *.types.ts', () => {
    it.each(plain)('%s', (file) => {
        const source = readFileSync(file, 'utf8').replace(STRINGS, "''")
        expect(source).not.toMatch(LINE_COMMENT)
        expect(source).not.toMatch(BLOCK_COMMENT)
        expect(source).not.toMatch(HTML_COMMENT)
    })
})

describe('every export in *.types.ts carries JSDoc', () => {
    it.each(documented)('%s', (file) => {
        const source = readFileSync(file, 'utf8')
        const undocumented: string[] = []
        for (const match of source.matchAll(EXPORTED_DECLARATION)) {
            const before = source.slice(0, match.index)
            if (!DOC_BEFORE.test(before)) undocumented.push(match[1])
        }
        expect(undocumented).toEqual([])
    })
})
