import path from 'node:path'
import { defineConfig } from 'vitest/config'

const rootDir = path.resolve(import.meta.dirname, './')

/**
 * i18n 运行时门禁（`pnpm test:i18n`）。
 *
 * 与主测试配置分离：只跑 `tests/i18n/**`，聚焦语言包结构、文案可编译性与
 * 运行时加载器的真实模块装配；不引入 Nuxt 环境，保持门禁秒级可跑。
 */
export default defineConfig({
    root: rootDir,
    resolve: {
        alias: {
            '@': rootDir,
        },
    },
    test: {
        globals: true,
        environment: 'node',
        include: ['tests/i18n/**/*.spec.ts'],
        testTimeout: 30000,
    },
})
