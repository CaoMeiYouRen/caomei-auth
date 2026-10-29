import { defineEventHandler, readBody } from 'h3'
import { OAuthClient } from '@/server/entities/oauth-client'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { applyOAuthClientInput, toAdminOAuthClientView } from '@/server/utils/oauth-client-view'
import logger from '@/server/utils/logger'
import { oauthApplicationUpdateSchema } from '@/utils/shared/schemas'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    try {
        const id = event.context.params?.id
        const body = await readBody(event)

        if (!id) {
            return {
                status: 400,
                success: false,
                message: '参数不完整',
                data: null,
            }
        }

        const repo = dataSource.getRepository(OAuthClient)

        const application = await repo.findOne({
            where: { id },
        })

        if (!application) {
            return {
                status: 404,
                success: false,
                message: '应用不存在',
                data: null,
            }
        }

        // 如果只是切换禁用状态
        if (body.disabled !== undefined && Object.keys(body).length === 1) {
            application.disabled = body.disabled
            await repo.save(application)

            return {
                status: 200,
                success: true,
                message: `应用已${body.disabled ? '禁用' : '启用'}`,
                data: toAdminOAuthClientView(application),
            }
        }

        // 完整更新应用信息
        const validationResult = oauthApplicationUpdateSchema.safeParse(body)
        if (!validationResult.success) {
            return {
                status: 400,
                success: false,
                message: validationResult.error?.issues[0]?.message || '参数校验失败',
                data: null,
            }
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
            message: '应用更新成功',
            data: toAdminOAuthClientView(application),
        }
    } catch (error) {
        logger.business.oauthAppUpdated({
            appId: event.context.params?.id || 'unknown',
            updatedBy: auth.data.userId,
        })
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '更新应用失败',
            data: null,
        }
    }
})
