import { H3Event } from 'h3'

import { limiterStorage } from '@/server/database/storage'
import { normalizeAuthPath } from '@/utils/shared/auth-paths'

interface RateLimitOptions {
    // 窗口时间，毫秒
    window: number
    // 最大请求次数
    max: number
}

export async function rateLimit(event: H3Event, options: RateLimitOptions) {
    const ip = getRequestIP(event, { xForwardedFor: true }) || 'unknown'
    // 按归一化路径计数，避免 `/api/file/./upload` 之类点段路径把同一端点拆成多个桶
    const key = `ratelimit:${ip}:${normalizeAuthPath(event.path)}`
    const $store = limiterStorage
    const count = await $store.increment(key, options.window)

    if (count > options.max) {
        throw createError({
            statusCode: 429,
            message: '请求过于频繁，请稍后再试',
        })
    }
}
