import { defineEventHandler } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'

export default defineEventHandler(async (event) => {
    const id = event.context.params?.id

    try {
        if (!id) {
            return {
                status: 400,
                success: false,
                message: '应用ID不能为空',
                data: null,
            }
        }
        const application = await dataSource
            .getRepository(OAuthApplication)
            .findOneBy({ id })

        if (!application) {
            return {
                status: 404,
                success: false,
                message: '应用未找到',
                data: null,
            }
        }

        return {
            status: 200,
            success: true,
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
            message: error instanceof Error ? error.message : '获取应用详情失败',
            data: null,
        }
    }
})
