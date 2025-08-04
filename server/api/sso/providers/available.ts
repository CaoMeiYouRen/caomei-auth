import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'

export default defineEventHandler(async (event) => {
    try {
        const method = getMethod(event)

        if (method !== 'GET') {
            throw createError({
                statusCode: 405,
                statusMessage: '方法不允许',
            })
        }

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)

        // 只返回启用的 SSO 提供商的公开信息
        const providers = await ssoProviderRepository.find({
            where: { enabled: true },
            select: [
                'id',
                'type',
                'providerId',
                'name',
                'description',
                'domain',
                'issuer',
                'createdAt',
            ],
            order: {
                createdAt: 'DESC',
            },
        })

        return {
            success: true,
            data: providers,
        }
    } catch (error: any) {
        console.error('获取可用 SSO 提供商错误:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
