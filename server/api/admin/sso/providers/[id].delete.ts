import { defineEventHandler } from 'h3'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateParams } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)
    const { t } = await getServerI18n(event)

    try {
        const { id: providerId } = await validateParams(event, idParamSchema)

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)
        const provider = await ssoProviderRepository.findOne({
            where: { id: providerId },
        })

        if (!provider) {
            throw await createLocalizedError(event, {
                statusCode: 404,
                key: 'errors.admin.ssoProviderNotFound',
            })
        }

        // 删除 SSO 提供商
        await ssoProviderRepository.remove(provider)

        return {
            success: true,
            message: t('errors.admin.ssoDeleted'),
        }
    } catch (error: any) {
        logger.error('Failed to delete SSO provider', {
            error: error.message,
            providerId: error.providerId || 'unknown',
        })

        if (error.statusCode) {
            throw error
        }

        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.server.internal',
        })
    }
})
