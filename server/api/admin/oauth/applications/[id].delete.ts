import { createError, defineEventHandler, isError } from 'h3'
import { OAuthClient } from '@/server/entities/oauth-client'
import { OAuthAccessToken } from '@/server/entities/oauth-access-token'
import { OAuthRefreshToken } from '@/server/entities/oauth-refresh-token'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { OAuthClientResource } from '@/server/entities/oauth-client-resource'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    let appId = 'unknown'
    try {
        const paramsResult = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })

        if (!paramsResult.success) {
            throw createError({ statusCode: 400, message: paramsResult.error.message })
        }

        const { id } = paramsResult.data
        appId = id

        const repo = dataSource.getRepository(OAuthClient)

        const application = await repo.findOne({
            where: { id },
        })

        if (!application) {
            throw await createLocalizedError(event, {
                statusCode: 404,
                key: 'errors.admin.oauthAppNotFound',
            })
        }

        // 清理客户端关联的令牌、授权同意与资源绑定，避免残留孤儿数据
        await dataSource.getRepository(OAuthAccessToken).delete({ clientId: application.clientId })
        await dataSource.getRepository(OAuthRefreshToken).delete({ clientId: application.clientId })
        await dataSource.getRepository(OAuthConsent).delete({ clientId: application.clientId })
        await dataSource.getRepository(OAuthClientResource).delete({ clientId: application.clientId })

        await repo.remove(application)

        return {
            status: 200,
            success: true,
            message: t('errors.admin.oauthAppDeleted'),
            data: null,
        }
    } catch (error) {
        if (isError(error)) {
            throw error
        }
        logger.business.oauthAppDeleteFailed({
            appId,
            deletedBy: auth.data.userId,
            error: error instanceof Error ? error.message : String(error),
        })
        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.admin.oauthAppDeleteFailed',
        })
    }
})
