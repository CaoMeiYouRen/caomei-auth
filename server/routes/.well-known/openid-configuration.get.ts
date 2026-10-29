import { defineEventHandler, toWebRequest } from 'h3'
import { oauthProviderOpenIdConfigMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/lib/auth'

/**
 * OIDC 发现文档（`/.well-known/openid-configuration`，位于站点根路径）。
 *
 * better-auth 1.7 将该端点标记为 server-only，不再随 basePath 自动挂载，
 * 需要由应用在根路径显式暴露（issuer 为站点根 URL 时，发现文档必须位于根路径）。
 */
const handler = oauthProviderOpenIdConfigMetadata(auth)

export default defineEventHandler((event) => handler(toWebRequest(event)))
