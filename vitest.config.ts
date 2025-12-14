import path from 'node:path'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = path.resolve(__dirname, './')

export default defineVitestConfig({
    root: rootDir,
    resolve: {
        alias: {
            '@': rootDir,
        },
    },
    test: {
        globals: true,
        environment: 'nuxt',
        setupFiles: ['tests/setup/vitest.setup.ts'],
        include: ['tests/**/*.spec.ts', 'tests/**/*.test.ts'],
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**'],
        server: {
            deps: {
                inline: ['primevue'],
            },
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                '**/node_modules/**',
                '**/dist/**',
                '**/.nuxt/**',
                '**/*.d.ts',
                '**/*.config.ts',
                'tests/**',
                'coverage/**',
                'public/**',
                'assets/**',
                'scripts/**',
                'virtual:**',
                '**/*.mjs',
                '.output/**',
                '.vercel/**',
                '.vitepress/**',
            ],
        },
    },
})
