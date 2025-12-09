import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
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

        const repo = dataSource.getRepository(OAuthApplication)

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
                data: application,
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

        if (validatedData.client_name) {
            application.name = validatedData.client_name
        }
        if (validatedData.description !== undefined) {
            application.description = validatedData.description
        }
        if (validatedData.redirect_uris && Array.isArray(validatedData.redirect_uris)) {
            application.redirectURLs = validatedData.redirect_uris.join(',')
        }
        if (validatedData.client_uri !== undefined) {
            application.clientUri = validatedData.client_uri
        }
        if (validatedData.logo_uri !== undefined) {
            application.logoUri = validatedData.logo_uri
        }
        if (validatedData.scope) {
            application.scope = validatedData.scope
        }
        if (validatedData.contacts && Array.isArray(validatedData.contacts)) {
            application.contacts = validatedData.contacts.join(',')
        }
        if (validatedData.tos_uri !== undefined) {
            application.tosUri = validatedData.tos_uri
        }
        if (validatedData.policy_uri !== undefined) {
            application.policyUri = validatedData.policy_uri
        }
        if (validatedData.token_endpoint_auth_method) {
            application.tokenEndpointAuthMethod = validatedData.token_endpoint_auth_method
        }
        if (validatedData.grant_types && Array.isArray(validatedData.grant_types)) {
            application.grantTypes = validatedData.grant_types.join(',')
        }
        if (validatedData.response_types && Array.isArray(validatedData.response_types)) {
            application.responseTypes = validatedData.response_types.join(',')
        }
        if (validatedData.software_id !== undefined) {
            application.softwareId = validatedData.software_id
        }
        if (validatedData.software_version !== undefined) {
            application.softwareVersion = validatedData.software_version
        }
        if (validatedData.disabled !== undefined) {
            application.disabled = validatedData.disabled
        }

        await repo.save(application)

        return {
            status: 200,
            success: true,
            message: '应用更新成功',
            data: application,
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
