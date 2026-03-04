import { defineEventHandler } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    let appId = 'unknown'
    try {
        const paramsResult = await validateParamsSafe(event, idParamSchema)

        if (!paramsResult.success) {
            return paramsResult.error
        }

        const { id } = paramsResult.data
        appId = id

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
        logger.business.oauthAppDeleted({
            appId,
            deletedBy: auth.data.userId,
        })
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '删除应用失败',
            data: null,
        }
    }
})
