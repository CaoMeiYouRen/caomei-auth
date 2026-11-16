import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'

import loggerMock, { resetLoggerMock } from '../../mocks/logger'

vi.mock('@/utils/shared/env', async () => {
    const actual = await vi.importActual<typeof import('@/utils/shared/env')>('@/utils/shared/env')
    return {
        ...actual,
        DEMO_MODE: true,
        DEMO_PASSWORD: 'Demo@Spec',
    }
})

vi.stubGlobal('logger', loggerMock)

type DemoModule = typeof import('@/server/utils/demo-data-generator')
let demoModule: DemoModule

beforeAll(async () => {
    demoModule = await import('@/server/utils/demo-data-generator')
})

afterEach(() => {
    resetLoggerMock()
})

afterAll(() => {
    vi.unstubAllGlobals()
})

describe('server/utils/demo-data-generator', () => {
    it('creates the requested number of demo users with required fields', () => {
        const users = demoModule.generateDemoUsers(5)
        expect(users).toHaveLength(5)
        users.forEach((user) => {
            expect(typeof user.id).toBe('string')
            expect(user.email).toContain('@')
            expect(['admin', 'user']).toContain(user.role)
            expect(['active', 'inactive', 'suspended']).toContain(user.status)
            expect(user.createdAt).toBeInstanceOf(Date)
            expect(user.updatedAt).toBeInstanceOf(Date)
            // better-auth username 校验：3–30 位 [a-zA-Z0-9_.]
            expect(user.username).toMatch(/^[\w.]{3,30}$/u)
        })
        expect(new Set(users.map((user) => user.username)).size).toBe(users.length)
    })

    it('uses better-auth compatible usernames for built-in demo accounts', () => {
        const config = demoModule.getDemoConfig()

        for (const account of [config.adminUser, config.normalUser]) {
            expect(account.username).toMatch(/^[\w.]{3,30}$/u)
            expect(account.name).not.toBe(account.username)
        }
    })

    it('produces demo oauth apps with secrets, redirect URIs, and scopes', () => {
        const apps = demoModule.generateDemoOAuthApps(3)
        expect(apps).toHaveLength(3)
        apps.forEach((app) => {
            expect(app.redirectUris?.length).toBeGreaterThanOrEqual(1)
            expect(app.clientSecret.startsWith('demo_secret_')).toBe(true)
            expect(app.scopes).toEqual(expect.arrayContaining(['openid', 'profile', 'email']))
        })
    })

    it('generates sorted login logs with masked IPs and timestamps', () => {
        const logs = demoModule.generateDemoLoginLogs(7)
        expect(logs).toHaveLength(7)
        logs.forEach((log) => {
            expect(log.id).toBeTruthy()
            expect(typeof log.ip).toBe('string')
            expect(log.createdAt).toBeInstanceOf(Date)
        })
        for (let i = 1; i < logs.length; i += 1) {
            expect(logs[i - 1]!.createdAt.getTime()).toBeGreaterThanOrEqual(logs[i]!.createdAt.getTime())
        }
    })

    it('generates sessions with forward-only expiry and rich device metadata', () => {
        const sessions = demoModule.generateDemoSessions(6)
        expect(sessions).toHaveLength(6)
        sessions.forEach((session) => {
            expect(session.loginTime).toBeInstanceOf(Date)
            expect(session.expiresAt).toBeInstanceOf(Date)
            expect(session.expiresAt.getTime()).toBeGreaterThan(session.loginTime.getTime())
            expect(typeof session.device.device).toBe('string')
            expect(typeof session.device.isMobile).toBe('boolean')
        })
        for (let i = 1; i < sessions.length; i += 1) {
            expect(sessions[i - 1]!.loginTime.getTime()).toBeGreaterThanOrEqual(sessions[i]!.loginTime.getTime())
        }
    })

    it('returns internally consistent summary statistics', () => {
        const stats = demoModule.generateDemoStats()
        expect(stats.totalUsers).toBeGreaterThan(0)
        expect(stats.activeUsers).toBeGreaterThan(0)
        expect(stats.activeUsers).toBeLessThanOrEqual(stats.totalUsers)
        expect(stats.activeOAuthApps).toBeLessThanOrEqual(stats.totalOAuthApps)
        expect(stats.activeSSOProviders).toBeLessThanOrEqual(stats.totalSSOProviders)
    })

    it('exposes configured demo mode flags and password through helpers', () => {
        expect(demoModule.isDemoMode()).toBe(true)
        const config = demoModule.getDemoConfig()
        expect(config.password).toBe('Demo@Spec')
        expect(config.adminUser.name).toBeTruthy()
        expect(config.normalUser.phoneNumber).toBeTruthy()
    })
})

describe('Demo 会话分布', () => {
    it('同 seed 输出稳定，不同 seed 不同', async () => {
        const { generateDemoSessions } = await import('@/server/utils/demo-data-generator')
        const a = generateDemoSessions(12, { seed: 42 })
        const b = generateDemoSessions(12, { seed: 42 })
        const c = generateDemoSessions(12, { seed: 43 })

        expect(a.map((item) => item.sessionToken)).toEqual(b.map((item) => item.sessionToken))
        expect(a.map((item) => item.sessionToken)).not.toEqual(c.map((item) => item.sessionToken))
    })

    it('登录时间向高峰时段集中', async () => {
        const { generateDemoSessions } = await import('@/server/utils/demo-data-generator')
        const peakHours = [9, 10, 11]
        const sessions = generateDemoSessions(400, { seed: 7, peakHours })
        const inPeak = sessions.filter((item) => peakHours.includes(item.loginTime.getHours())).length

        expect(inPeak / sessions.length).toBeGreaterThan(0.5)
    })

    it('活跃度长尾：头部用户占比高于均匀分布', async () => {
        const { generateDemoSessions } = await import('@/server/utils/demo-data-generator')
        const sessions = generateDemoSessions(400, { seed: 11, activeRatio: 0.6 })
        const counts = new Map<string, number>()
        for (const session of sessions) {
            counts.set(session.userId, (counts.get(session.userId) ?? 0) + 1)
        }
        const maxShare = Math.max(...counts.values()) / sessions.length

        expect(maxShare).toBeGreaterThan(1 / 20)
    })
})
