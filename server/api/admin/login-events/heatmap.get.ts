import { defineEventHandler } from 'h3'
import { checkAdmin } from '@/server/utils/check-admin'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { getLoginEventHeatmap } from '@/server/utils/login-events/repository'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import { loginEventHeatmapQuerySchema, type LoginEventHeatmapQuery } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'

/**
 * 登录事件热力图（阶段 12 M3.1）。
 *
 * `days=7` 返回 168 个小时桶，`days=30` 返回 30 个天桶；行固定为 7 类事件，
 * 空桶补零。筛选条件与列表 / 统计共用，时间桶按 UTC 生成并由前端负责展示。
 */
export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const query: LoginEventHeatmapQuery = await validateQuery(event, loginEventHeatmapQuerySchema, {
        errorMap: createZodErrorMap(t),
    })

    try {
        const heatmap = await getLoginEventHeatmap({
            types: query.type ? [query.type] : undefined,
            results: query.result ? [query.result] : undefined,
            channels: query.channel ? [query.channel] : undefined,
            userId: query.userId,
            ip: query.ip,
            start: query.startDate ? new Date(query.startDate) : undefined,
            end: query.endDate ? new Date(query.endDate) : undefined,
        }, { days: query.days as 7 | 30 })
        return { success: true, data: heatmap }
    } catch (error) {
        logger.error('Failed to get login event heatmap', {
            adminId: auth.data.userId,
            error: error instanceof Error ? error.message : String(error),
            queryParams: {
                days: query.days,
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
