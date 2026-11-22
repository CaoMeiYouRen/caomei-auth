import { defineEventHandler } from 'h3'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { getLoginEventStats } from '@/server/utils/login-events/repository'
import { pruneLoginEventsIfDue } from '@/server/utils/login-events/retention'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import { loginEventStatsQuerySchema, type LoginEventStatsQuery } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

/**
 * 登录事件统计（阶段 12 M2.2）。
 *
 * 与列表查询共用筛选条件；统计查询顺带触发保留期惰性清理（进程内 1 小时节流）。
 * 空数据返回零值，前端无需为缺失枚举补 0。
 */
export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const query: LoginEventStatsQuery = await validateQuery(event, loginEventStatsQuerySchema, {
        errorMap: createZodErrorMap(t),
    })

    /* 清理失败已在 retention 层记录 warn；await 避免与聚合并发导致单次响应数字不自洽 */
    await pruneLoginEventsIfDue().catch(() => undefined)

    try {
        const stats = await getLoginEventStats({
            types: query.type ? [query.type] : undefined,
            results: query.result ? [query.result] : undefined,
            channels: query.channel ? [query.channel] : undefined,
            userId: query.userId,
            ip: query.ip,
            start: query.startDate ? new Date(query.startDate) : undefined,
            end: query.endDate ? new Date(query.endDate) : undefined,
        })
        return { success: true, data: stats }
    } catch (error) {
        logger.error('Failed to get login event stats', {
            adminId: auth.data.userId,
            error: error instanceof Error ? error.message : String(error),
            queryParams: {
                type: query.type,
                result: query.result,
                channel: query.channel,
                userId: query.userId,
                ip: query.ip,
                startDate: query.startDate,
                endDate: query.endDate,
            },
        })
        throw await createLocalizedError(event, { statusCode: 500, key: 'errors.admin.logsStatsFailed' })
    }
})
