import { authClient } from '@/lib/auth-client'
import { SSOProvider } from '@/server/entities/sso-provider'
import { dataSource } from '@/server/database'

export default defineEventHandler(async (event) => {
    try {
        // 验证管理员权限
        const session = await authClient.getSession({
            fetchOptions: {
                headers: getHeaders(event),
            },
        })

        if (!session?.data?.user) {
            throw createError({
                statusCode: 401,
                statusMessage: '未登录',
            })
        }

        // 检查管理员权限
        if (!session.data.user.role || !['admin'].includes(session.data.user.role)) {
            throw createError({
                statusCode: 403,
                statusMessage: '权限不足',
            })
        }

        const method = getMethod(event)

        if (method === 'GET') {
            // 获取 SSO 提供商列表
            const ssoProviderRepository = dataSource.getRepository(SSOProvider)

            const providers = await ssoProviderRepository.find({
                order: {
                    createdAt: 'DESC',
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
                    } catch (error) {
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
                    } catch (error) {
                        // 忽略解析错误
                    }
                }

                return sanitized
            })

            return {
                success: true,
                data: sanitizedProviders,
            }
        } if (method === 'POST') {
            // 创建 SSO 提供商
            const body = await readBody(event)

            const {
                type,
                providerId,
                name,
                description,
                issuer,
                domain,
                organizationId,
                enabled,
                oidcConfig,
                samlConfig,
            } = body

            // 验证必填字段
            if (!type || !providerId || !issuer || !domain) {
                throw createError({
                    statusCode: 400,
                    statusMessage: '缺少必填字段',
                })
            }

            // 验证协议类型
            if (!['oidc', 'saml'].includes(type)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: '不支持的协议类型',
                })
            }

            // 验证协议特定配置
            if (type === 'oidc' && (!oidcConfig || !oidcConfig.clientId || !oidcConfig.clientSecret)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'OIDC 配置缺少必填字段',
                })
            }

            if (type === 'saml' && (!samlConfig || !samlConfig.entryPoint || !samlConfig.certificate)) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'SAML 配置缺少必填字段',
                })
            }

            const ssoProviderRepository = dataSource.getRepository(SSOProvider)

            // 检查 providerId 是否已存在
            const existingProvider = await ssoProviderRepository.findOne({
                where: { providerId },
            })

            if (existingProvider) {
                throw createError({
                    statusCode: 409,
                    statusMessage: 'Provider ID 已存在',
                })
            }

            // 创建新的 SSO 提供商
            const newProvider = ssoProviderRepository.create({
                type,
                providerId,
                name: name || providerId,
                description,
                issuer,
                domain,
                organizationId: organizationId || null,
                enabled: enabled !== false,
                userId: session.data.user.id,
                oidcConfig: type === 'oidc' ? JSON.stringify(oidcConfig) : null,
                samlConfig: type === 'saml' ? JSON.stringify(samlConfig) : null,
            })

            const savedProvider = await ssoProviderRepository.save(newProvider)

            return {
                success: true,
                data: savedProvider,
                message: 'SSO 提供商创建成功',
            }
        }

        throw createError({
            statusCode: 405,
            statusMessage: '方法不允许',
        })
    } catch (error: any) {
        console.error('SSO 提供商管理错误:', error)

        if (error.statusCode) {
            throw error
        }

        throw createError({
            statusCode: 500,
            statusMessage: error.message || '服务器内部错误',
        })
    }
})
