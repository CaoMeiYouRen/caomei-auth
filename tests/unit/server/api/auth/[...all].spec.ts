import { describe, it, expect, vi } from 'vitest'
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

vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        toWebRequest: vi.fn(),
    }
})

describe('server/api/auth/[...all]', () => {
    it('should call auth.handler with web request', async () => {
        const mockWebRequest = { url: 'http://localhost' }
        vi.mocked(toWebRequest).mockReturnValue(mockWebRequest as any)
        
        const event = {}
        await handler(event as any)

        expect(toWebRequest).toHaveBeenCalledWith(event)
        expect(auth.handler).toHaveBeenCalledWith(mockWebRequest)
    })
})
