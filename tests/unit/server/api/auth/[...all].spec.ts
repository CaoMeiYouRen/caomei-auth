import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineEventHandler, toWebRequest } from 'h3'
import { auth } from '@/lib/auth'
import handler from '@/server/api/auth/[...all]'

// Polyfill
;(globalThis as any).defineEventHandler = defineEventHandler
;(globalThis as any).toWebRequest = toWebRequest

// Mock dependencies
vi.mock('@/lib/auth', () => ({
    auth: {
        handler: vi.fn(),
    },
}))

vi.mock('@better-auth/oauth-provider', () => {
    const metadataHandler = vi.fn().mockResolvedValue(new Response('{}'))
    return {
        oauthProviderOpenIdConfigMetadata: () => metadataHandler,
        oauthProviderAuthServerMetadata: () => metadataHandler,
        __metadataHandler: metadataHandler,
    }
})

vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        toWebRequest: vi.fn(),
    }
})

describe('server/api/auth/[...all]', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call auth.handler with web request', async () => {
        const mockWebRequest = { url: 'http://localhost' }
        vi.mocked(toWebRequest).mockReturnValue(mockWebRequest as any)

        const event = { path: '/api/auth/get-session' }
        await handler(event as any)

        expect(toWebRequest).toHaveBeenCalledWith(event)
        expect(auth.handler).toHaveBeenCalledWith(mockWebRequest)
    })

    it('should route legacy well-known paths to the oauth metadata handler', async () => {
        const mockWebRequest = { url: 'http://localhost/api/auth/.well-known/openid-configuration' }
        vi.mocked(toWebRequest).mockReturnValue(mockWebRequest as any)

        const event = { path: '/api/auth/.well-known/openid-configuration?foo=1' }
        await handler(event as any)

        expect(auth.handler).not.toHaveBeenCalled()
        expect(toWebRequest).toHaveBeenCalledWith(event)
    })
})
