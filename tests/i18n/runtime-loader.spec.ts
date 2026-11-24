import { describe, expect, it, vi } from 'vitest'
import { getClientLazyLocaleMessageModules } from '@/i18n/config/locale-modules'
import { ENABLED_LOCALE_CODES } from '@/i18n/config/locale-registry'
import { ensureLocaleMessageModules, ensureRouteLocaleMessages, isEnabledLocaleModulePath, localeModuleImporters } from '@/i18n/config/locale-runtime-loader'

/**
 * 运行时装配门禁：用真实语言包验证「进入路由 → 合并对应模块」。
 *
 * 与单测里的 mock 断言互补：这里读取真实的 `i18n/locales` JSON，任何模块文件
 * 改名、glob 排除清单漂移或缺内容都会在这里暴露。
 */
describe('i18n 运行时模块装配', () => {
    it('进入 /admin/sso/providers 合并后台 SSO 模块', async () => {
        const mergeLocaleMessage = vi.fn()

        await ensureRouteLocaleMessages({
            i18n: { mergeLocaleMessage },
            locale: 'en-US',
            path: '/en-US/admin/sso/providers',
        })

        const merged = mergeLocaleMessage.mock.calls.map(([, payload]) => payload)
        expect(merged).toEqual(expect.arrayContaining([
            expect.objectContaining({
                admin: expect.objectContaining({
                    sso: expect.objectContaining({
                        providers: expect.objectContaining({ title: 'SSO Providers' }),
                    }),
                }),
            }),
        ]))
    })

    it('core-only 路由不触发额外合并', async () => {
        const mergeLocaleMessage = vi.fn()

        await ensureRouteLocaleMessages({ i18n: { mergeLocaleMessage }, locale: 'zh-CN', path: '/login' })

        expect(mergeLocaleMessage).not.toHaveBeenCalled()
    })

    it('静态语言包只含已启用语言且排除 core / server 模块', () => {
        const locales = new Set(Object.keys(localeModuleImporters).map((filePath) => filePath.split('/')[2]))
        for (const locale of locales) {
            expect(ENABLED_LOCALE_CODES).toContain(locale)
        }

        expect(localeModuleImporters['../locales/en-US/admin.json']).toBeTypeOf('function')
        expect(localeModuleImporters['../locales/es-ES/admin.json']).toBeUndefined()
        expect(localeModuleImporters['../locales/en-US/auth.json']).toBeUndefined()
        expect(localeModuleImporters['../locales/en-US/server-only.json']).toBeUndefined()
    })

    it('每个已启用语言的懒加载模块都有导入器', () => {
        for (const locale of ENABLED_LOCALE_CODES) {
            for (const moduleName of getClientLazyLocaleMessageModules()) {
                expect(
                    localeModuleImporters[`../locales/${locale}/${moduleName}.json`],
                    `${locale}/${moduleName}.json 缺少导入器`,
                ).toBeTypeOf('function')
            }
        }
    })

    it('路径判定只放行已启用语言的模块路径', () => {
        expect(isEnabledLocaleModulePath('../locales/zh-CN/admin-logs.json')).toBe(true)
        expect(isEnabledLocaleModulePath('../locales/es-ES/admin-logs.json')).toBe(false)
        expect(isEnabledLocaleModulePath('../locales/en-US/nested/admin.json')).toBe(false)
        expect(isEnabledLocaleModulePath('locales/en-US/admin.json')).toBe(false)
    })

    it('切换语言后按新语言装载同一模块', async () => {
        const mergeLocaleMessage = vi.fn()
        const i18n = { mergeLocaleMessage }

        await ensureLocaleMessageModules({ i18n, locale: 'zh-CN', modules: ['admin-sso'] })
        await ensureLocaleMessageModules({ i18n, locale: 'en-US', modules: ['admin-sso'] })

        expect(mergeLocaleMessage.mock.calls.map(([locale]) => locale)).toEqual(['zh-CN', 'en-US'])
    })
})
