// coding=utf-8
import { defineEventHandler, getQuery } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'

export default defineEventHandler(async (event) => {
    const query = getQuery(event)
    const { clientId } = query

    if (!clientId) {
        return {
            status: 400,
            success: false,
            message: '缺少 clientId 参数',
        }
    }

    try {
        const application = await dataSource
            .getRepository(OAuthApplication)
            .findOne({
                where: { clientId: clientId as string },
            })

        if (!application) {
            return {
                status: 404,
                success: false,
                message: '应用不存在',
            }
        }

        if (application.disabled) {
            return {
                status: 403,
                success: false,
                message: '应用已被禁用',
            }
        }

        return {
            status: 200,
            success: true,
            data: {
                id: application.id,
                clientId: application.clientId,
                name: application.name,
                metadata: application.metadata ? JSON.parse(application.metadata) : null,
            },
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '获取应用信息失败',
        }
    }
})
