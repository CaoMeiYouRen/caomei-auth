import { defineEventHandler, readBody, createError } from 'h3'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { ssoProviderSchema } from '@/utils/shared/schemas'
import { snowflake } from '@/server/utils/snowflake'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)

    let body: any = null
    try {
        // 创建 SSO 提供商
        body = await readBody(event)

        const validationResult = ssoProviderSchema.safeParse(body)
        if (!validationResult.success) {
            throw createError({
                statusCode: 400,
                statusMessage: validationResult.error?.issues[0]?.message || '参数校验失败',
            })
        }

        const validatedData = validationResult.data

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
        } = validatedData

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
        newProvider.type = type
        newProvider.providerId = providerId
        newProvider.name = name || providerId
        newProvider.description = description || ''
        newProvider.issuer = issuer
        newProvider.domain = domain
        newProvider.organizationId = organizationId || ''
        newProvider.enabled = enabled !== false // 默认为 true
        newProvider.userId = auth.data?.userId || ''
        newProvider.metadataUrl = metadataUrl || ''
        newProvider.clientId = clientId || oidcConfig?.clientId || ''
        newProvider.clientSecret = clientSecret || oidcConfig?.clientSecret || ''
        newProvider.redirectUri = redirectUri || ''
        newProvider.scopes = scopes ? scopes.join(',') : ''
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
            provider: body?.providerId,
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
