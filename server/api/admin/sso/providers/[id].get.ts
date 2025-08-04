import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

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
            relations: ['user'],
        })

        if (!provider) {
            throw createError({
                statusCode: 404,
                statusMessage: 'SSO 提供商不存在',
            })
        }

        // 隐藏敏感信息
        const sanitizedProvider = { ...provider }

        // 隐藏客户端密钥等敏感信息
        if (sanitizedProvider.oidcConfig) {
            try {
                const oidcConfig = typeof sanitizedProvider.oidcConfig === 'string'
                    ? JSON.parse(sanitizedProvider.oidcConfig)
                    : sanitizedProvider.oidcConfig

                if (oidcConfig.clientSecret) {
                    oidcConfig.clientSecret = '***'
                }

                sanitizedProvider.oidcConfig = JSON.stringify(oidcConfig)
            } catch (error) {
                // 忽略解析错误
            }
        }

        if (sanitizedProvider.samlConfig) {
            try {
                const samlConfig = typeof sanitizedProvider.samlConfig === 'string'
                    ? JSON.parse(sanitizedProvider.samlConfig)
                    : sanitizedProvider.samlConfig

                if (samlConfig.signingKey) {
                    samlConfig.signingKey = '***'
                }

                sanitizedProvider.samlConfig = JSON.stringify(samlConfig)
            } catch (error) {
                // 忽略解析错误
            }
        }

        // 隐藏实体中的敏感字段
        if (sanitizedProvider.clientSecret) {
            sanitizedProvider.clientSecret = '***'
        }

        return {
            success: true,
            data: sanitizedProvider,
        }
    } catch (error: any) {
        console.error('获取 SSO 提供商详情错误:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
