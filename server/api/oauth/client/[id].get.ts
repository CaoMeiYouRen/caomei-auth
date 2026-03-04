import { defineEventHandler } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'

export default defineEventHandler(async (event) => {
    try {
        const paramsResult = await validateParamsSafe(event, idParamSchema)

        if (!paramsResult.success) {
            return paramsResult.error
        }

        const { id: clientId } = paramsResult.data

        const application = await dataSource
            .getRepository(OAuthApplication)
            .findOne({
                where: { clientId },
            })

        if (!application || application.disabled) {
            return {
                status: 404,
                success: false,
                message: '应用不存在或已被禁用',
                data: null,
            }
        }

        // 返回公开信息（不包含客户端密钥）
        return {
            status: 200,
            success: true,
            data: {
                id: application.id,
                clientId: application.clientId,
                name: application.name,
                description: application.description,
                clientUri: application.clientUri,
                logoUri: application.logoUri,
                scope: application.scope,
                tosUri: application.tosUri,
                policyUri: application.policyUri,
                type: application.type,
                // 不返回敏感信息
                // clientSecret: application.clientSecret,
                // redirectURLs: application.redirectURLs,
            },
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '获取应用信息失败',
            data: null,
        }
    }
})
