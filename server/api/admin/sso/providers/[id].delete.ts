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
        })

        if (!provider) {
            throw createError({
                statusCode: 404,
                statusMessage: 'SSO 提供商不存在',
            })
        }

        // 删除 SSO 提供商
        await ssoProviderRepository.remove(provider)

        return {
            success: true,
            message: 'SSO 提供商删除成功',
        }
    } catch (error: any) {
        console.error('删除 SSO 提供商错误:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
