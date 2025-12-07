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
        })
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
