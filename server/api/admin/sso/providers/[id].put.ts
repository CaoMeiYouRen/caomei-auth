import { defineEventHandler, readBody, createError, getRouterParam } from 'h3'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { ssoProviderUpdateSchema } from '@/utils/shared/schemas'
import { resolveValidationMessage } from '@/utils/shared/zod-messages'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)
    const { t } = await getServerI18n(event)

    try {
        const providerId = getRouterParam(event, 'id')
        if (!providerId) {
            throw await createLocalizedError(event, {
                statusCode: 400,
                key: 'errors.admin.ssoProviderIdRequired',
            })
        }

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)
        const provider = await ssoProviderRepository.findOne({
            where: { id: providerId },
        })

        if (!provider) {
            throw await createLocalizedError(event, {
                statusCode: 404,
                key: 'errors.admin.ssoProviderNotFound',
            })
        }

        // 更新 SSO 提供商
        const body = await readBody(event)

        const validationResult = ssoProviderUpdateSchema.safeParse(body)
        if (!validationResult.success) {
            throw createError({
                statusCode: 400,
                statusMessage: resolveValidationMessage(validationResult.error?.issues[0]?.message, t) || t('errors.admin.paramsInvalid'),
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
            message: t('errors.admin.ssoUpdated'),
        }
    } catch (error: any) {
        logger.error('Failed to update SSO provider', {
            error: error.message,
            providerId: getRouterParam(event, 'id'),
        })

        if (error.statusCode) {
            throw error
        }

        throw await createLocalizedError(event, {
            statusCode: 500,
            key: 'errors.server.internal',
        })
    }
})
