import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { generateRandomString } from '@/server/utils/random'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    try {

        const body = await readBody(event)
        const {
            client_name,
            redirect_uris,
            token_endpoint_auth_method = 'client_secret_basic',
            grant_types = ['authorization_code'],
            response_types = ['code'],
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
            type = 'web',
        } = body

        // 使用新字段或向后兼容的旧字段
        const appName = client_name || name
        const appRedirectURIs = redirect_uris || (typeof redirectURLs === 'string' ? redirectURLs.split(',') : redirectURLs)

        if (!appName || !appRedirectURIs || appRedirectURIs.length === 0) {
            return {
                status: 400,
                success: false,
                message: '参数不完整：应用名称和重定向URI是必需的',
                data: null,
            }
        }

        // 验证重定向URI格式
        for (const uri of appRedirectURIs) {
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
        application.name = appName
        application.description = body.description || ''
        application.clientId = generateRandomString(32)
        application.clientSecret = generateRandomString(64)
        application.redirectURLs = Array.isArray(appRedirectURIs) ? appRedirectURIs.join(',') : appRedirectURIs
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
        application.userId = auth.data?.userId || ''

        await dataSource.getRepository(OAuthApplication).save(application)

        // 返回符合 RFC7591 标准的响应
        const response = {
            client_id: application.clientId,
            client_secret: application.clientSecret,
            client_id_issued_at: Math.floor(application.createdAt.getTime() / 1000),
            client_secret_expires_at: 0, // 0 表示不过期
            redirect_uris: appRedirectURIs,
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
        }

        return {
            status: 201,
            success: true,
            message: '应用创建成功',
            data: response,
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '创建应用失败',
            data: null,
        }
    }
})
