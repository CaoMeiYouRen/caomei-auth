import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { ssoProviderUpdateSchema } from '@/utils/shared/schemas'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)

    try {
        const providerId = getRouterParam(event, 'id')
        if (!providerId) {
            throw createError({
                statusCode: 400,
                statusMessage: '缺少提供商 ID',
            })
        }

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)
        const provider = await ssoProviderRepository.findOne({
            where: { id: providerId },
        })

        if (!provider) {
            throw createError({
                statusCode: 404,
                statusMessage: 'SSO 提供商不存在',
            })
        }

        // 更新 SSO 提供商
        const body = await readBody(event)

        const validationResult = ssoProviderUpdateSchema.safeParse(body)
        if (!validationResult.success) {
            throw createError({
                statusCode: 400,
                statusMessage: validationResult.error?.issues[0]?.message || '参数校验失败',
            })
        }

        const validatedData = validationResult.data

        // 允许更新的字段
        const allowedFields = [
            'name',
            'description',
            'issuer',
            'domain',
            'organizationId',
            'enabled',
            'metadataUrl',
            'clientId',
            'clientSecret',
            'redirectUri',
            'scopes',
            'oidcConfig',
            'samlConfig',
            'additionalConfig',
        ]

        // 过滤并应用更新
        for (const field of allowedFields) {
            if (field in validatedData) {
                if (field === 'oidcConfig' || field === 'samlConfig' || field === 'additionalConfig') {
                    // 确保配置是字符串格式
                    if (validatedData[field]) {
                        (provider as any)[field] = JSON.stringify(validatedData[field])
                    }
                } else {
                    (provider as any)[field] = validatedData[field as keyof typeof validatedData]
                }
            }
        }

        const updatedProvider = await ssoProviderRepository.save(provider)

        return {
            success: true,
            data: updatedProvider,
            message: 'SSO 提供商更新成功',
        }
    } catch (error: any) {
        logger.error('Failed to update SSO provider', {
            error: error.message,
            providerId: getRouterParam(event, 'id'),
        })

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
