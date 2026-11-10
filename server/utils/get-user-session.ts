import type { H3Event } from 'h3'
import { createLocalizedError } from './i18n'
import { auth } from '@/lib/auth'

/**
 * 获取当前请求的 session 和 userId，未认证时抛出 401
 */
export async function getUserSession(event: H3Event) {
    const session = await auth.api.getSession({
        headers: event.headers,
    })
    if (!session?.user?.id) {
        throw await createLocalizedError(event, {
            statusCode: 401,
            statusMessage: 'Unauthorized',
            key: 'errors.auth.unauthorized',
        })
    }
    return {
        session,
        user: session.user,
        userId: session.user.id,
    }
}
