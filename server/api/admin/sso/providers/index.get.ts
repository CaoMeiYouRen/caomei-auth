import { defineEventHandler, createError } from 'h3'
import { Like } from 'typeorm'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateQuery } from '@/server/utils/validation'
import { ssoProvidersQuerySchema, type SSOProvidersQuery } from '@/utils/shared/api-schemas'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)

    // 使用 Zod 校验查询参数
    const query: SSOProvidersQuery = await validateQuery(event, ssoProvidersQuerySchema)
    const { page, limit, search, sortField, sortOrder, type, enabled } = query

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
            if (enabled !== undefined) {
                cond.enabled = enabled
            }
            return cond
        })

        const [providers, total] = await ssoProviderRepository.findAndCount({
            where,
            skip: page * limit,
            take: limit,
            order: {
                [sortField]: sortOrder,
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
