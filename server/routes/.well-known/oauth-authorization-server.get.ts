import { defineEventHandler, toWebRequest } from 'h3'
import { oauthProviderAuthServerMetadata } from '@better-auth/oauth-provider'
import { auth } from '@/lib/auth'

/**
 * OAuth 授权服务器发现文档（`/.well-known/oauth-authorization-server`，位于站点根路径）。
 *
 * 同 `openid-configuration`，1.7 起需要应用自行在根路径暴露。
 */
const handler = oauthProviderAuthServerMetadata(auth)

export default defineEventHandler((event) => handler(toWebRequest(event)))
