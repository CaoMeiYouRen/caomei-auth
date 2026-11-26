import { getLocaleDefinition, normalizeDetectedLocale } from '@/i18n/config/locale-registry'

/**
 * OAuth 授权入口的语言跳转。
 *
 * `@better-auth/oauth-provider` 的 `loginPage` / `consentPage` 只接受静态字符串，
 * 不会跟随 Nuxt i18n 的 `detectBrowserLanguage`；直接配置 `/login` 会让已选 ja-JP / ko-KR
 * 的用户从授权入口回到 zh-CN。这里用服务端入口按语言 cookie 补前缀，保留原始 query / state。
 *
 * 安全约束：只消费 query，pathname / host / scheme 全部丢弃，Location 恒为站内路径。
 */
export type OAuthEntryTarget = '/login' | '/oauth/consent'

export function resolveOAuthEntryPath(target: OAuthEntryTarget, rawUrl: string, localeCookie?: string | null): string {
    const url = new URL(rawUrl, 'http://localhost')
    const locale = normalizeDetectedLocale(localeCookie)
    const prefix = getLocaleDefinition(locale)?.routePrefix ?? ''
    return `${prefix}${target}${url.search}`
}
