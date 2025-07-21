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

        const id = event.context.params?.id

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

        await repo.remove(application)

        return {
            status: 200,
            success: true,
            message: '删除成功',
            data: null,
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '删除应用失败',
            data: null,
        }
    }
})
