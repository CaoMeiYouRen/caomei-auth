import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import middleware from '@/middleware/i18n-modules.global'

const useNuxtAppMock = vi.hoisted(() => vi.fn())
const useRuntimeConfigMock = vi.hoisted(() => vi.fn())

mockNuxtImport('useNuxtApp', () => useNuxtAppMock)
mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)

function setup(options: { i18n?: unknown, demoMode?: boolean }) {
    useNuxtAppMock.mockReturnValue({ $i18n: options.i18n })
    useRuntimeConfigMock.mockReturnValue({ public: { demoMode: options.demoMode ?? false } })
}

type MiddlewareRoute = Parameters<typeof middleware>[0]

/** `defineNuxtRouteMiddleware` 的返回值即中间件函数；测试只关心 `to.path` */
const to = (routePath: string) => ({ path: routePath } as unknown as MiddlewareRoute)

describe('middleware/i18n-modules.global', () => {
    it('loads route modules through the composer locale', async () => {
        const mergeLocaleMessage = vi.fn()
        setup({ i18n: { locale: 'en-US', mergeLocaleMessage } })

        await middleware(to('/en-US/admin/logs'), undefined as never)

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(2)
        expect(mergeLocaleMessage.mock.calls.map(([locale]) => locale)).toEqual(['en-US', 'en-US'])
    })

    it('supports ref locales and the legacy `$i18n.global` composer', async () => {
        const mergeLocaleMessage = vi.fn()
        setup({ i18n: { locale: { value: 'zh-CN' }, global: { mergeLocaleMessage } } })

        await middleware(to('/security'), undefined as never)

        expect(mergeLocaleMessage).toHaveBeenCalledWith('zh-CN', expect.any(Object))
    })

    it('does not throw when `$i18n` is unavailable', async () => {
        setup({ i18n: undefined })

        await expect(middleware(to('/admin/users'), undefined as never)).resolves.toBeUndefined()
    })

    it('passes demo mode through to the loader', async () => {
        const mergeLocaleMessage = vi.fn()
        setup({ i18n: { locale: 'zh-CN', mergeLocaleMessage }, demoMode: true })

        await middleware(to('/login'), undefined as never)

        expect(mergeLocaleMessage).toHaveBeenCalledTimes(1)
        expect(mergeLocaleMessage).toHaveBeenCalledWith('zh-CN', expect.any(Object))
    })
})
