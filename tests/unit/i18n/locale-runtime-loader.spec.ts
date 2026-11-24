import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { LOCALE_CORE_MODULES, LOCALE_SERVER_MODULES, getClientLazyLocaleMessageModules } from '@/i18n/config/locale-modules'
import { LOCALE_REGISTRY } from '@/i18n/config/locale-registry'
import { ensureLocaleMessageModules, ensureRouteLocaleMessages } from '@/i18n/config/locale-runtime-loader'

function createI18n() {
    return { mergeLocaleMessage: vi.fn() }
}

describe('i18n/config/locale-runtime-loader', () => {
    it('skips runtime loading for routes backed only by core modules', async () => {
        const i18n = createI18n()

        await ensureRouteLocaleMessages({ i18n, locale: 'en-US', path: '/login' })

        expect(i18n.mergeLocaleMessage).not.toHaveBeenCalled()
    })

    it('loads route modules for the current locale only', async () => {
        const i18n = createI18n()

        await ensureRouteLocaleMessages({ i18n, locale: 'en-US', path: '/admin/users' })

        /* 回退由 key 同构门禁保证，运行期只合并当前语言，避免重复 payload */
        expect(i18n.mergeLocaleMessage).toHaveBeenCalledTimes(2)
        const locales = i18n.mergeLocaleMessage.mock.calls.map(([locale]) => locale)
        expect(locales).toEqual(['en-US', 'en-US'])
    })

    it('does not reload modules already merged into the same i18n instance', async () => {
        const i18n = createI18n()

        await ensureRouteLocaleMessages({ i18n, locale: 'zh-CN', path: '/security' })
        expect(i18n.mergeLocaleMessage).toHaveBeenCalledTimes(1)

        i18n.mergeLocaleMessage.mockClear()
        await ensureRouteLocaleMessages({ i18n, locale: 'zh-CN', path: '/security' })

        expect(i18n.mergeLocaleMessage).not.toHaveBeenCalled()
    })

    it('normalizes better-auth locale aliases before loading', async () => {
        const i18n = createI18n()

        await ensureLocaleMessageModules({ i18n, locale: 'en', modules: ['profile'] })

        expect(i18n.mergeLocaleMessage).toHaveBeenCalledTimes(1)
        expect(i18n.mergeLocaleMessage).toHaveBeenCalledWith('en-US', expect.any(Object))
    })

    it('resolves an importer for every client lazy module', async () => {
        for (const moduleName of getClientLazyLocaleMessageModules()) {
            const i18n = createI18n()
            await ensureLocaleMessageModules({ i18n, locale: 'zh-CN', modules: [moduleName] })

            /* 每个模块都必须命中 import.meta.glob 的导入器，否则该模块永远不会被加载 */
            expect(i18n.mergeLocaleMessage).toHaveBeenCalledTimes(1)
            expect(i18n.mergeLocaleMessage).toHaveBeenCalledWith('zh-CN', expect.any(Object))
        }
    })

    it('treats core modules as already preloaded by @nuxtjs/i18n', async () => {
        const i18n = createI18n()

        await ensureLocaleMessageModules({ i18n, locale: 'en-US', modules: ['app', 'common', 'errors', 'validation', 'auth'] })

        expect(i18n.mergeLocaleMessage).not.toHaveBeenCalled()
    })

    it('merges through the legacy `i18n.global` composer when present', async () => {
        const mergeLocaleMessage = vi.fn()

        await ensureLocaleMessageModules({
            i18n: { global: { mergeLocaleMessage } },
            locale: 'zh-CN',
            modules: ['profile'],
        })

        expect(mergeLocaleMessage).toHaveBeenCalledWith('zh-CN', expect.any(Object))
    })

    it('keeps the negative glob pattern in sync with core / server modules', () => {
        /* Vite 要求 glob 为字面量，无法运行时拼接；用源码文本守卫排除清单不漂移 */
        const source = readFileSync(path.resolve(process.cwd(), 'i18n/config/locale-runtime-loader.ts'), 'utf8')
        const excluded = source.match(/!\.\.\/locales\/\*\*\/\{([^}]+)\}\.[a-z]+/u)?.[1]

        expect(excluded).toBeTruthy()
        expect(excluded?.split(',').sort()).toEqual([...LOCALE_CORE_MODULES, ...LOCALE_SERVER_MODULES].sort())
    })

    it('keeps the negative locale pattern in sync with disabled registry locales', () => {
        /* 启用新语言时必须同步负向清单，否则该语言的懒加载模块会被静默排除 */
        const source = readFileSync(path.resolve(process.cwd(), 'i18n/config/locale-runtime-loader.ts'), 'utf8')
        const excluded = source.match(/!\.\.\/locales\/\{([^}]+)\}\//u)?.[1]

        expect(excluded).toBeTruthy()
        expect(excluded?.split(',').sort()).toEqual(
            LOCALE_REGISTRY.filter((locale) => locale.enabled !== true).map((locale) => locale.code).sort(),
        )
    })

    it('ignores instances without a mergeLocaleMessage API', async () => {
        await expect(ensureRouteLocaleMessages({ i18n: {}, locale: 'zh-CN', path: '/admin/users' })).resolves.toBeUndefined()
        await expect(ensureRouteLocaleMessages({ i18n: null, locale: 'zh-CN', path: '/admin/users' })).resolves.toBeUndefined()
    })
})
