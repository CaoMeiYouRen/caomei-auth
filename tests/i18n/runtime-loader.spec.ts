import { describe, expect, it, vi } from 'vitest'
import { ensureLocaleMessageModules, ensureRouteLocaleMessages } from '@/i18n/config/locale-runtime-loader'

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

    it('切换语言后按新语言装载同一模块', async () => {
        const mergeLocaleMessage = vi.fn()
        const i18n = { mergeLocaleMessage }

        await ensureLocaleMessageModules({ i18n, locale: 'zh-CN', modules: ['admin-sso'] })
        await ensureLocaleMessageModules({ i18n, locale: 'en-US', modules: ['admin-sso'] })

        expect(mergeLocaleMessage.mock.calls.map(([locale]) => locale)).toEqual(['zh-CN', 'en-US'])
    })
})
