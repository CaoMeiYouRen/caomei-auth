import { defineEventHandler, readBody } from 'h3'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { dataSource } from '@/server/database'
import { getUserSession } from '@/server/utils/get-user-session'

export default defineEventHandler(async (event) => {
    try {
        const userSession = await getUserSession(event)

        if (!userSession?.user?.id) {
            throw createError({
                statusCode: 401,
                statusMessage: 'Unauthorized',
                message: '请先登录',
            })
        }

        const body = await readBody(event)
        const { clientId } = body

        if (!clientId) {
            return {
                status: 400,
                success: false,
                message: '缺少客户端ID',
                data: null,
            }
        }

        const userId = userSession.user.id

        // 删除用户对该应用的授权同意
        const result = await dataSource
            .getRepository(OAuthConsent)
            .delete({
                userId,
                clientId,
            })

        if (result.affected === 0) {
            return {
                status: 404,
                success: false,
                message: '未找到对该应用的授权记录',
                data: null,
            }
        }

        return {
            status: 200,
            success: true,
            message: '成功撤销授权',
            data: null,
        }
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            throw error
        }

        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '撤销授权失败',
            data: null,
        }
    }
})
