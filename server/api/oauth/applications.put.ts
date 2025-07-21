import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    try {
        const body = await readBody(event)
        const {
            id,
            name,
            redirectURLs,
            type,
            metadata,
            disabled,
        } = body

        if (!id) {
            return {
                status: 400,
                success: false,
                message: '参数不完整',
                data: null,
            }
        }

        const repo = dataSource.getRepository(OAuthApplication)

        const application = await repo.findOne({
            where: { id },
        })

        if (!application) {
            return {
                status: 404,
                success: false,
                message: '应用不存在',
                data: null,
            }
        }

        if (name) {
            application.name = name
        }
        if (redirectURLs) {
            application.redirectURLs = redirectURLs
        }
        if (type) {
            application.type = type
        }
        if (metadata) {
            application.metadata = metadata
        }
        if (typeof disabled === 'boolean') {
            application.disabled = disabled
        }

        await repo.save(application)

        return {
            status: 200,
            success: true,
            message: '更新成功',
            data: {
                id: application.id,
                clientId: application.clientId,
                name: application.name,
                redirectURLs: application.redirectURLs,
                type: application.type,
                metadata: application.metadata ? JSON.parse(application.metadata) : null,
                disabled: application.disabled,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            },
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '更新应用失败',
            data: null,
        }
    }
})
