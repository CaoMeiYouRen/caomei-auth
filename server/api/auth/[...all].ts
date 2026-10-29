import { defineEventHandler } from 'h3'
import { oauthProviderAuthServerMetadata, oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/lib/auth'

/**
 * better-auth 1.7 起 OAuth/OIDC 发现端点改为 server-only，不再随 basePath 自动挂载。
 * 这里同时兼容 1.6 时期的旧路径（`/api/auth/.well-known/*`），避免已接入的客户端失效；
 * 标准根路径由 `server/routes/.well-known/*` 暴露。
 */
const oidcMetadata = oauthProviderOpenIdConfigMetadata(auth)
const authServerMetadata = oauthProviderAuthServerMetadata(auth)

const LEGACY_METADATA_ROUTES: Record<string, (request: Request) => Promise<Response>> = {
    '/api/auth/.well-known/openid-configuration': oidcMetadata,
    '/api/auth/.well-known/oauth-authorization-server': authServerMetadata,
}

export default defineEventHandler((event) => {
    const pathname = event.path.split('?')[0] ?? ''
    const metadataHandler = LEGACY_METADATA_ROUTES[pathname]
    if (metadataHandler) {
        return metadataHandler(toWebRequest(event))
    }
    return auth.handler(toWebRequest(event))
})
