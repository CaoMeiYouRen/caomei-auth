import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { H3Event } from 'h3'
import { auth } from '@/lib/auth'
import { isUserAdmin } from '@/server/utils/admin-role-sync'
import logger from '@/server/utils/logger'
import middleware from '@/server/middleware/2-auth'

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn(),
        },
    },
}))

vi.mock('@/server/utils/admin-role-sync', () => ({
    isUserAdmin: vi.fn(),
    checkAndSyncAdminRoleWithUser: vi.fn().mockResolvedValue(undefined),
}))

function createEvent(path: string): H3Event {
    return {
        path,
        headers: new Headers(),
    } as unknown as H3Event
}

async function run(path: string, session: any) {
    vi.mocked(auth.api.getSession).mockResolvedValue(session as any)
    return middleware(createEvent(path))
}

describe('server/middleware/2-auth SSO 管理端点守卫', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(isUserAdmin).mockReturnValue(false)
        vi.mocked(auth.api.getSession).mockResolvedValue(null as any)
    })

    describe('SSO 提供商管理端点', () => {
        it('未登录访问 /api/auth/sso/register 返回 403 且不记录告警日志', async () => {
            await expect(run('/api/auth/sso/register', null)).rejects.toMatchObject({
                statusCode: 403,
                message: '仅管理员可以访问 SSO 提供商管理接口',
            })
            expect(logger.warn).not.toHaveBeenCalled()
        })

        it('普通用户访问 /api/auth/sso/register 返回 403 并记录日志', async () => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run('/api/auth/sso/register', {
                user: { id: 'user-1', role: 'user' },
            })).rejects.toMatchObject({ statusCode: 403 })
            expect(logger.warn).toHaveBeenCalledWith(
                '非管理员访问 SSO 提供商管理接口',
                expect.objectContaining({ userId: 'user-1', path: '/api/auth/sso/register' }),
            )
        })

        it.each([
            '/api/auth/sso/update-provider',
            '/api/auth/sso/delete-provider',
            '/api/auth/sso/request-domain-verification',
            '/api/auth/sso/verify-domain',
        ])('普通用户访问 %s 返回 403', async (path) => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run(path, { user: { id: 'user-1', role: 'user' } }))
                .rejects.toMatchObject({ statusCode: 403 })
        })

        it('管理员可以访问管理端点', async () => {
            vi.mocked(isUserAdmin).mockReturnValue(true)
            await expect(run('/api/auth/sso/register', {
                user: { id: 'admin-1', role: 'admin' },
            })).resolves.toBeUndefined()
        })

        it('不拦截登录与回调链路', async () => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run('/api/auth/sign-in/sso', {
                user: { id: 'user-1', role: 'user' },
            })).resolves.toBeUndefined()
            await expect(run('/api/auth/sso/callback/provider-a', null)).resolves.toBeUndefined()
            await expect(run('/api/auth/sso/saml2/callback/provider-a', null)).resolves.toBeUndefined()
        })

        it('不做前缀宽松匹配', async () => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run('/api/auth/sso/register-extra', {
                user: { id: 'user-1', role: 'user' },
            })).resolves.toBeUndefined()
        })

        it.each([
            '/api/auth/x/../sso/register',
            '/api/auth/sso/./register',
            '/api/auth/sso/%2e%2e/sso/register',
        ])('点段路径 %s 不会被绕过', async (path) => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run(path, { user: { id: 'user-1', role: 'user' } }))
                .rejects.toMatchObject({ statusCode: 403 })
        })
    })

    describe('既有 OAuth 应用注册守卫', () => {
        it('普通用户访问 /api/auth/oauth2/register 仍返回 403', async () => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run('/api/auth/oauth2/register', {
                user: { id: 'user-1', role: 'user' },
            })).rejects.toMatchObject({ statusCode: 403 })
        })
    })

    describe('公开路径白名单', () => {
        it('白名单路径直接放行', async () => {
            vi.mocked(isUserAdmin).mockReturnValue(false)
            await expect(run('/login', { user: { id: 'user-1', role: 'user' } }))
                .resolves.toBeUndefined()
        })
    })
})
