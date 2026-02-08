import { defineEventHandler, readBody } from 'h3'
import dayjs from 'dayjs'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { generateClientSecret } from '@/server/utils/auth-generators'
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

        const application = new OAuthApplication()
        application.id = snowflake.generateId()
        application.name = appName!
        application.description = (body).description || ''
        application.clientId = application.id // 使用ID作为clientId
        application.clientSecret = generateClientSecret()
        application.redirectURLs = normalizedRedirectURIs.join(',')
        application.tokenEndpointAuthMethod = token_endpoint_auth_method
        application.grantTypes = grant_types.join(',')
        application.responseTypes = response_types.join(',')
        application.clientUri = client_uri || ''
        application.logoUri = logo_uri || ''
        application.scope = scope || ''
        application.contacts = contacts ? contacts.join(',') : ''
        application.tosUri = tos_uri || ''
        application.policyUri = policy_uri || ''
        application.jwksUri = jwks_uri || ''
        application.jwks = jwks ? JSON.stringify(jwks) : ''
        application.metadata = metadata ? JSON.stringify(metadata) : ''
        application.softwareId = software_id || ''
        application.softwareVersion = software_version || ''
        application.softwareStatement = software_statement || ''
        application.type = type
        application.disabled = disabled
        application.userId = auth.data?.userId || ''

        await dataSource.getRepository(OAuthApplication).save(application)

        // 返回符合 RFC7591 标准的响应
        const response = {
            client_id: application.clientId,
            client_secret: application.clientSecret,
            client_id_issued_at: dayjs(application.createdAt).unix(),
            client_secret_expires_at: 0, // 0 表示不过期
            redirect_uris: normalizedRedirectURIs,
            token_endpoint_auth_method: application.tokenEndpointAuthMethod,
            grant_types: application.grantTypes?.split(',') || grant_types,
            response_types: application.responseTypes?.split(',') || response_types,
            client_name: application.name,
            client_uri: application.clientUri,
            logo_uri: application.logoUri,
            scope: application.scope,
            contacts: application.contacts?.split(',') || contacts,
            tos_uri: application.tosUri,
            policy_uri: application.policyUri,
            jwks_uri: application.jwksUri,
            jwks: application.jwks ? JSON.parse(application.jwks) : jwks,
            software_id: application.softwareId,
            software_version: application.softwareVersion,
            software_statement: application.softwareStatement,
            metadata: application.metadata ? JSON.parse(application.metadata) : metadata,
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
