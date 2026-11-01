import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { sveltekit } from '@sveltejs/kit/vite'

export default defineConfig({
    plugins: [tailwindcss(), sveltekit()],
    test: {
        expect: { requireAssertions: true },
        projects: [
            {
                extends: './vite.config.ts',
                test: {
                    name: 'client',
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [
                            {
                                browser: 'chromium',
                                headless: true,
                                viewport: { width: 1280, height: 900 }
                            }
                        ]
                    },
                    include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
                    exclude: ['src/lib/server/**'],
                    setupFiles: ['src/tests/setup.browser.ts'],
                    provide: { performanceScale: process.env.CI ? 2 : 1 }
                }
            },

            {
                extends: './vite.config.ts',
                test: {
                    name: 'server',
                    environment: 'node',
                    include: ['src/**/*.{test,spec}.{js,ts}'],
                    exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
                }
            }
        ]
    }
})
