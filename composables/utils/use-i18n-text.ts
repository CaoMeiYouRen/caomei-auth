import type { LocaleMessageValue } from 'vue-i18n'

/**
 * 组合式函数内的文本翻译。
 *
 * `useI18n()` 只能在组件 setup 中调用，而 composable 也会被单测直接调用；
 * 这里统一走 Nuxt i18n 注入的全局 composer（SSR / 客户端 / 测试环境都可用），
 * 取不到翻译或调用失败时回退为键名，避免抛错中断流程。
 */
export function useI18nText() {
    const nuxtApp = useNuxtApp()
    const composer = (nuxtApp as { $i18n?: { t?: (key: string, named?: Record<string, unknown>) => LocaleMessageValue } }).$i18n

    return (key: string, named?: Record<string, unknown>): string => {
        if (!composer?.t) {
            return key
        }
        try {
            const value = composer.t(key, named)
            return typeof value === 'string' && value ? value : key
        } catch {
            return key
        }
    }
}
