import crypto from 'crypto'
import { defineEventHandler, readBody } from 'h3'
import { OAuthApplication } from '@/server/entities/oauth-application'
import { dataSource } from '@/server/database'
import { getUserSession } from '@/server/utils/get-user-session'
import { snowflake } from '@/server/utils/snowflake'

function generateSecureRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    const array = new Uint32Array(length)

        crypto.getRandomValues(array)
        for (let i = 0; i < length; i++) {
            result += chars[array[i] % chars.length]
        }

    return result
}

export default defineEventHandler(async (event) => {
    try {
        const session = await getUserSession(event)
        if (!session?.userId) {
            return {
                status: 401,
                success: false,
                message: '未登录',
            }
        }

        const body = await readBody(event)
        const { name, description, redirectURLs } = body

        if (!name || !redirectURLs) {
            return {
                status: 400,
                success: false,
                message: '缺少必要参数',
            }
        }

        // 检查重定向 URL 是否合法
        const urlList = Array.isArray(redirectURLs) ? redirectURLs : redirectURLs.split(',')
        for (const url of urlList) {
            try {
                new URL(url.trim())
            } catch {
                return {
                    status: 400,
                    success: false,
                    message: `无效的重定向 URL: ${url}`,
                }
            }
        }

        const application = new OAuthApplication()
        application.clientId = snowflake.generateId()
        application.clientSecret = generateSecureRandomString(32)
        application.name = name
        application.metadata = JSON.stringify({ description })
        application.redirectURLs = urlList.join(',')
        application.type = 'web'
        application.userId = session.userId

        await dataSource.getRepository(OAuthApplication).save(application)

        return {
            status: 200,
            success: true,
            data: {
                id: application.id,
                clientId: application.clientId,
                clientSecret: application.clientSecret,
                name: application.name,
                metadata: JSON.parse(application.metadata),
                redirectURLs: application.redirectURLs,
                type: application.type,
                disabled: application.disabled,
                createdAt: application.createdAt,
                updatedAt: application.updatedAt,
            },
        }
    } catch (error) {
        return {
            status: 500,
            success: false,
            message: error instanceof Error ? error.message : '创建应用失败',
        }
    }
})
