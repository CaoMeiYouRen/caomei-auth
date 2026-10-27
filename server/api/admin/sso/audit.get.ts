import { defineEventHandler, createError } from 'h3'
import { In } from 'typeorm'
import { Account } from '@/server/entities/account'
import { SSOProvider } from '@/server/entities/sso-provider'
import { User } from '@/server/entities/user'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { isUserAdmin } from '@/server/utils/admin-role-sync'
import logger from '@/server/utils/logger'

/**
 * SSO 配置安全排查（只读）。
 *
 * 背景：GHSA-785j-54p4-vxw9。历史版本中 `/api/auth/sso/register` 只校验登录态，
 * 任意登录用户都能创建 SSO 提供商；这类提供商的所有者不是管理员，并可能已经通过
 * `trustEmailVerified` 链接到受害者的 `account` 记录。
 *
 * 本接口列出：
 * 1. `suspiciousProviders`：所有者缺失或所有者不是管理员的提供商；
 * 2. `suspiciousAccounts`：指向上述提供商的账号链接，即潜在的接管痕迹。
 *
 * 仅管理员可访问，不返回 clientSecret / oidcConfig 等敏感字段。
 * 处置方式：确认后删除对应 provider 与 account 记录（account 记录也可通过用户重新授权重建）。
 */
export default defineEventHandler(async (event) => {
    await checkAdmin(event)

    try {
        const providerRepo = dataSource.getRepository(SSOProvider)
        const userRepo = dataSource.getRepository(User)
        const accountRepo = dataSource.getRepository(Account)

        const providers = await providerRepo.find({
            select: [
                'id',
                'providerId',
                'name',
                'domain',
                'issuer',
                'userId',
                'enabled',
                'createdAt',
            ],
        })

        const ownerIds = [...new Set(providers.map((provider) => provider.userId).filter(Boolean))]
        const owners = ownerIds.length
            ? await userRepo.find({
                where: { id: In(ownerIds) },
                select: ['id', 'role'],
            })
            : []
        const ownerMap = new Map(owners.map((owner) => [owner.id, owner]))

        const suspiciousProviders = providers.filter((provider) => {
            const owner = ownerMap.get(provider.userId)
            return !owner || !isUserAdmin(owner, owner.id)
        })

        const suspiciousProviderIds = suspiciousProviders.map((provider) => provider.providerId)
        const suspiciousAccounts = suspiciousProviderIds.length
            ? await accountRepo.find({
                where: { providerId: In(suspiciousProviderIds) },
                select: ['id', 'userId', 'providerId', 'accountId', 'createdAt'],
            })
            : []

        return {
            success: true,
            data: {
                totalProviders: providers.length,
                suspiciousProviders,
                suspiciousAccounts,
            },
        }
    } catch (error: any) {
        logger.error('Failed to audit SSO providers', {
            error: error.message,
            stack: error.stack,
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
