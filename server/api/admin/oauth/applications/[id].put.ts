import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

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
        if (body.client_name) {
            application.name = body.client_name
        }
        if (body.description !== undefined) {
            application.description = body.description
        }
        if (body.redirect_uris && Array.isArray(body.redirect_uris)) {
            application.redirectURLs = body.redirect_uris.join(',')
        }
        if (body.client_uri !== undefined) {
            application.clientUri = body.client_uri
        }
        if (body.logo_uri !== undefined) {
            application.logoUri = body.logo_uri
        }
        if (body.scope) {
            application.scope = body.scope
        }
        if (body.contacts && Array.isArray(body.contacts)) {
            application.contacts = body.contacts.join(',')
        }
        if (body.tos_uri !== undefined) {
            application.tosUri = body.tos_uri
        }
        if (body.policy_uri !== undefined) {
            application.policyUri = body.policy_uri
        }
        if (body.token_endpoint_auth_method) {
            application.tokenEndpointAuthMethod = body.token_endpoint_auth_method
        }
        if (body.grant_types && Array.isArray(body.grant_types)) {
            application.grantTypes = body.grant_types.join(',')
        }
        if (body.response_types && Array.isArray(body.response_types)) {
            application.responseTypes = body.response_types.join(',')
        }
        if (body.software_id !== undefined) {
            application.softwareId = body.software_id
        }
        if (body.software_version !== undefined) {
            application.softwareVersion = body.software_version
        }
        if (body.disabled !== undefined) {
            application.disabled = body.disabled
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
