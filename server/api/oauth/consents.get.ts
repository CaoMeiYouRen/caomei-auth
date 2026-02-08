import { defineEventHandler } from 'h3'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { OAuthApplication } from '@/server/entities/oauth-application'
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

        const userId = userSession.user.id

        // 获取用户所有的同意记录
        const consents = await dataSource
            .getRepository(OAuthConsent)
            .createQueryBuilder('consent')
            .leftJoinAndSelect(OAuthApplication, 'app', 'app.clientId = consent.clientId')
            .where('consent.userId = :userId', { userId })
            .andWhere('consent.consentGiven = :consentGiven', { consentGiven: true })
            .getRawAndEntities()

        // 处理查询结果，合并应用信息
        const authorizedApps: {
            id: string
            clientId: string
            consentedAt: Date
            scopes: string[]
            application: {
                name: string
                description: string
                logoUri: string
                clientUri: string
                tosUri: string
                policyUri: string
            }
        }[] = []
        for (const consent of consents.entities) {
            const application = await dataSource
                .getRepository(OAuthApplication)
                .findOne({
                    where: { clientId: consent.clientId },
                })

            if (application && !application.disabled) {
                authorizedApps.push({
                    id: consent.id,
                    clientId: consent.clientId,
                    consentedAt: consent.createdAt,
                    scopes: consent.scopes ? consent.scopes.split(',') : [],
                    application: {
                        name: application.name,
                        description: application.description,
                        logoUri: application.logoUri,
                        clientUri: application.clientUri,
                        tosUri: application.tosUri,
                        policyUri: application.policyUri,
                    },
                })
            }
        }

        return {
            status: 200,
            success: true,
            data: authorizedApps,
        }
    } catch (error) {
        if (error instanceof Error && 'statusCode' in error) {
            throw error
        }

        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '获取授权应用列表失败',
            data: null,
        }
    }
})
