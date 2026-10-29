import { defineEventHandler, readBody } from 'h3'
import dayjs from 'dayjs'
import { OAuthClient } from '@/server/entities/oauth-client'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { generateClientSecret } from '@/server/utils/auth-generators'
import { hashClientSecret } from '@/server/utils/oauth-client-view'
import { snowflake } from '@/server/utils/snowflake'
import logger from '@/server/utils/logger'
import { oauthApplicationSchema } from '@/utils/shared/schemas'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    let body: any = null
    try {
        body = await readBody(event)

        const validationResult = oauthApplicationSchema.safeParse(body)
        if (!validationResult.success) {
            return {
                status: 400,
                success: false,
                message: validationResult.error?.issues[0]?.message || '参数校验失败',
                data: null,
            }
        }

        const validatedData = validationResult.data

        const {
            client_name,
            redirect_uris,
            token_endpoint_auth_method,
            grant_types,
            response_types,
            client_uri,
            logo_uri,
            scope,
            contacts,
            tos_uri,
            policy_uri,
            jwks_uri,
            jwks,
            metadata,
            software_id,
            software_version,
            software_statement,
            // 保持向后兼容
            name,
            redirectURLs,
            type,
            disabled,
        } = validatedData

        // 使用新字段或向后兼容的旧字段
        const appName = client_name || name
        const appRedirectURIs = redirect_uris || (typeof redirectURLs === 'string' ? redirectURLs.split(',') : redirectURLs)

        let normalizedRedirectURIs: string[] = []
        if (Array.isArray(appRedirectURIs)) {
            normalizedRedirectURIs = appRedirectURIs
        } else if (typeof appRedirectURIs === 'string') {
            normalizedRedirectURIs = [appRedirectURIs]
        }

        // 验证重定向URI格式
        for (const uri of normalizedRedirectURIs) {
            try {
                new URL(uri)
            } catch {
                return {
                    status: 400,
                    success: false,
                    message: `无效的重定向URI：${uri}`,
                    data: null,
                }
            }
        }

        const application = new OAuthClient()
        application.id = snowflake.generateId()
        application.clientId = application.id // 使用ID作为clientId
        application.name = appName!
        application.description = (body).description || ''
        // better-auth 1.7 默认以 SHA-256 + base64url 哈希存储客户端密钥
        const clientSecret = generateClientSecret()
        application.clientSecret = hashClientSecret(clientSecret)
        application.redirectUris = normalizedRedirectURIs
        application.tokenEndpointAuthMethod = token_endpoint_auth_method
        application.grantTypes = grant_types
        application.responseTypes = response_types
        application.uri = client_uri || ''
        application.icon = logo_uri || ''
        application.scopes = scope ? scope.split(/[\s,]+/).filter(Boolean) : []
        application.contacts = contacts || []
        application.tos = tos_uri || ''
        application.policy = policy_uri || ''
        application.jwksUri = jwks_uri || ''
        application.jwks = jwks ? JSON.stringify(jwks) : ''
        application.metadata = metadata ?? null
        application.softwareId = software_id || ''
        application.softwareVersion = software_version || ''
        application.softwareStatement = software_statement || ''
        application.applicationType = type
        // better-auth 1.7 的 PKCE 默认值变为「必需」（`requirePKCE ?? true`）。
        // 项目在 1.6 明确使用 `requirePKCE: false`，这里保持客户端可用性不因升级而突变。
        application.requirePKCE = false
        application.disabled = disabled
        application.userId = auth.data?.userId || ''

        await dataSource.getRepository(OAuthClient).save(application)

        // 返回符合 RFC7591 标准的响应
        const response = {
            client_id: application.clientId,
            client_secret: clientSecret,
            client_id_issued_at: dayjs(application.createdAt).unix(),
            client_secret_expires_at: 0, // 0 表示不过期
            redirect_uris: normalizedRedirectURIs,
            token_endpoint_auth_method: application.tokenEndpointAuthMethod,
            grant_types: application.grantTypes || grant_types,
            response_types: application.responseTypes || response_types,
            client_name: application.name,
            client_uri: application.uri,
            logo_uri: application.icon,
            scope: (application.scopes ?? []).join(' '),
            contacts: application.contacts || contacts,
            tos_uri: application.tos,
            policy_uri: application.policy,
            jwks_uri: application.jwksUri,
            jwks: application.jwks ? JSON.parse(application.jwks) : jwks,
            software_id: application.softwareId,
            software_version: application.softwareVersion,
            software_statement: application.softwareStatement,
            metadata: application.metadata ?? metadata,
            disabled: application.disabled,
        }

        return {
            status: 201,
            success: true,
            message: '应用创建成功',
            data: response,
        }
    } catch (error) {
        logger.business.oauthAppCreateFailed({
            name: body?.client_name || body?.name,
            createdBy: auth.data.userId,
            error: error instanceof Error ? error.message : String(error),
        })
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '创建应用失败',
            data: null,
        }
    }
})
