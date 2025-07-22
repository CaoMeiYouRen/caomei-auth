import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    try {
        const body = await readBody(event)
        const {
            id,
            client_name,
            name, // 向后兼容
            description,
            redirect_uris,
            redirectURLs, // 向后兼容
            client_uri,
            logo_uri,
            scope,
            contacts,
            tos_uri,
            policy_uri,
            token_endpoint_auth_method,
            grant_types,
            response_types,
            software_id,
            software_version,
            software_statement,
            type,
            metadata,
            disabled,
        } = body

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

        // 更新应用名称
        const appName = client_name || name
        if (appName) {
            application.name = appName
        }

        // 更新应用描述
        if (description !== undefined) {
            application.description = description
        }

        // 更新重定向 URL
        const appRedirectURIs = redirect_uris || (typeof redirectURLs === 'string' ? redirectURLs.split(',') : redirectURLs)
        if (appRedirectURIs) {
            // 验证重定向URI格式
            for (const uri of appRedirectURIs) {
                try {
                    new URL(uri)
                } catch {
                    return {
                        status: 400,
                        success: false,
                        message: `无效的重定向URI：${uri}`,
                        data: null,
                    }
                }
            }
            application.redirectURLs = Array.isArray(appRedirectURIs) ? appRedirectURIs.join(',') : appRedirectURIs
        }

        // 更新认证方法
        if (token_endpoint_auth_method) {
            application.tokenEndpointAuthMethod = token_endpoint_auth_method
        }

        // 更新授权类型
        if (grant_types) {
            application.grantTypes = Array.isArray(grant_types) ? grant_types.join(',') : grant_types
        }

        // 更新响应类型
        if (response_types) {
            application.responseTypes = Array.isArray(response_types) ? response_types.join(',') : response_types
        }

        // 更新应用URI
        if (client_uri !== undefined) {
            application.clientUri = client_uri
        }

        // 更新Logo URI
        if (logo_uri !== undefined) {
            application.logoUri = logo_uri
        }

        // 更新授权范围
        if (scope !== undefined) {
            application.scope = scope
        }

        // 更新联系方式
        if (contacts !== undefined) {
            application.contacts = Array.isArray(contacts) ? contacts.join(',') : contacts
        }

        // 更新服务条款URI
        if (tos_uri !== undefined) {
            application.tosUri = tos_uri
        }

        // 更新隐私政策URI
        if (policy_uri !== undefined) {
            application.policyUri = policy_uri
        }

        // 更新软件ID
        if (software_id !== undefined) {
            application.softwareId = software_id
        }

        // 更新软件版本
        if (software_version !== undefined) {
            application.softwareVersion = software_version
        }

        // 更新软件声明
        if (software_statement !== undefined) {
            application.softwareStatement = software_statement
        }

        // 更新应用类型
        if (type) {
            application.type = type
        }

        // 更新元数据
        if (metadata) {
            application.metadata = typeof metadata === 'string' ? metadata : JSON.stringify(metadata)
        }

        // 更新禁用状态
        if (typeof disabled === 'boolean') {
            application.disabled = disabled
        }

        await repo.save(application)

        return {
            status: 200,
            success: true,
            message: '更新成功',
            data: {
                id: application.id,
                clientId: application.clientId,
                name: application.name,
                description: application.description,
                redirectURLs: application.redirectURLs,
                tokenEndpointAuthMethod: application.tokenEndpointAuthMethod,
                grantTypes: application.grantTypes,
                responseTypes: application.responseTypes,
                clientUri: application.clientUri,
                logoUri: application.logoUri,
                scope: application.scope,
                contacts: application.contacts,
                tosUri: application.tosUri,
                policyUri: application.policyUri,
                jwksUri: application.jwksUri,
                jwks: application.jwks && application.jwks !== '' ? JSON.parse(application.jwks) : null,
                metadata: application.metadata && application.metadata !== '' ? JSON.parse(application.metadata) : null,
                softwareId: application.softwareId,
                softwareVersion: application.softwareVersion,
                softwareStatement: application.softwareStatement,
                type: application.type,
                disabled: application.disabled,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            },
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '更新应用失败',
            data: null,
        }
    }
})
