import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { createLocalizedError } from '@/server/utils/i18n'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    try {
        const method = getMethod(event)

        if (method !== 'GET') {
            throw await createLocalizedError(event, {
                statusCode: 405,
                statusMessage: 'Method Not Allowed',
                key: 'errors.sso.methodNotAllowed',
            })
        }

        const ssoProviderRepository = dataSource.getRepository(SSOProvider)

        // 只返回启用的 SSO 提供商的公开信息
        const providers = await ssoProviderRepository.find({
            where: { enabled: true },
            select: [
                'id',
                'type',
                'providerId',
                'name',
                'description',
                'domain',
                'issuer',
                'createdAt',
            ],
            order: {
                createdAt: 'DESC',
            },
        })

        return {
            success: true,
            data: providers,
        }
    } catch (error: any) {
        logger.error('Failed to get available SSO providers', {
            error: error.message,
            stack: error.stack,
        })

        if (error.statusCode) {
            throw error
        }

        throw await createLocalizedError(event, {
            statusCode: 500,
            statusMessage: 'Internal Server Error',
            key: 'errors.server.internal',
        })
    }
})
