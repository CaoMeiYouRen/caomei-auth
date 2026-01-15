/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readBody, getRouterParam } from 'h3'
import handler from '@/server/api/admin/sso/providers/[id].put'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        readBody: vi.fn(),
        getRouterParam: vi.fn(),
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/check-admin', () => ({
    checkAdmin: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

describe('server/api/admin/sso/providers/[id].put', () => {
    const mockRepo = {
        findOne: vi.fn(),
        save: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        vi.mocked(checkAdmin).mockResolvedValue({
            success: true,
            message: 'Authorized',
            data: { userId: 'admin-123' },
        } as any)
    })

    it('should update provider successfully', async () => {
        const providerId = 'p1'
        const updateData = {
            name: 'Updated Provider',
            type: 'oidc', // Required field in schema
            clientId: 'new-client-id',
            clientSecret: 'new-secret',
            oidcConfig: {
                clientId: 'oidc-client-id',
                clientSecret: 'oidc-client-secret',
            },
        }
        const existingProvider = {
            id: providerId,
            name: 'Old Provider',
            type: 'oidc',
            clientId: 'old-client-id',
        }
        const savedProvider = {
            ...existingProvider,
            ...updateData,
            oidcConfig: JSON.stringify(updateData.oidcConfig),
        }

        vi.mocked(getRouterParam).mockReturnValue(providerId)
        vi.mocked(readBody).mockResolvedValue(updateData)
        mockRepo.findOne.mockResolvedValue(existingProvider)
        mockRepo.save.mockResolvedValue(savedProvider)

        const event = { context: {} }
        const result = await handler(event as any)

        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: providerId } })
        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            name: 'Updated Provider',
            clientId: 'new-client-id',
            oidcConfig: JSON.stringify({
                clientId: 'oidc-client-id',
                clientSecret: 'oidc-client-secret',
            }),
        }))
        expect(result).toEqual({
            success: true,
            data: savedProvider,
            message: 'SSO 提供商更新成功',
        })
    })

    it('should throw 400 if provider ID is missing', async () => {
        vi.mocked(getRouterParam).mockReturnValue(undefined)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('缺少提供商 ID')
    })

    it('should throw 404 if provider not found', async () => {
        vi.mocked(getRouterParam).mockReturnValue('p1')
        mockRepo.findOne.mockResolvedValue(null)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('SSO 提供商不存在')
    })

    it('should throw 400 if validation fails', async () => {
        vi.mocked(getRouterParam).mockReturnValue('p1')
        mockRepo.findOne.mockResolvedValue({ id: 'p1' })
        vi.mocked(readBody).mockResolvedValue({
            name: 123, // Invalid type
        })

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow()
    })

    it('should handle database errors', async () => {
        vi.mocked(getRouterParam).mockReturnValue('p1')
        mockRepo.findOne.mockResolvedValue({ id: 'p1' })
        vi.mocked(readBody).mockResolvedValue({
            name: 'Updated Provider',
            type: 'oidc',
            clientId: 'id',
            clientSecret: 'secret',
            oidcConfig: {
                issuer: 'https://new-issuer.com',
                clientId: 'oidc-client-id',
                clientSecret: 'oidc-client-secret',
            },
        })
        const error = new Error('Database error')
        mockRepo.save.mockRejectedValue(error)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('Database error')
        expect(logger.error).toHaveBeenCalled()
    })
})
