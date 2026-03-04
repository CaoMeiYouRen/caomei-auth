import { defineEventHandler, createError } from 'h3'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateParams } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)

    try {
        const { id: providerId } = await validateParams(event, idParamSchema)

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
        logger.error('Failed to delete SSO provider', {
            error: error.message,
            providerId: error.providerId || 'unknown',
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
