import { getCookie, setCookie } from 'h3'
import { LOCALE_COOKIE_KEY, normalizeDetectedLocale } from './config/locale-registry'

/**
 * 服务端 locale 检测（`experimental.localeDetector`）。
 *
 * 优先级：query → `i18n_locale` cookie → 旧 cookie（locale / language / lang）→ Accept-Language → 默认语言。
 * 命中旧 cookie 时回写 `i18n_locale`，避免 SSR / CSR 首帧语言不一致。
 */
export default defineI18nLocaleDetector((event, config) => {
    const query = tryQueryLocale(event, { lang: '' })
    if (query) {
        return normalizeDetectedLocale(query.toString())
    }

    const cookie = tryCookieLocale(event, { lang: '', name: LOCALE_COOKIE_KEY })
    if (cookie) {
        return normalizeDetectedLocale(cookie.toString())
    }

    for (const name of ['locale', 'language', 'lang']) {
        const legacy = getCookie(event, name)
        if (legacy) {
            const normalized = normalizeDetectedLocale(legacy)
            setCookie(event, LOCALE_COOKIE_KEY, normalized, { path: '/', sameSite: 'lax' })
            return normalized
        }
    }

    const header = tryHeaderLocale(event, { lang: '' })
    if (header) {
        return normalizeDetectedLocale(header.toString())
    }

    return normalizeDetectedLocale(config.defaultLocale)
})
