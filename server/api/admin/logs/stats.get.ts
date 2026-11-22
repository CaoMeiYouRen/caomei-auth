import { defineEventHandler } from 'h3'
import dayjs from 'dayjs'
import { dataSource } from '@/server/database'
import { Session } from '@/server/entities/session'
import { User } from '@/server/entities/user'
import { Account } from '@/server/entities/account'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import { logStatsQuerySchema, type LogStatsQuery } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { pruneLoginEventsIfDue } from '@/server/utils/login-events/retention'

export default defineEventHandler(async (event) => {
    // 检查管理员权限
    await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const filters: LogStatsQuery = await validateQuery(event, logStatsQuerySchema, { errorMap: createZodErrorMap(t) })

    try {
        /* 登录事件保留期惰性清理：进程内 1 小时节流，失败不影响统计 */
        void pruneLoginEventsIfDue().catch(() => undefined)

        const sessionRepo = dataSource.getRepository(Session)
        const userRepo = dataSource.getRepository(User)
        const accountRepo = dataSource.getRepository(Account)

        // 获取统计数据的基础查询
        const now = dayjs()
        const today = now.startOf('day').toDate()
        const yesterday = now.subtract(1, 'day').startOf('day').toDate()
        const weekAgo = now.subtract(7, 'day').startOf('day').toDate()
        const monthAgo = now.subtract(30, 'day').startOf('day').toDate()

        /** 会话类统计共用筛选：搜索（用户 / 邮箱 / IP 模糊）、IP 精确、时间范围、状态 */
        const sessionQuery = () => {
            const queryBuilder = sessionRepo.createQueryBuilder('session')
            if (filters.search) {
                queryBuilder
                    .leftJoin('session.user', 'user')
                    .andWhere('(user.name LIKE :search OR user.email LIKE :search OR session.ipAddress LIKE :search)', {
                        search: `%${filters.search}%`,
                    })
            }
            if (filters.ip) {
                queryBuilder.andWhere('session.ipAddress = :ip', { ip: filters.ip })
            }
            if (filters.startDate) {
                queryBuilder.andWhere('session.createdAt >= :filterStart', { filterStart: dayjs(filters.startDate).toDate() })
            }
            if (filters.endDate) {
                queryBuilder.andWhere('session.createdAt <= :filterEnd', { filterEnd: dayjs(filters.endDate).toDate() })
            }
            if (filters.status === 'active') {
                queryBuilder.andWhere('session.expiresAt > :now', { now: now.toDate() })
            } else if (filters.status === 'expired') {
                queryBuilder.andWhere('session.expiresAt <= :now', { now: now.toDate() })
            }
            return queryBuilder
        }

        // 总体统计（用户数不随会话筛选变化）
        const totalUsers = await userRepo.count()
        const totalSessions = await sessionQuery().getCount()
        let activeSessions = 0
        if (filters.status === 'active') {
            activeSessions = totalSessions
        } else if (filters.status !== 'expired') {
            activeSessions = await sessionQuery()
                .andWhere('session.expiresAt > :activeNow', { activeNow: now.toDate() })
                .getCount()
        }

        // 今日统计
        const todaySessions = await sessionQuery()
            .andWhere('session.createdAt >= :today', { today })
            .getCount()

        // 昨日统计
        const yesterdaySessions = await sessionQuery()
            .andWhere('session.createdAt >= :yesterday AND session.createdAt < :today', {
                yesterday,
                today,
            })
            .getCount()

        // 本周统计
        const weekSessions = await sessionQuery()
            .andWhere('session.createdAt >= :weekAgo', { weekAgo })
            .getCount()

        // 本月统计
        const monthSessions = await sessionQuery()
            .andWhere('session.createdAt >= :monthAgo', { monthAgo })
            .getCount()

        // 登录方式统计
        const providerStats = await accountRepo
            .createQueryBuilder('account')
            .select('account.providerId', 'provider')
            .addSelect('COUNT(*)', 'count')
            .groupBy('account.providerId')
            .getRawMany()

        // 近期活跃用户（过去7天有登录的用户）
        const activeUsers = await sessionRepo
            .createQueryBuilder('session')
            .select('COUNT(DISTINCT session.userId)', 'count')
            .where('session.createdAt >= :weekAgo', { weekAgo })
            .getRawOne()

        // 每日登录趋势（过去30天）
        const dailyTrend = await sessionQuery()
            .select('DATE(session.createdAt)', 'date')
            .addSelect('COUNT(*)', 'count')
            .andWhere('session.createdAt >= :monthAgo', { monthAgo })
            .groupBy('DATE(session.createdAt)')
            .orderBy('DATE(session.createdAt)', 'ASC')
            .getRawMany()

        return {
            success: true,
            data: {
                overview: {
                    totalUsers,
                    totalSessions,
                    activeSessions,
                    activeUsers: parseInt(activeUsers?.count || '0'),
                },
                periods: {
                    today: todaySessions,
                    yesterday: yesterdaySessions,
                    week: weekSessions,
                    month: monthSessions,
                },
                providers: providerStats.map((item) => ({
                    provider: item.provider,
                    count: parseInt(item.count),
                })),
                trend: dailyTrend.map((item) => ({
                    date: item.date,
                    count: parseInt(item.count),
                })),
            },
        }
    } catch (error) {
        logger.error('Failed to get login stats', {
            error: error instanceof Error ? error.message : String(error),
        })
        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.admin.logsStatsFailed',
        })
    }
})
