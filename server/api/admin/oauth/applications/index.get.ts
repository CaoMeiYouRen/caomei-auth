import { defineEventHandler, createError } from 'h3'
import { Like } from 'typeorm'
import { OAuthClient } from '@/server/entities/oauth-client'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { toAdminOAuthClientView } from '@/server/utils/oauth-client-view'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import { paginationQuerySchema, type PaginationQuery } from '@/utils/shared/api-schemas'
import { getServerI18n } from '@/server/utils/i18n'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)

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
            .getRepository(OAuthClient)
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
            data: applications.map((app) => toAdminOAuthClientView(app)),
        }
    } catch (error) {
        logger.business.oauthAppListFailed({
            error: error instanceof Error ? error.message : String(error),
            adminId: auth.data.userId,
        })
        return {
            status: 500,
            success: false,
            message: t('errors.admin.oauthAppListFailed'),
            data: null,
        }
    }
})
