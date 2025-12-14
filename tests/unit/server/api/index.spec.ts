import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineEventHandler } from 'h3'
import fs from 'fs-extra'
import handler from '@/server/api/index'

// Polyfill auto-imports
;(globalThis as any).defineEventHandler = defineEventHandler

// Mock dependencies
vi.mock('fs-extra', () => ({
    default: {
        readJSON: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

describe('server/api/index', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should return hello message with version', async () => {
        vi.mocked(fs.readJSON).mockResolvedValue({ version: '1.0.0' })

        const result = await handler({} as any)

        expect(result).toEqual({
            statusCode: 200,
            statusMessage: 'OK',
            message: 'Hello, Caomei Auth!',
            data: {
                version: '1.0.0',
            },
        })
    })

    it('should handle missing package.json', async () => {
        vi.mocked(fs.readJSON).mockRejectedValue(new Error('File not found'))

        const result = await handler({} as any)

        expect(result).toEqual({
            statusCode: 200,
            statusMessage: 'OK',
            message: 'Hello, Caomei Auth!',
            data: {
                version: 'unknown',
            },
        })
    })
})
