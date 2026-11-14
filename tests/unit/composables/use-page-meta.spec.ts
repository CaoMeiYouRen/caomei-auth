import { describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { usePageMeta } from '@/composables/utils/use-page-meta'

const messages: Record<string, string> = {
    'app.name': '草梅 Auth',
    'app.title': '草梅 Auth 统一登录平台',
    'admin.sso.providers.title': 'SSO 提供商管理',
    'admin.sso.providers.description': '管理单点登录（SSO）提供商',
}

const useHeadMock = vi.hoisted(() => vi.fn())
const useI18nMock = vi.hoisted(() => vi.fn(() => ({
    t: (key: string) => messages[key] ?? key,
})))

mockNuxtImport('useHead', () => useHeadMock)
mockNuxtImport('useI18n', () => useI18nMock)

function lastHeadPayload() {
    const input = useHeadMock.mock.calls.at(-1)?.[0]
    return typeof input === 'function' ? input() : input
}

describe('usePageMeta', () => {
    it('标题与描述走 i18n 键并拼接站点名', () => {
        usePageMeta('admin.sso.providers.title', 'admin.sso.providers.description')

        const payload = lastHeadPayload()
        expect(payload.title).toBe('SSO 提供商管理 - 草梅 Auth')
        expect(payload.meta).toEqual(expect.arrayContaining([
            { name: 'description', content: '管理单点登录（SSO）提供商' },
            { property: 'og:title', content: 'SSO 提供商管理 - 草梅 Auth' },
            { property: 'og:description', content: '管理单点登录（SSO）提供商' },
        ]))
    })

    it('以函数形式注册 head', () => {
        usePageMeta('admin.sso.providers.title', 'admin.sso.providers.description')

        /* 函数形态而非静态快照：locale 变化时 Unhead 重新调用并取到新语言文案 */
        expect(typeof useHeadMock.mock.calls.at(-1)?.[0]).toBe('function')
    })

    it('缺少描述键时回退为标题文案', () => {
        usePageMeta('app.title')

        const payload = lastHeadPayload()
        expect(payload.title).toBe('草梅 Auth 统一登录平台 - 草梅 Auth')
        expect(payload.meta).toEqual(expect.arrayContaining([
            { name: 'description', content: '草梅 Auth 统一登录平台' },
        ]))
    })
})
