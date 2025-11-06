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
    },
})
