import { defineEventHandler } from 'h3'
import dayjs from 'dayjs'
import { dataSource } from '@/server/database'
import { Session } from '@/server/entities/session'
import { User } from '@/server/entities/user'
import { Account } from '@/server/entities/account'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    // 检查管理员权限
    await checkAdmin(event)

    try {
        const sessionRepo = dataSource.getRepository(Session)
        const userRepo = dataSource.getRepository(User)
        const accountRepo = dataSource.getRepository(Account)

        // 获取统计数据的基础查询
        const now = dayjs()
        const today = now.startOf('day').toDate()
        const yesterday = now.subtract(1, 'day').startOf('day').toDate()
        const weekAgo = now.subtract(7, 'day').startOf('day').toDate()
        const monthAgo = now.subtract(30, 'day').startOf('day').toDate()

        // 总体统计
        const totalUsers = await userRepo.count()
        const totalSessions = await sessionRepo.count()
        const activeSessions = await sessionRepo
            .createQueryBuilder('session')
            .where('session.expiresAt > :now', { now: now.toDate() })
            .getCount()

        // 今日统计
        const todaySessions = await sessionRepo
            .createQueryBuilder('session')
            .where('session.createdAt >= :today', { today })
            .getCount()

        // 昨日统计
        const yesterdaySessions = await sessionRepo
            .createQueryBuilder('session')
            .where('session.createdAt >= :yesterday AND session.createdAt < :today', {
                yesterday,
                today,
            })
            .getCount()

        // 本周统计
        const weekSessions = await sessionRepo
            .createQueryBuilder('session')
            .where('session.createdAt >= :weekAgo', { weekAgo })
            .getCount()

        // 本月统计
        const monthSessions = await sessionRepo
            .createQueryBuilder('session')
            .where('session.createdAt >= :monthAgo', { monthAgo })
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
        const dailyTrend = await sessionRepo
            .createQueryBuilder('session')
            .select('DATE(session.createdAt)', 'date')
            .addSelect('COUNT(*)', 'count')
            .where('session.createdAt >= :monthAgo', { monthAgo })
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
        console.error('获取登录统计失败:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: '获取登录统计失败',
        })
    }
})
