import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)

    let body: any = null
    try {
        // 创建 SSO 提供商
        body = await readBody(event)

        const {
            type,
            providerId,
            name,
            description,
            issuer,
            domain,
            organizationId,
            enabled,
            metadataUrl,
            clientId,
            clientSecret,
            redirectUri,
            scopes,
            oidcConfig,
            samlConfig,
            additionalConfig,
        } = body

        // 验证必填字段
        if (!type || !providerId || !issuer || !domain) {
            throw createError({
                statusCode: 400,
                statusMessage: '缺少必填字段: type, providerId, issuer, domain',
            })
        }

        // 验证协议类型
        if (!['oidc', 'saml'].includes(type)) {
            throw createError({
                statusCode: 400,
                statusMessage: '不支持的协议类型，仅支持 oidc 或 saml',
            })
        }

        // 验证协议特定配置
        if (type === 'oidc' && (!oidcConfig || !oidcConfig.clientId || !oidcConfig.clientSecret)) {
            // 如果没有传oidcConfig，检查直接字段
            if (!clientId || !clientSecret) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'OIDC 配置缺少必填字段: clientId, clientSecret',
                })
            }
        }

        if (type === 'saml' && (!samlConfig || !samlConfig.entryPoint || !samlConfig.certificate)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'SAML 配置缺少必填字段: entryPoint, certificate',
            })
        }

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)

        // 检查 providerId 是否已存在
        const existingProvider = await ssoProviderRepository.findOne({
            where: { providerId },
        })

        if (existingProvider) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Provider ID 已存在',
            })
        }

        // 创建新的 SSO 提供商
        const newProvider = new SSOProvider()
        newProvider.id = snowflake.generateId()
        newProvider.type = type as 'oidc' | 'saml'
        newProvider.providerId = providerId
        newProvider.name = name || providerId
        newProvider.description = description
        newProvider.issuer = issuer
        newProvider.domain = domain
        newProvider.organizationId = organizationId || null
        newProvider.enabled = enabled !== false // 默认为 true
        newProvider.userId = auth.data?.userId || ''
        newProvider.metadataUrl = metadataUrl
        newProvider.clientId = clientId || oidcConfig?.clientId
        newProvider.clientSecret = clientSecret || oidcConfig?.clientSecret
        newProvider.redirectUri = redirectUri
        newProvider.scopes = scopes
        if (type === 'oidc' && oidcConfig) {
            newProvider.oidcConfig = JSON.stringify(oidcConfig)
        }
        if (type === 'saml' && samlConfig) {
            newProvider.samlConfig = JSON.stringify(samlConfig)
        }
        if (additionalConfig) {
            newProvider.additionalConfig = JSON.stringify(additionalConfig)
        }

        const savedProvider = await ssoProviderRepository.save(newProvider)

        return {
            success: true,
            data: savedProvider,
            message: 'SSO 提供商创建成功',
        }
    } catch (error: any) {
        logger.error('Failed to create SSO provider', {
            error: error.message,
            provider: body?.provider,
        })

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
