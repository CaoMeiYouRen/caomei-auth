import { createError, defineEventHandler, isError, readBody } from 'h3'
import { OAuthClient } from '@/server/entities/oauth-client'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { applyOAuthClientInput, toAdminOAuthClientView } from '@/server/utils/oauth-client-view'
import logger from '@/server/utils/logger'
import { oauthApplicationUpdateSchema } from '@/utils/shared/schemas'
import { resolveValidationMessage } from '@/utils/shared/zod-messages'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    try {
        const id = event.context.params?.id
        const body = await readBody(event)

        if (!id) {
            throw await createLocalizedError(event, {
                statusCode: 400,
                key: 'errors.admin.oauthAppIncomplete',
            })
        }

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

        // 如果只是切换禁用状态
        if (body.disabled !== undefined && Object.keys(body).length === 1) {
            application.disabled = body.disabled
            await repo.save(application)

            return {
                status: 200,
                success: true,
                message: body.disabled ? t('errors.admin.oauthAppDisabled') : t('errors.admin.oauthAppEnabled'),
                data: toAdminOAuthClientView(application),
            }
        }

        // 完整更新应用信息
        const validationResult = oauthApplicationUpdateSchema.safeParse(body, { error: createZodErrorMap(t) })
        if (!validationResult.success) {
            throw createError({
                statusCode: 400,
                message: resolveValidationMessage(validationResult.error?.issues[0]?.message, t) || t('errors.admin.paramsInvalid'),
            })
        }

        const validatedData = validationResult.data

        applyOAuthClientInput(application, {
            name: validatedData.client_name,
            description: validatedData.description,
            redirectURLs: validatedData.redirect_uris && Array.isArray(validatedData.redirect_uris) ? validatedData.redirect_uris.join(',') : undefined,
            clientUri: validatedData.client_uri,
            logoUri: validatedData.logo_uri,
            scope: validatedData.scope,
            contacts: validatedData.contacts && Array.isArray(validatedData.contacts) ? validatedData.contacts.join(',') : undefined,
            tosUri: validatedData.tos_uri,
            policyUri: validatedData.policy_uri,
            tokenEndpointAuthMethod: validatedData.token_endpoint_auth_method,
            grantTypes: validatedData.grant_types && Array.isArray(validatedData.grant_types) ? validatedData.grant_types.join(',') : undefined,
            responseTypes: validatedData.response_types && Array.isArray(validatedData.response_types) ? validatedData.response_types.join(',') : undefined,
            softwareId: validatedData.software_id,
            softwareVersion: validatedData.software_version,
            disabled: validatedData.disabled,
        })

        await repo.save(application)

        return {
            status: 200,
            success: true,
            message: t('errors.admin.oauthAppUpdated'),
            data: toAdminOAuthClientView(application),
        }
    } catch (error) {
        if (isError(error)) {
            throw error
        }
        logger.business.oauthAppUpdateFailed({
            appId: event.context.params?.id || 'unknown',
            updatedBy: auth.data.userId,
            error: error instanceof Error ? error.message : String(error),
        })
        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.admin.oauthAppUpdateFailed',
        })
    }
})
