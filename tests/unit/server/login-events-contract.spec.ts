// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { APIError } from 'better-auth/api'
import loggerMock from '@/tests/mocks/logger'
import { resolveLoginEventChannel } from '@/server/utils/login-events/channels'
import { buildLoginEventRecord } from '@/server/utils/login-events/plugin'
import { generateDemoLoginEvents } from '@/server/utils/login-events/demo'
import { recordLoginEvent } from '@/server/utils/login-events/repository'
import { TWO_FACTOR_COVERAGE_CHANNEL_IDS } from '@/utils/shared/two-factor-coverage-channels'
import { TWO_FACTOR_COVERAGE_CHANNELS } from '@/server/utils/two-factor-coverage/channels'
import {
    LOGIN_EVENT_CHANNELS,
    LOGIN_EVENT_CHANNEL_MATRIX,
    LOGIN_EVENT_RESULTS,
    LOGIN_EVENT_RESULT_MATRIX,
    LOGIN_EVENT_TYPES,
    isLoginEventResult,
    isSupportedLoginEventCombination,
    isSupportedLoginEventResult,
    normalizeLoginEventChannel,
    type LoginEventChannel,
    type LoginEventType,
} from '@/utils/shared/login-events'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

/**
 * 阶段 12 M1.4：事件契约与枚举矩阵。
 *
 * 锁定 7 类事件 × 10 类通道的适用组合、路径映射与写入结果，
 * 新增枚举或新写入点时，本文件与类型必须同批更新。
 */
const PATHS: ReadonlyArray<[string, LoginEventChannel]> = [
    ['/sign-in/email', 'email'],
    ['/sign-in/username', 'username'],
    ['/sign-in/phone-number', 'phone'],
    ['/sign-in/anonymous', 'unknown'],
    ['/sign-in/email-otp', 'email-otp'],
    ['/phone-number/verify', 'phone-otp'],
    ['/email-otp/verify-email', 'email-verification'],
    ['/verify-email', 'email-verification'],
    ['/magic-link/verify', 'magic-link'],
    ['/callback/github', 'social'],
    ['/sign-in/social', 'social'],
    ['/sso/callback/okta', 'sso'],
    ['/sso/callback', 'sso'],
    ['/sso/saml2/sp/acs/okta', 'sso'],
]

function eventFor(path: string, options: { returned?: unknown, userId?: string | null } = {}) {
    return buildLoginEventRecord({
        path,
        context: {
            returned: options.returned ?? { success: true },
            newSession: options.userId === null ? null : { user: { id: options.userId ?? 'user-1' } },
        },
    })
}

describe('登录事件契约矩阵', () => {
    it('枚举数量与取值固定为登记口径', () => {
        expect(LOGIN_EVENT_TYPES).toHaveLength(7)
        expect(LOGIN_EVENT_RESULTS).toEqual(['success', 'failure'])
        expect(LOGIN_EVENT_CHANNELS).toHaveLength(10)
        expect(isLoginEventResult('success')).toBe(true)
        expect(isLoginEventResult('failure')).toBe(true)
        expect(isLoginEventResult('partial')).toBe(false)
    })

    it('每个事件类型都有非空通道集合，且所有通道至少被一个类型使用', () => {
        const used = new Set<LoginEventChannel>()
        for (const type of LOGIN_EVENT_TYPES) {
            const channels = LOGIN_EVENT_CHANNEL_MATRIX[type]
            expect(channels.length).toBeGreaterThan(0)
            for (const channel of channels) {
                expect(LOGIN_EVENT_CHANNELS).toContain(channel)
                used.add(channel)
            }
        }
        expect([...used].sort()).toEqual([...LOGIN_EVENT_CHANNELS].sort())
    })

    it('矩阵只接受 success / failure 结果', () => {
        for (const type of LOGIN_EVENT_TYPES) {
            expect(LOGIN_EVENT_RESULT_MATRIX[type].length).toBeGreaterThan(0)
            for (const result of LOGIN_EVENT_RESULT_MATRIX[type]) {
                expect(LOGIN_EVENT_RESULTS).toContain(result)
                expect(isSupportedLoginEventResult(type, result)).toBe(true)
            }
        }
        expect(isSupportedLoginEventResult('sign_in_failure', 'success')).toBe(false)
        expect(isSupportedLoginEventResult('two_factor_challenge', 'failure')).toBe(false)
        expect(isSupportedLoginEventResult('sign_out', 'failure')).toBe(true)
    })

    it('写入端拒绝类型与结果不匹配、矩阵外通道回落 unknown', async () => {
        const created: unknown[] = []
        const repository = {
            create: (value: unknown) => value,
            save: async (value: unknown) => {
                created.push(value)
                return value
            },
            update: async () => undefined,
            delete: async () => ({ affected: 0, raw: [] }),
        }

        await expect(recordLoginEvent({
            type: 'sign_in_success',
            result: 'failure',
        }, { repository: repository as never })).rejects.toThrow(TypeError)

        loggerMock.warn.mockClear()
        const event = await recordLoginEvent({
            type: 'session_revoked',
            result: 'success',
            channel: 'sso',
        }, { repository: repository as never })
        expect(event.channel).toBe('unknown')
        expect(created).toHaveLength(1)
        expect(loggerMock.warn).toHaveBeenCalledWith(
            'Login event channel is not supported, falling back to unknown',
            { type: 'session_revoked', channel: 'sso' },
        )
    })

    it('会把会话的登录路径都能映射到矩阵内通道', () => {
        for (const [path, channel] of PATHS) {
            expect(resolveLoginEventChannel(path)).toBe(channel)
        }
        expect(resolveLoginEventChannel('/sign-up/email')).toBeNull()
        expect(resolveLoginEventChannel('/admin/impersonate-user')).toBeNull()
        expect(resolveLoginEventChannel('/get-session')).toBeNull()
    })

    it('阶段 11 覆盖通道与凭据路径都由 PATHS 反向锁定', () => {
        const coveredCoverageIds = new Set(
            TWO_FACTOR_COVERAGE_CHANNELS
                .filter((channel) => PATHS.some(([path]) => channel.matches(path)))
                .map((channel) => channel.id),
        )
        expect([...coveredCoverageIds].sort()).toEqual([...TWO_FACTOR_COVERAGE_CHANNEL_IDS].sort())

        const paths = new Set(PATHS.map(([path]) => path))
        for (const path of ['/sign-in/email', '/sign-in/username', '/sign-in/phone-number', '/sign-in/anonymous']) {
            expect(paths.has(path)).toBe(true)
        }
    })

    it('成功 / 失败 / 登出 / 2FA 写入都落在矩阵内', () => {
        const cases: Array<{ path: string, type: LoginEventType, channel?: LoginEventChannel, returned?: unknown, userId?: string | null }> = [
            { path: '/sign-in/email', type: 'sign_in_success' },
            { path: '/sign-in/email', type: 'sign_in_failure', returned: new APIError('UNAUTHORIZED', { code: 'INVALID' }), userId: null },
            { path: '/callback/github', type: 'sign_in_failure', returned: new APIError('FOUND', undefined, new Headers({ location: '/login?error=access_denied' })), userId: null },
            { path: '/sign-in/email', type: 'two_factor_challenge', returned: { twoFactorRedirect: true }, userId: null },
            { path: '/two-factor/verify-totp', type: 'two_factor_success' },
            { path: '/two-factor/verify-otp', type: 'two_factor_failure', returned: new APIError('BAD_REQUEST', { code: 'INVALID_CODE' }), userId: null },
            { path: '/sign-out', type: 'sign_out', returned: { success: true } },
        ]
        for (const item of cases) {
            const event = eventFor(item.path, { returned: item.returned, userId: item.userId })
            expect(event).toBeTruthy()
            expect(event?.type).toBe(item.type)
            expect(isSupportedLoginEventCombination(event!.type, normalizeLoginEventChannel(event!.channel))).toBe(true)
        }
    })

    it('挑战事件固定 result=success，验证失败固定 result=failure', () => {
        const challenge = eventFor('/sign-in/email', { returned: { twoFactorRedirect: true }, userId: null })
        expect(challenge?.result).toBe('success')
        const failure = eventFor('/two-factor/verify-otp', {
            returned: new APIError('BAD_REQUEST', { code: 'INVALID_CODE' }),
            userId: null,
        })
        expect(failure?.result).toBe('failure')
    })

    it('未知通道回落 unknown', () => {
        expect(normalizeLoginEventChannel('saml')).toBe('unknown')
        expect(normalizeLoginEventChannel(null)).toBe('unknown')
    })

    it('Demo 事件只使用 Demo 用户，且组合全部在矩阵内', () => {
        const demoIds = ['demo_admin', 'demo_user_1']
        const now = new Date(Date.UTC(2026, 10, 22, 12, 0, 0))
        const events = generateDemoLoginEvents({ userIds: demoIds, now, count: 200, seed: 20261122 })
        for (const event of events) {
            expect(event.userId === null || event.userId === undefined || demoIds.includes(event.userId)).toBe(true)
            expect(event.metadata?.email).toBeUndefined()
            expect(event.metadata?.phone).toBeUndefined()
            expect(isSupportedLoginEventCombination(event.type, normalizeLoginEventChannel(event.channel))).toBe(true)
        }
        const signInChannels = new Set(
            events
                .filter((event) => event.type === 'sign_in_success' || event.type === 'sign_in_failure')
                .map((event) => event.channel),
        )
        expect(signInChannels.size).toBeGreaterThanOrEqual(5)
    })
})
