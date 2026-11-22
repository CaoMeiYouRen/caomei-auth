// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { APIError } from 'better-auth/api'
import {
    createMemoryDatabase,
    createTestAuth,
    pathFromUrl,
    setupTwoFactorUser,
    TestClient,
    type CapturedCodes,
} from './helpers/two-factor-coverage'
import loggerMock from '@/tests/mocks/logger'
import type { LoginEventInput } from '@/server/utils/login-events/repository'
import {
    buildLoginEventRecord,
    isTwoFactorChallengeResponse,
    loginEventPlugin,
} from '@/server/utils/login-events/plugin'
import { generateDemoLoginEvents } from '@/server/utils/login-events/demo'

const { getRepository } = vi.hoisted(() => ({ getRepository: vi.fn() }))
getRepository.mockImplementation(() => {
    throw new Error('database unavailable')
})
vi.mock('@/server/database', () => ({ dataSource: { getRepository } }))

const USER_EMAIL = 'events@example.com'
const USER_PASSWORD = 'passw0rd123'

function redirectError(location: string): APIError {
    return new APIError('FOUND', undefined, new Headers({ location }))
}

describe('登录事件插件（纯函数）', () => {
    it('识别 JSON 与阶段 11 的重定向挑战', () => {
        expect(isTwoFactorChallengeResponse({ twoFactorRedirect: true })).toBe(true)
        expect(isTwoFactorChallengeResponse(redirectError('/login?twoFactor=1&channel=email-otp'))).toBe(true)
        expect(isTwoFactorChallengeResponse(redirectError('/login?twoFactor=1'))).toBe(false)
        expect(isTwoFactorChallengeResponse(redirectError('/login?error=invalid'))).toBe(false)
        expect(isTwoFactorChallengeResponse({ success: true })).toBe(false)
    })

    it('登录成功记录通道、用户与请求元数据', () => {
        const input = buildLoginEventRecord({
            path: '/sign-in/email',
            request: new Request('http://localhost/api/auth/sign-in/email', {
                headers: { 'user-agent': 'vitest-UA', 'x-forwarded-for': '203.0.113.9' },
            }),
            context: { returned: { token: 'x' }, newSession: { user: { id: 'user-1' } } },
        })
        expect(input).toMatchObject({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            userId: 'user-1',
            ip: '203.0.113.9',
            userAgent: 'vitest-UA',
        })
    })

    it('登录失败记录失败事件且不落用户标识', () => {
        const input = buildLoginEventRecord({
            path: '/sign-in/username',
            context: { returned: new APIError('UNAUTHORIZED', { code: 'INVALID_USERNAME_OR_PASSWORD' }) },
        })
        expect(input).toMatchObject({
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'username',
            userId: null,
            metadata: { reason: 'INVALID_USERNAME_OR_PASSWORD' },
        })
    })

    it('2FA 挑战复用阶段 11 通道标识', () => {
        const input = buildLoginEventRecord({
            path: '/email-otp/verify-email',
            context: { returned: redirectError('/login?twoFactor=1&channel=email-link-verification') },
        })
        expect(input).toMatchObject({
            type: 'two_factor_challenge',
            result: 'success',
            channel: 'email-verification',
            userId: null,
        })
    })

    it('2FA 验证成功 / 失败记录因子', () => {
        const success = buildLoginEventRecord({
            path: '/two-factor/verify-totp',
            context: { returned: { success: true }, newSession: { user: { id: 'user-2' } } },
        })
        expect(success).toMatchObject({
            type: 'two_factor_success',
            result: 'success',
            channel: 'unknown',
            userId: 'user-2',
            metadata: { factor: 'totp' },
        })

        const failure = buildLoginEventRecord({
            path: '/two-factor/verify-backup-code',
            context: { returned: new APIError('BAD_REQUEST', { code: 'INVALID_CODE' }) },
        })
        expect(failure).toMatchObject({
            type: 'two_factor_failure',
            result: 'failure',
            userId: null,
            metadata: { factor: 'backup-code' },
        })
    })

    it('社交与 SSO 记录 provider 与结果', () => {
        const social = buildLoginEventRecord({
            path: '/callback/github',
            context: { returned: redirectError('/'), newSession: { user: { id: 'user-3' } } },
        })
        expect(social).toMatchObject({
            type: 'sign_in_success',
            channel: 'social',
            userId: 'user-3',
            metadata: { provider: 'github' },
        })

        const socialFailure = buildLoginEventRecord({
            path: '/callback/github',
            context: { returned: redirectError('/login?error=access_denied') },
        })
        expect(socialFailure).toMatchObject({
            type: 'sign_in_failure',
            channel: 'social',
            metadata: { provider: 'github' },
        })

        const saml = buildLoginEventRecord({
            path: '/sso/saml2/sp/acs/okta',
            context: { returned: redirectError('/'), newSession: { user: { id: 'user-4' } } },
        })
        expect(saml).toMatchObject({
            type: 'sign_in_success',
            channel: 'sso',
            metadata: { provider: 'okta' },
        })
    })

    it('已登录用户验证 2FA 属于设置流程，不写登录事件', () => {
        expect(buildLoginEventRecord({
            path: '/two-factor/verify-totp',
            context: {
                returned: { success: true },
                session: { user: { id: 'user-1' } },
            },
        })).toBeNull()
    })

    it('302 重定向不算登录失败，邮箱变更确认不写失败事件', () => {
        expect(buildLoginEventRecord({
            path: '/verify-email',
            context: {
                returned: redirectError('/settings/security?emailChanged=1'),
                session: { user: { id: 'user-1' } },
            },
        })).toBeNull()
    })

    it('已登录用户的邮箱验证成功不算登录', () => {
        expect(buildLoginEventRecord({
            path: '/verify-email',
            context: {
                returned: redirectError('/settings/security?emailChanged=1'),
                newSession: { user: { id: 'user-1' } },
                session: { user: { id: 'user-1' } },
            },
        })).toBeNull()
    })

    it('用户可控 callbackURL 里的 twoFactor=1 不会被当成挑战', () => {
        expect(buildLoginEventRecord({
            path: '/callback/github',
            context: {
                returned: redirectError('/?twoFactor=1'),
                newSession: { user: { id: 'user-3' } },
            },
        })).toMatchObject({
            type: 'sign_in_success',
            channel: 'social',
            userId: 'user-3',
        })
    })

    it('匿名登录记为 unknown 通道的成功事件', () => {
        expect(buildLoginEventRecord({
            path: '/sign-in/anonymous',
            context: { returned: { token: 'x' }, newSession: { user: { id: 'anon-1' } } },
        })).toMatchObject({
            type: 'sign_in_success',
            channel: 'unknown',
            userId: 'anon-1',
        })
    })

    it('手机号验证与共享 SSO 回调按路径映射通道', () => {
        expect(buildLoginEventRecord({
            path: '/phone-number/verify',
            context: { returned: { success: true }, newSession: { user: { id: 'user-7' } } },
        })).toMatchObject({ type: 'sign_in_success', channel: 'phone-otp', userId: 'user-7' })

        const sharedSso = buildLoginEventRecord({
            path: '/sso/callback',
            context: { returned: redirectError('/'), newSession: { user: { id: 'user-6' } } },
        })
        expect(sharedSso).toMatchObject({ type: 'sign_in_success', channel: 'sso' })
        expect(sharedSso?.metadata?.provider).toBeUndefined()
    })

    it('社交登录发起阶段不记录事件，未知路径返回 null', () => {
        expect(buildLoginEventRecord({
            path: '/sign-in/social',
            context: { returned: { url: 'https://github.com/login/oauth/authorize', redirect: true } },
        })).toBeNull()
        expect(buildLoginEventRecord({ path: '/get-session', context: { returned: {} } })).toBeNull()
    })

    it('登出使用 before-hook 捕获的操作人', () => {
        const input = buildLoginEventRecord({
            path: '/sign-out',
            context: { returned: { success: true }, loginEventActorId: 'user-5' },
        })
        expect(input).toMatchObject({
            type: 'sign_out',
            result: 'success',
            channel: 'unknown',
            userId: 'user-5',
        })
    })
})

describe('登录事件插件（better-auth 集成）', () => {
    let captured: CapturedCodes
    let database: ReturnType<typeof createMemoryDatabase>
    let events: LoginEventInput[]
    let client: TestClient

    beforeEach(() => {
        captured = {}
        events = []
        database = createMemoryDatabase()
        client = new TestClient(createTestAuth(captured, database, {
            extraPlugins: [loginEventPlugin({ record: async (input) => { events.push(input) } })],
        }))
    })

    async function registerAndSignOut() {
        await client.request('/sign-up/email', { body: { email: USER_EMAIL, password: USER_PASSWORD, name: 'Events' } })
        await client.request('/sign-out')
        events.length = 0
    }

    it('邮箱密码登录成功写入 sign_in_success', async () => {
        await registerAndSignOut()
        const response = await client.request('/sign-in/email', { body: { email: USER_EMAIL, password: USER_PASSWORD } })
        expect(response.response.status).toBe(200)
        expect(events).toEqual([expect.objectContaining({
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            userId: database.user[0]?.id,
        })])
    })

    it('邮箱密码登录失败写入 sign_in_failure', async () => {
        await registerAndSignOut()
        const response = await client.request('/sign-in/email', { body: { email: USER_EMAIL, password: 'wrong-password' } })
        expect(response.response.status).toBe(401)
        expect(events).toHaveLength(1)
        expect(events[0]).toMatchObject({
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'email',
            userId: null,
        })
        expect(events[0]?.metadata?.reason).toBeTruthy()
    })

    it('登出写入 sign_out 并带上操作人', async () => {
        await registerAndSignOut()
        await client.request('/sign-in/email', { body: { email: USER_EMAIL, password: USER_PASSWORD } })
        events.length = 0
        await client.request('/sign-out')
        expect(events).toEqual([expect.objectContaining({
            type: 'sign_out',
            result: 'success',
            userId: database.user[0]?.id,
        })])
    })

    it('凭据登录触发 2FA 时写入挑战与验证事件', async () => {
        await setupTwoFactorUser(client, database, USER_EMAIL)
        events.length = 0

        const challenge = await client.request('/sign-in/email', { body: { email: USER_EMAIL, password: USER_PASSWORD } })
        expect(challenge.json).toMatchObject({ twoFactorRedirect: true })
        expect(events).toEqual([expect.objectContaining({
            type: 'two_factor_challenge',
            channel: 'email',
            result: 'success',
        })])

        events.length = 0
        await client.request('/two-factor/send-otp')
        const verified = await client.request('/two-factor/verify-otp', { body: { code: captured.twoFactorCode } })
        expect(verified.response.status).toBe(200)
        expect(events).toEqual([expect.objectContaining({
            type: 'two_factor_success',
            result: 'success',
            metadata: { factor: 'otp' },
        })])
    })

    it('2FA 验证失败写入 two_factor_failure', async () => {
        await setupTwoFactorUser(client, database, USER_EMAIL)
        await client.request('/sign-in/email', { body: { email: USER_EMAIL, password: USER_PASSWORD } })
        events.length = 0
        const failed = await client.request('/two-factor/verify-otp', { body: { code: '000000' } })
        expect(failed.response.status).toBeGreaterThanOrEqual(400)
        expect(events).toEqual([expect.objectContaining({
            type: 'two_factor_failure',
            result: 'failure',
            metadata: { factor: 'otp' },
        })])
    })

    it('阶段 11 无密码通道挑战写入对应通道', async () => {
        await setupTwoFactorUser(client, database, USER_EMAIL)
        events.length = 0
        await client.request('/email-otp/send-verification-otp', { body: { email: USER_EMAIL, type: 'sign-in' } })
        const challenge = await client.request('/sign-in/email-otp', { body: { email: USER_EMAIL, otp: captured.emailCode } })
        expect(challenge.json).toMatchObject({ twoFactorRedirect: true, channel: 'email-otp' })
        expect(events).toEqual([expect.objectContaining({
            type: 'two_factor_challenge',
            channel: 'email-otp',
        })])
    })

    it('redirect 模式的魔法链接挑战同样落库', async () => {
        await setupTwoFactorUser(client, database, USER_EMAIL)
        events.length = 0
        await client.request('/sign-in/magic-link', { body: { email: USER_EMAIL } })
        const verify = await client.get(pathFromUrl(captured.magicLinkUrl!))
        expect(verify.response.status).toBe(302)
        expect(verify.response.headers.get('location')).toContain('/login?twoFactor=1')
        expect(events).toEqual([expect.objectContaining({
            type: 'two_factor_challenge',
            channel: 'magic-link',
        })])
    })
})

describe('登录事件写入失败降级', () => {
    beforeEach(() => {
        getRepository.mockClear()
        loggerMock.warn.mockClear()
    })

    it('数据库异常时认证继续并只记录 warn', async () => {
        const database = createMemoryDatabase()
        const client = new TestClient(createTestAuth({}, database, { extraPlugins: [loginEventPlugin()] }))
        await client.request('/sign-up/email', { body: { email: USER_EMAIL, password: USER_PASSWORD, name: 'Events' } })
        await client.request('/sign-out')
        const response = await client.request('/sign-in/email', { body: { email: USER_EMAIL, password: USER_PASSWORD } })
        expect(response.response.status).toBe(200)
        expect(loggerMock.warn).toHaveBeenCalledWith('Failed to write login event, skipped', expect.objectContaining({
            type: 'sign_in_success',
            channel: 'email',
        }))
    })
})

describe('Demo 登录事件生成', () => {
    const now = new Date(Date.UTC(2026, 10, 22, 12, 0, 0))

    it('同一 seed 与锚点下输出完全一致', () => {
        const first = generateDemoLoginEvents({ userIds: ['u1', 'u2'], now, count: 60, seed: 7 })
        const second = generateDemoLoginEvents({ userIds: ['u1', 'u2'], now, count: 60, seed: 7 })
        expect(second).toEqual(first)
        expect(first).toHaveLength(60)
        expect(first.every((event) => event.createdAt.getTime() <= now.getTime())).toBe(true)
        expect(first.every((event) => (
            event.userId === null || event.userId === undefined || ['u1', 'u2'].includes(event.userId)
        ))).toBe(true)
        expect(new Set(first.map((event) => event.type)).size).toBeGreaterThan(2)
    })

    it('不同 seed 产生不同序列', () => {
        const first = generateDemoLoginEvents({ userIds: ['u1'], now, count: 20, seed: 1 })
        const second = generateDemoLoginEvents({ userIds: ['u1'], now, count: 20, seed: 2 })
        expect(second).not.toEqual(first)
    })
})
