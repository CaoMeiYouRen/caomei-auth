import { DEFAULT_LOCALE } from '@/i18n/config/locale-registry'
import { ensureRouteLocaleMessages } from '@/i18n/config/locale-runtime-loader'

/** `$i18n` 在不同版本下可能是 composer 或 legacy 实例，`locale` 兼容 string / ref */
function resolveLocaleValue(i18n: unknown): string {
    const locale = (i18n as { locale?: unknown } | null | undefined)?.locale
    if (typeof locale === 'string') {
        return locale
    }
    if (locale && typeof locale === 'object' && typeof (locale as { value?: unknown }).value === 'string') {
        return (locale as { value: string }).value
    }
    return DEFAULT_LOCALE
}

/**
 * 按路由装载非 core 语言模块（阶段 5 M2）。
 *
 * - core 模块由 `@nuxtjs/i18n` 的 `files[]` 首屏预装；
 * - 其余模块按 `i18n/config/locale-modules.ts` 的路由映射按需合并，
 *   服务端渲染与客户端导航共用同一入口，避免 SSR / hydration 文案不一致；
 * - 使用 `nuxtApp.$i18n` 而非 `useI18n()`：全局路由中间件早于页面 setup，
 *   `useI18n()` 在 SSR 下没有 setup 上下文会抛错；
 * - 全局中间件早于页面渲染执行，语言切换（路由前缀变化）会再次触发。
 */
export default defineNuxtRouteMiddleware(async (to) => {
    const nuxtApp = useNuxtApp()
    const runtimeConfig = useRuntimeConfig()
    const i18n = (nuxtApp as { $i18n?: unknown }).$i18n

    await ensureRouteLocaleMessages({
        i18n,
        locale: resolveLocaleValue(i18n),
        path: to.path,
        demoMode: Boolean(runtimeConfig.public.demoMode),
    })
})
