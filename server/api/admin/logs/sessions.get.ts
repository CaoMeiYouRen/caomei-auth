import { defineEventHandler, getQuery } from 'h3'
import dayjs from 'dayjs'
import { dataSource } from '@/server/database'
import { Session } from '@/server/entities/session'
import { User } from '@/server/entities/user'
import { Account } from '@/server/entities/account'
import { checkAdmin } from '@/server/utils/check-admin'
import { parseUserAgent } from '@/utils/useragent'

interface SessionLogQuery {
    page?: number
    limit?: number
    userId?: string
    startDate?: string
    endDate?: string
    status?: 'active' | 'expired' | 'all'
    search?: string
}

export default defineEventHandler(async (event) => {
    // 检查管理员权限
    await checkAdmin(event)

    const query = getQuery<SessionLogQuery>(event)
    const {
        page = 1,
        limit = 20,
        userId,
        startDate,
        endDate,
        status = 'all',
        search,
    } = query

    try {
        const sessionRepo = dataSource.getRepository(Session)

        // 构建查询
        let queryBuilder = sessionRepo
            .createQueryBuilder('session')
            .leftJoinAndSelect('session.user', 'user')
            .orderBy('session.createdAt', 'DESC')

        // 添加筛选条件
        if (userId) {
            queryBuilder = queryBuilder.andWhere('session.userId = :userId', { userId })
        }

        if (search) {
            queryBuilder = queryBuilder.andWhere(
                '(user.name LIKE :search OR user.email LIKE :search OR session.ipAddress LIKE :search)',
                { search: `%${search}%` },
            )
        }

        if (startDate) {
            queryBuilder = queryBuilder.andWhere('session.createdAt >= :startDate', {
                startDate: dayjs(startDate).toDate(),
            })
        }

        if (endDate) {
            queryBuilder = queryBuilder.andWhere('session.createdAt <= :endDate', {
                endDate: dayjs(endDate).toDate(),
            })
        }

        if (status === 'active') {
            queryBuilder = queryBuilder.andWhere('session.expiresAt > :now', {
                now: dayjs().toDate(),
            })
        } else if (status === 'expired') {
            queryBuilder = queryBuilder.andWhere('session.expiresAt <= :now', {
                now: dayjs().toDate(),
            })
        }

        // 获取总数
        const total = await queryBuilder.getCount()

        // 获取分页数据
        const sessions = await queryBuilder
            .skip((page - 1) * limit)
            .take(limit)
            .getMany()

        // 处理会话数据
        const sessionLogs = sessions.map((session) => {
            const userAgent = parseUserAgent(session.userAgent || '')
            const isActive = dayjs(session.expiresAt).isAfter(dayjs())

            return {
                id: session.id,
                userId: session.userId,
                user: {
                    id: session.user.id,
                    name: session.user.name,
                    email: session.user.email,
                    image: session.user.image,
                },
                loginTime: session.createdAt,
                expiresAt: session.expiresAt,
                isActive,
                ipAddress: session.ipAddress,
                location: '未知', // 可以后续集成 IP 地理位置查询
                device: userAgent,
                provider: 'email', // 简化处理，后续可优化
                sessionToken: session.token,
            }
        })

        return {
            success: true,
            data: {
                sessions: sessionLogs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        }
    } catch (error) {
        console.error('获取登录日志失败:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            message: '获取登录日志失败',
        })
    }
})
