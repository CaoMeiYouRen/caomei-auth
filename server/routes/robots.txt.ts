import { defineEventHandler, getRequestURL, setResponseHeader } from 'h3'
import { AUTH_BASE_URL } from '@/utils/shared/env'
import { buildRobotsTxt } from '@/utils/shared/seo'

/**
 * robots.txt：公开页可抓取，登录后页面 / 管理端 / API 与 sitemap 显式声明。
 *
 * baseUrl 取运行时请求源（优先 `AUTH_BASE_URL`），保证 Sitemap 行始终指向当前部署域名。
 */
export default defineEventHandler((event) => {
    const origin = AUTH_BASE_URL || getRequestURL(event).origin
    setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
    setResponseHeader(event, 'Cache-Control', 'public, max-age=3600')
    return buildRobotsTxt(origin)
})
