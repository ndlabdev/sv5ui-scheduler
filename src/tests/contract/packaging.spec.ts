import { readFileSync, readdirSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { compile, preprocess } from 'svelte/compiler'
import { describe, expect, it } from 'vitest'
import config from '../../../svelte.config.js'

const COMPONENTS = readdirSync('src/lib', { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.svelte'))
    .map((file) => join('src/lib', file))

async function packaged(file: string): Promise<string> {
    const { code } = await preprocess(readFileSync(file, 'utf8'), config.preprocess ?? [], {
        filename: file
    })
    return code.replaceAll(' lang="ts"', '')
}

describe('the published components', () => {
    it('finds the components', () => {
        expect(COMPONENTS.length).toBeGreaterThan(20)
    })

    it.each(COMPONENTS)('%s compiles as plain JavaScript once packaged', async (file) => {
        const source = await packaged(file)
        expect(() => compile(source, { filename: file, generate: 'client' })).not.toThrow()
    })
})

describe('the svelte peer range', () => {
    const floor = (range: string) => range.replace(/^\^/, '').split('.').map(Number)
    const manifest = JSON.parse(readFileSync('package.json', 'utf8'))
    const sv5ui = realpathSync('node_modules/sv5ui')
    const bits = JSON.parse(readFileSync(join(dirname(sv5ui), 'bits-ui/package.json'), 'utf8'))

    it('starts no lower than the UI primitives it renders through', () => {
        const [major, minor] = floor(manifest.peerDependencies.svelte)
        const [neededMajor, neededMinor] = floor(bits.peerDependencies.svelte)
        expect(major).toBe(neededMajor)
        expect(minor).toBeGreaterThanOrEqual(neededMinor)
    })
})
