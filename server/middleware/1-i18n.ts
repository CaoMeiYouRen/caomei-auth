import { defineEventHandler } from 'h3'
import { getRequestLocale, isLocalizedApiPath, setLocaleResponseHeaders } from '@/server/utils/i18n'

/**
 * 认证类 API 的语言响应头。
 *
 * 在任何可能抛错的鉴权中间件之前设置，确保 401 / 403 / 429 等错误响应同样带
 * `Content-Language` 与 `Vary`。消息翻译由 `server/utils/i18n.ts` 按同一 locale 完成。
 */
export default defineEventHandler((event) => {
    if (!isLocalizedApiPath(event.path)) {
        return
    }
    setLocaleResponseHeaders(event, getRequestLocale(event))
})
