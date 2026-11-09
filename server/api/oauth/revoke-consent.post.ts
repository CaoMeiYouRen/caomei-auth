import { defineEventHandler, readBody } from 'h3'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { dataSource } from '@/server/database'
import { getUserSession } from '@/server/utils/get-user-session'
import { getServerI18n } from '@/server/utils/i18n'
import { revokeConsentSchema } from '@/utils/shared/schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { resolveValidationMessage } from '@/utils/shared/zod-messages'

export default defineEventHandler(async (event) => {
    const { t } = await getServerI18n(event)
    try {
        const userSession = await getUserSession(event)

        if (!userSession?.user?.id) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: t('errors.auth.loginRequired'),
            })
        }

        const body = await readBody(event)
        const validationResult = revokeConsentSchema.safeParse(body, { error: createZodErrorMap(t) })

        if (!validationResult.success) {
            return {
                status: 400,
                success: false,
                message: resolveValidationMessage(validationResult.error?.issues[0]?.message, t) || t('errors.oauth.validationFailed'),
                data: null,
            }
        }

        const { clientId } = validationResult.data

        const userId = userSession.user.id

        // 删除用户对该应用的授权同意
        const result = await dataSource
            .getRepository(OAuthConsent)
            .delete({
                userId,
                clientId,
            })

        if (result.affected === 0) {
            return {
                status: 404,
                success: false,
                message: t('errors.oauth.consentNotFound'),
                data: null,
            }
        }

        return {
            status: 200,
            success: true,
            message: t('errors.oauth.revokeSucceeded'),
            data: null,
        }
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            throw error
        }

        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : t('errors.oauth.revokeFailed'),
            data: null,
        }
    }
})
