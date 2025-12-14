import { describe, it, expect, vi, beforeEach } from 'vitest'
import { defineEventHandler, getMethod } from 'h3'
import { dataSource } from '@/server/database'
import handler from '@/server/api/sso/providers/available'

// Polyfill auto-imports
;(globalThis as any).defineEventHandler = defineEventHandler
;(globalThis as any).getMethod = getMethod

vi.stubGlobal('createError', (opts: any) => {
    const err = new Error(opts.statusMessage || opts.message || 'Unknown Error')
    Object.assign(err, opts)
    return err
})

// Mock dependencies
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

describe('server/api/sso/providers/available', () => {
    const mockRepository = {
        find: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepository as any)
    })

    it('should return available SSO providers', async () => {
        const mockProviders = [
            {
                id: '1',
                name: 'Test Provider',
                enabled: true,
            },
        ]
        mockRepository.find.mockResolvedValue(mockProviders)

        const event = {
            method: 'GET',
            node: {
                req: {
                    method: 'GET',
                },
            },
        }

        const result = await handler(event as any)

        expect(result).toEqual({
            success: true,
            data: mockProviders,
        })

        expect(dataSource.getRepository).toHaveBeenCalledWith(expect.anything())
        expect(mockRepository.find).toHaveBeenCalledWith({
            where: { enabled: true },
            select: [
                'id',
                'type',
                'providerId',
                'name',
                'description',
                'domain',
                'issuer',
                'createdAt',
            ],
            order: {
                createdAt: 'DESC',
            },
        })
    })

    it('should throw 405 if method is not GET', async () => {
        const event = {
            method: 'POST',
            node: {
                req: {
                    method: 'POST',
                },
            },
        }

        await expect(handler(event as any)).rejects.toThrowError('方法不允许')
    })

    it('should handle database errors', async () => {
        mockRepository.find.mockRejectedValue(new Error('DB Error'))

        const event = {
            method: 'GET',
            node: {
                req: {
                    method: 'GET',
                },
            },
        }

        try {
            await handler(event as any)
        } catch (e: any) {
            expect(e.statusCode).toBe(500)
        }
    })
})
