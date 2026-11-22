import { defineEventHandler } from 'h3'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { queryLoginEvents, sanitizeLoginEventMetadata } from '@/server/utils/login-events/repository'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import type { LoginEvent } from '@/server/entities/login-event'
import { loginEventsQuerySchema, type LoginEventView, type LoginEventsQuery } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

/**
 * 登录事件查询（阶段 12 M2.1）。
 *
 * 只返回脱敏后的展示字段；metadata 在写入时已按白名单过滤，读取端再过滤一次
 * 以覆盖历史回填 / 手工 SQL 的异常数据。IP / UA 与既有会话视图同口径，仅管理员可见。
 * `ip` 过滤为 TEXT 列且无索引，请与时间窗组合使用（M2.3 默认 30 天）。
 */
function toLoginEventView(event: LoginEvent): LoginEventView {
    return {
        id: event.id,
        type: event.type,
        result: event.result,
        channel: event.channel,
        userId: event.userId ?? null,
        ip: event.ip ?? null,
        userAgent: event.userAgent ?? null,
        metadata: sanitizeLoginEventMetadata(event.metadata),
        createdAt: event.createdAt instanceof Date ? event.createdAt.toISOString() : String(event.createdAt),
    }
}

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const query: LoginEventsQuery = await validateQuery(event, loginEventsQuerySchema, {
        errorMap: createZodErrorMap(t),
    })

    try {
        const page = await queryLoginEvents({
            types: query.type ? [query.type] : undefined,
            results: query.result ? [query.result] : undefined,
            channels: query.channel ? [query.channel] : undefined,
            userId: query.userId,
            ip: query.ip,
            start: query.startDate ? new Date(query.startDate) : undefined,
            end: query.endDate ? new Date(query.endDate) : undefined,
            page: query.page,
            pageSize: query.limit,
            sort: query.sort,
        })

        return {
            success: true,
            data: {
                events: page.items.map(toLoginEventView),
                pagination: {
                    page: page.page,
                    limit: page.pageSize,
                    total: page.total,
                    totalPages: Math.ceil(page.total / page.pageSize),
                },
            },
        }
    } catch (error) {
        logger.error('Failed to query login events', {
            adminId: auth.data.userId,
            error: error instanceof Error ? error.message : String(error),
            queryParams: {
                page: query.page,
                limit: query.limit,
                type: query.type,
                result: query.result,
                channel: query.channel,
                userId: query.userId,
                ip: query.ip,
                startDate: query.startDate,
                endDate: query.endDate,
                sort: query.sort,
            },
        })
        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.internal',
        })
    }
})
