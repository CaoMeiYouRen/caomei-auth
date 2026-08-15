import path from 'node:path'
import { defineVitestConfig } from '@nuxt/test-utils/config'

const rootDir = path.resolve(import.meta.dirname, './')

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
        exclude: ['**/node_modules/**', '**/.nuxt/**', '**/dist/**', 'tests/e2e/**'],
        // Nuxt 测试环境（@nuxt/test-utils 4.x setupNuxt）首次构建 nitro 较慢，放宽 vitest 默认超时
        hookTimeout: 120000,
        testTimeout: 60000,
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
                '**.config.js',
            ],
        },
    },
})
