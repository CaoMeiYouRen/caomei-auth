import { defineEventHandler } from 'h3'
import { OAuthClient } from '@/server/entities/oauth-client'
import { OAuthAccessToken } from '@/server/entities/oauth-access-token'
import { OAuthRefreshToken } from '@/server/entities/oauth-refresh-token'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { OAuthClientResource } from '@/server/entities/oauth-client-resource'
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

        const repo = dataSource.getRepository(OAuthClient)

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

        // 清理客户端关联的令牌、授权同意与资源绑定，避免残留孤儿数据
        await dataSource.getRepository(OAuthAccessToken).delete({ clientId: application.clientId })
        await dataSource.getRepository(OAuthRefreshToken).delete({ clientId: application.clientId })
        await dataSource.getRepository(OAuthConsent).delete({ clientId: application.clientId })
        await dataSource.getRepository(OAuthClientResource).delete({ clientId: application.clientId })

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
