import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const ROUTES = join('src', 'routes')
const SCRIPT = /<script[\s\S]*?<\/script>/g

function walk(dir: string): string[] {
    return readdirSync(dir).flatMap((name) => {
        const path = join(dir, name)
        return statSync(path).isDirectory() ? walk(path) : name.endsWith('.svelte') ? [path] : []
    })
}

function schedulerTags(markup: string): string[] {
    const tags: string[] = []
    let from = markup.indexOf('<Scheduler')
    while (from !== -1) {
        let depth = 0
        let end = from
        for (; end < markup.length; end += 1) {
            const char = markup[end]
            if (char === '{') depth += 1
            if (char === '}') depth -= 1
            if (char === '>' && depth === 0) break
        }
        tags.push(markup.slice(from, end + 1))
        from = markup.indexOf('<Scheduler', end)
    }
    return tags
}

const pages = walk(ROUTES).map((file) => ({
    file,
    markup: readFileSync(file, 'utf8').replace(SCRIPT, '')
}))

describe('demo pages never create events from the calendar', () => {
    it('finds the demo schedulers', () => {
        expect(pages.flatMap((page) => schedulerTags(page.markup)).length).toBeGreaterThan(10)
    })

    it.each(pages.map((page) => [page.file, page.markup] as const))(
        '%s turns creation off on every scheduler and shows no new event control',
        (_, markup) => {
            for (const tag of schedulerTags(markup)) {
                expect(tag).toContain('creatable={false}')
            }
            expect(markup).not.toMatch(/new event/i)
        }
    )
})
