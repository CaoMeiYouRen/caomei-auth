import { createError, defineEventHandler, getRequestURL, setResponseHeader } from 'h3'
import logger from '@/server/utils/logger'
import { AUTH_BASE_URL } from '@/utils/shared/env'
import { buildSitemapXml } from '@/utils/shared/seo'

/**
 * 公开页 sitemap。只列出可索引语言（`seo-ready` + `indexable`），并输出 hreflang alternates。
 *
 * baseUrl 取运行时请求源（优先 `AUTH_BASE_URL`），避免构建期未注入环境变量时写出 localhost。
 */
export default defineEventHandler((event) => {
    try {
        const origin = AUTH_BASE_URL || getRequestURL(event).origin
        setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8')
        setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
        return buildSitemapXml(origin)
    } catch (error) {
        logger.error('sitemap generation failed', { error: error instanceof Error ? error.message : String(error) })
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to generate sitemap',
            message: 'Failed to generate sitemap',
        })
    }
})
