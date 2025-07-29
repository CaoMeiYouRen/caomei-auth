import { defineEventHandler } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)

    try {
        const applications = await dataSource
            .getRepository(OAuthApplication)
            .find()

        return {
            status: 200,
            success: true,
            data: applications.map((app) => ({
                id: app.id,
                clientId: app.clientId,
                name: app.name,
                description: app.description,
                redirectURLs: app.redirectURLs,
                tokenEndpointAuthMethod: app.tokenEndpointAuthMethod,
                grantTypes: app.grantTypes,
                responseTypes: app.responseTypes,
                clientUri: app.clientUri,
                logoUri: app.logoUri,
                scope: app.scope,
                contacts: app.contacts,
                tosUri: app.tosUri,
                policyUri: app.policyUri,
                jwksUri: app.jwksUri,
                jwks: app.jwks && app.jwks !== '' ? JSON.parse(app.jwks) : null,
                metadata: app.metadata && app.metadata !== '' ? JSON.parse(app.metadata) : null,
                softwareId: app.softwareId,
                softwareVersion: app.softwareVersion,
                softwareStatement: app.softwareStatement,
                type: app.type,
                disabled: app.disabled,
                createdAt: app.createdAt,
                updatedAt: app.updatedAt,
            })),
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '获取应用列表失败',
            data: null,
        }
    }
})
