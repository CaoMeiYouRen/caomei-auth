import { describe, it, expect, vi } from 'vitest'
import { defineEventHandler, getRequestURL } from 'h3'

// Polyfill auto-imports
;(globalThis as any).defineEventHandler = defineEventHandler
;(globalThis as any).getRequestURL = getRequestURL

// Mock dependencies
vi.mock('@/utils/web/social-colors', () => ({
    getSocialColor: vi.fn(() => '#000000'),
}))

// Mock env vars
vi.mock('@/utils/shared/env', () => ({
    ANONYMOUS_LOGIN_ENABLED: true,
    GITHUB_CLIENT_ID: 'github-id',
    GOOGLE_CLIENT_ID: '', // Disabled
    MICROSOFT_CLIENT_ID: '',
    DISCORD_CLIENT_ID: '',
    APPLE_CLIENT_ID: '',
    TWITTER_CLIENT_ID: '',
    WEIBO_CLIENT_ID: '',
    QQ_CLIENT_ID: '',
    WECHAT_CLIENT_ID: '',
    DOUYIN_CLIENT_ID: '',
    FACEBOOK_CLIENT_ID: '',
}))

// Import handler after mocks
import handler from '@/server/api/social/providers.get'

describe('server/api/social/providers.get', () => {
    it('should return enabled providers by default', async () => {
        const event = {
            path: '/api/social/providers',
            node: {
                req: {
                    originalUrl: '/api/social/providers',
                    headers: {
                        host: 'localhost',
                    },
                },
            },
        }

        const result = await handler(event as any)

        expect(result.success).toBe(true)
        expect(result.providers).toBeDefined()

        // Check that enabled providers are present
        const github = result.providers!.find((p: any) => p.provider === 'github')
        expect(github).toBeDefined()
        expect(github!.enabled).toBe(true)

        const anonymous = result.providers!.find((p: any) => p.provider === 'anonymous')
        expect(anonymous).toBeDefined()
        expect(anonymous!.enabled).toBe(true)

        // Check that disabled providers are NOT present
        const google = result.providers!.find((p: any) => p.provider === 'google')
        expect(google).toBeUndefined()
    })

    it('should return all providers when includeDisabled is true', async () => {
        const event = {
            path: '/api/social/providers?includeDisabled=true',
            node: {
                req: {
                    originalUrl: '/api/social/providers?includeDisabled=true',
                    headers: {
                        host: 'localhost',
                    },
                },
            },
        }

        const result = await handler(event as any)

        expect(result.success).toBe(true)

        // Check that disabled providers ARE present
        const google = result.providers!.find((p: any) => p.provider === 'google')
        expect(google).toBeDefined()
        expect(google!.enabled).toBe(false)
    })
})
