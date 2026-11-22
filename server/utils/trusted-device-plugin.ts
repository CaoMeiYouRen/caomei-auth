import { createAuthMiddleware, isAPIError } from 'better-auth/api'
import type { BetterAuthPlugin } from 'better-auth'
import logger from '@/server/utils/logger'
import { captureTrustedDevice, type TrustedDeviceRepository } from '@/server/utils/trusted-devices'

/**
 * 可信设备采集插件（阶段 12 M4.1 / D23）。
 *
 * 监听 `/two-factor/verify-*`：仅在验证成功且请求勾选 `trustDevice` 时，
 * 从上游 Set-Cookie 解析 identifier 并落库；失败只 warn，不影响验证结果。
 */
export interface TrustedDevicePluginOptions {
    repository?: TrustedDeviceRepository
    now?: () => Date
}

export function trustedDevicePlugin(options: TrustedDevicePluginOptions = {}): BetterAuthPlugin {
    return {
        id: 'trusted-devices',
        hooks: {
            after: [{
                matcher: (ctx: { path?: string }) => (ctx.path ?? '').startsWith('/two-factor/verify-'),
                handler: createAuthMiddleware(async (ctx) => {
                    const returned = ctx.context.returned
                    /* 3xx 重定向也可能是成功响应；只有 4xx/5xx 才算失败（与登录事件插件同口径） */
                    if (isAPIError(returned) && Number(returned.statusCode) >= 400) {
                        return
                    }
                    const trustDevice = (ctx.body as { trustDevice?: boolean } | undefined)?.trustDevice
                    if (!trustDevice) {
                        return
                    }
                    const userId = ctx.context.newSession?.user?.id
                    if (!userId) {
                        return
                    }
                    const headerSources = [ctx.responseHeaders, (ctx.context as { responseHeaders?: Headers }).responseHeaders]
                    const setCookies = [...new Set(headerSources.flatMap((headers) => headers?.getSetCookie?.() ?? []))]
                    try {
                        await captureTrustedDevice({
                            userId,
                            setCookies,
                            request: ctx.request,
                            now: options.now?.(),
                            repository: options.repository,
                        })
                    } catch (error) {
                        logger.warn('trusted device: failed to capture device', {
                            userId,
                            error: error instanceof Error ? error.message : String(error),
                        })
                    }
                }),
            }],
        },
    }
}

