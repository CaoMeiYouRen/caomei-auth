// coding=utf-8
import { defineEventHandler } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

export default defineEventHandler(async (event) => {
    try {
        const auth = await checkAdmin(event)
        if (!auth.success) {
            return auth
        }

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
                metadata: app.metadata ? JSON.parse(app.metadata) : null,
                redirectURLs: app.redirectURLs,
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
