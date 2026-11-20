import { defineEventHandler } from 'h3'
import { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/lib/auth'

/**
 * better-auth 1.7 起 OAuth/OIDC 发现端点改为 server-only，不再随 basePath 自动挂载。
 * 这里同时兼容 1.6 时期的旧路径（`/api/auth/.well-known/*`），避免已接入的客户端失效；
 * 标准根路径由 `server/routes/.well-known/*` 暴露。
 */
const LEGACY_METADATA_PATHS = new Set([
    '/api/auth/.well-known/openid-configuration',
    '/api/auth/.well-known/oauth-authorization-server',
])

export default defineEventHandler((event) => {
    const pathname = event.path.split('?')[0] ?? ''
    if (LEGACY_METADATA_PATHS.has(pathname)) {
        /* 元数据 handler 依赖 better-auth 实例，必须在请求期创建，避免模块顶层读取 dataSource */
        const metadataHandler = pathname.endsWith('openid-configuration')
            ? oauthProviderOpenIdConfigMetadata(auth)
            : oauthProviderAuthServerMetadata(auth)
        return metadataHandler(toWebRequest(event))
    }
    return auth.handler(toWebRequest(event))
})
