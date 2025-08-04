import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
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

        const method = getMethod(event)

        if (method === 'GET') {
            // 获取单个 SSO 提供商详情
            return {
                success: true,
                data: provider,
            }
        } if (method === 'PUT') {
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
                'oidcConfig',
                'samlConfig',
            ]

            // 过滤并应用更新
            for (const field of allowedFields) {
                if (field in body) {
                    if (field === 'oidcConfig' || field === 'samlConfig') {
                        // 确保配置是字符串格式
                        (provider as any)[field] = body[field] ? JSON.stringify(body[field]) : null
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
                        statusMessage: 'OIDC 配置缺少必填字段',
                    })
                }
            }

            if (provider.type === 'saml' && body.samlConfig) {
                const samlConfig = body.samlConfig
                if (!samlConfig.entryPoint || !samlConfig.certificate) {
                    throw createError({
                        statusCode: 400,
                        statusMessage: 'SAML 配置缺少必填字段',
                    })
                }
            }

            const updatedProvider = await ssoProviderRepository.save(provider)

            return {
                success: true,
                data: updatedProvider,
                message: 'SSO 提供商更新成功',
            }
        } if (method === 'DELETE') {
            // 删除 SSO 提供商
            await ssoProviderRepository.remove(provider)

            return {
                success: true,
                message: 'SSO 提供商删除成功',
            }
        }

        throw createError({
            statusCode: 405,
            statusMessage: '方法不允许',
        })
    } catch (error: any) {
        console.error('SSO 提供商操作错误:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
