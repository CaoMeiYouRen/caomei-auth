import { getCookie, sendRedirect, setHeader } from 'h3'
import { LOCALE_COOKIE_KEY, normalizeDetectedLocale } from '@/i18n/config/locale-registry'
import { resolveOAuthEntryPath } from '@/server/utils/oauth-entry'
import { setLocaleResponseHeaders } from '@/server/utils/i18n'

/** OAuth 未登录入口：按语言 cookie 跳到带前缀的登录页，保留 client_id / state 等 query */
export default defineEventHandler((event) => {
    const cookie = getCookie(event, LOCALE_COOKIE_KEY)
    const locale = normalizeDetectedLocale(cookie)
    setLocaleResponseHeaders(event, locale)
    setHeader(event, 'Cache-Control', 'no-store')
    return sendRedirect(event, resolveOAuthEntryPath('/login', event.path, cookie), 302)
})
