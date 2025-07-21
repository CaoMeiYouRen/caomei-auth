import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { generateRandomString } from '@/server/utils/random'

export default defineEventHandler(async (event) => {
    try {
        const auth = await checkAdmin(event)
        if (!auth.success) {
            return auth
        }

        const body = await readBody(event)
        const {
            name,
            redirectURLs,
            type,
            metadata,
        } = body

        if (!name || !redirectURLs || !type) {
            return {
                status: 400,
                success: false,
                message: '参数不完整',
                data: null,
            }
        }

        const application = new OAuthApplication()
        application.name = name
        application.clientId = generateRandomString(32)
        application.clientSecret = generateRandomString(64)
        application.redirectURLs = redirectURLs
        application.type = type
        application.metadata = metadata
        application.userId = auth.data?.userId || ''

        await dataSource.getRepository(OAuthApplication).save(application)

        return {
            status: 200,
            success: true,
            message: '创建成功',
            data: {
                id: application.id,
                clientId: application.clientId,
                name: application.name,
                redirectURLs: application.redirectURLs,
                type: application.type,
                metadata: application.metadata ? JSON.parse(application.metadata) : null,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            },
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '创建应用失败',
            data: null,
        }
    }
})
