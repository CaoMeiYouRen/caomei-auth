import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)

    try {
        // 获取 SSO 提供商列表
        const ssoProviderRepository = dataSource.getRepository(SSOProvider)

        const providers = await ssoProviderRepository.find({
            order: {
                createdAt: 'DESC',
            },
            relations: ['user'],
        })

        // 隐藏敏感信息
        const sanitizedProviders = providers.map((provider) => {
            const sanitized = { ...provider }

            // 隐藏客户端密钥等敏感信息
            if (sanitized.oidcConfig) {
                try {
                    const oidcConfig = typeof sanitized.oidcConfig === 'string'
                        ? JSON.parse(sanitized.oidcConfig)
                        : sanitized.oidcConfig

                    if (oidcConfig.clientSecret) {
                        oidcConfig.clientSecret = '***'
                    }

                    sanitized.oidcConfig = JSON.stringify(oidcConfig)
                } catch (error) {
                    // 忽略解析错误
                }
            }

            if (sanitized.samlConfig) {
                try {
                    const samlConfig = typeof sanitized.samlConfig === 'string'
                        ? JSON.parse(sanitized.samlConfig)
                        : sanitized.samlConfig

                    if (samlConfig.signingKey) {
                        samlConfig.signingKey = '***'
                    }

                    sanitized.samlConfig = JSON.stringify(samlConfig)
                } catch (error) {
                    // 忽略解析错误
                }
            }

            // 隐藏实体中的敏感字段
            if (sanitized.clientSecret) {
                sanitized.clientSecret = '***'
            }

            return sanitized
        })

        return {
            success: true,
            data: sanitizedProviders,
        }
    } catch (error: any) {
        logger.error('Failed to get SSO providers list', {
            error: error.message,
        })

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
