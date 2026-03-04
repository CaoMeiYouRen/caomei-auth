import { defineEventHandler, createError } from 'h3'
import { Like } from 'typeorm'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import { paginationQuerySchema, type PaginationQuery } from '@/utils/shared/api-schemas'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)

    // 使用 Zod 校验查询参数
    const query: PaginationQuery = await validateQuery(event, paginationQuerySchema)
    const { page, limit, search, sortField, sortOrder } = query

    try {
        let where: any = {}
        if (search) {
            where = [
                { name: Like(`%${search}%`) },
                { description: Like(`%${search}%`) },
                { clientId: Like(`%${search}%`) },
            ]
        }

        const [applications, total] = await dataSource
            .getRepository(OAuthApplication)
            .findAndCount({
                where,
                skip: page * limit,
                take: limit,
                order: {
                    [sortField]: sortOrder,
                },
            })

        return {
            status: 200,
            success: true,
            total,
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
        logger.business.oauthAppListFailed({
            error: error instanceof Error ? error.message : String(error),
            adminId: auth.data.userId,
        })
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '获取应用列表失败',
            data: null,
        }
    }
})
