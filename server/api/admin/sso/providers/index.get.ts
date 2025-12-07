import { defineEventHandler, getQuery } from 'h3'
import { Like } from 'typeorm'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)
    const query = getQuery(event)

    const page = Number(query.page) || 0
    const limit = Number(query.limit) || 10
    const search = (query.search as string) || ''
    const type = (query.type as string) || ''
    const enabled = query.enabled as string
    const sortField = (query.sortField as string) || 'createdAt'
    const sortOrder = (query.sortOrder as string) || 'DESC'

    try {
        // 获取 SSO 提供商列表
        const ssoProviderRepository = dataSource.getRepository(SSOProvider)

        let where: any[] = []
        if (search) {
            where = [
                { name: Like(`%${search}%`) },
                { providerId: Like(`%${search}%`) },
                { domain: Like(`%${search}%`) },
                { issuer: Like(`%${search}%`) },
            ]
        } else {
            where = [{}]
        }

        where = where.map((cond) => {
            if (type) {
                cond.type = type
            }
            if (enabled !== undefined && enabled !== '') {
                cond.enabled = enabled === 'true'
            }
            return cond
        })

        const [providers, total] = await ssoProviderRepository.findAndCount({
            where,
            skip: page * limit,
            take: limit,
            order: {
                [sortField]: sortOrder.toUpperCase(),
            },
            relations: ['user'],
        })

        // 隐藏敏感信息
        const sanitizedProviders = providers.map((provider) => {
            const sanitized = { ...provider }

            // 隐藏客户端密钥等敏感信息
            if (sanitized.oidcConfig) {
                try {
                    const oidcConfig = typeof sanitized.oidcConfig === 'string'
                        ? JSON.parse(sanitized.oidcConfig)
                        : sanitized.oidcConfig

                    if (oidcConfig.clientSecret) {
                        oidcConfig.clientSecret = '***'
                    }

                    sanitized.oidcConfig = JSON.stringify(oidcConfig)
                } catch {
                    // 忽略解析错误
                }
            }

            if (sanitized.samlConfig) {
                try {
                    const samlConfig = typeof sanitized.samlConfig === 'string'
                        ? JSON.parse(sanitized.samlConfig)
                        : sanitized.samlConfig

                    if (samlConfig.signingKey) {
                        samlConfig.signingKey = '***'
                    }

                    sanitized.samlConfig = JSON.stringify(samlConfig)
                } catch {
                    // 忽略解析错误
                }
            }

            // 隐藏实体中的敏感字段
            if (sanitized.clientSecret) {
                sanitized.clientSecret = '***'
            }

            return sanitized
        })

        return {
            success: true,
            data: sanitizedProviders,
            total,
        }
    } catch (error: any) {
        logger.error('Failed to get SSO providers list', {
            error: error.message,
        })

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
