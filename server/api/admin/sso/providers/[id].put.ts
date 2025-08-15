import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)

    try {
        const providerId = getRouterParam(event, 'id')
        if (!providerId) {
            throw createError({
                statusCode: 400,
                statusMessage: '缺少提供商 ID',
            })
        }

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)
        const provider = await ssoProviderRepository.findOne({
            where: { id: providerId },
        })

        if (!provider) {
            throw createError({
                statusCode: 404,
                statusMessage: 'SSO 提供商不存在',
            })
        }

        // 更新 SSO 提供商
        const body = await readBody(event)

        // 允许更新的字段
        const allowedFields = [
            'name',
            'description',
            'issuer',
            'domain',
            'organizationId',
            'enabled',
            'metadataUrl',
            'clientId',
            'clientSecret',
            'redirectUri',
            'scopes',
            'oidcConfig',
            'samlConfig',
            'additionalConfig',
        ]

        // 过滤并应用更新
        for (const field of allowedFields) {
            if (field in body) {
                if (field === 'oidcConfig' || field === 'samlConfig' || field === 'additionalConfig') {
                    // 确保配置是字符串格式
                    if (body[field]) {
                        (provider as any)[field] = JSON.stringify(body[field])
                    }
                } else {
                    (provider as any)[field] = body[field]
                }
            }
        }

        // 验证协议特定配置
        if (provider.type === 'oidc' && body.oidcConfig) {
            const oidcConfig = body.oidcConfig
            if (!oidcConfig.clientId || !oidcConfig.clientSecret) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'OIDC 配置缺少必填字段: clientId, clientSecret',
                })
            }
        }

        if (provider.type === 'saml' && body.samlConfig) {
            const samlConfig = body.samlConfig
            if (!samlConfig.entryPoint || !samlConfig.certificate) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'SAML 配置缺少必填字段: entryPoint, certificate',
                })
            }
        }

        const updatedProvider = await ssoProviderRepository.save(provider)

        return {
            success: true,
            data: updatedProvider,
            message: 'SSO 提供商更新成功',
        }
    } catch (error: any) {
        logger.error('Failed to update SSO provider', {
            error: error.message,
            providerId: getRouterParam(event, 'id'),
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
