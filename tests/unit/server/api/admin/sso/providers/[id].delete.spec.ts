/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRouterParam } from 'h3'
import handler from '@/server/api/admin/sso/providers/[id].delete'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
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

describe('server/api/admin/sso/providers/[id].delete', () => {
    const mockRepo = {
        findOne: vi.fn(),
        remove: vi.fn(),
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

    it('should delete provider successfully', async () => {
        const providerId = 'p1'
        const existingProvider = { id: providerId, name: 'Provider 1' }

        vi.mocked(getRouterParam).mockReturnValue(providerId)
        mockRepo.findOne.mockResolvedValue(existingProvider)
        mockRepo.remove.mockResolvedValue(existingProvider)

        const event = { context: {} }
        const result = await handler(event as any)

        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: providerId } })
        expect(mockRepo.remove).toHaveBeenCalledWith(existingProvider)
        expect(result).toEqual({
            success: true,
            message: 'SSO 提供商删除成功',
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

    it('should handle database errors', async () => {
        vi.mocked(getRouterParam).mockReturnValue('p1')
        mockRepo.findOne.mockResolvedValue({ id: 'p1' })
        const error = new Error('Database error')
        mockRepo.remove.mockRejectedValue(error)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('Database error')
        expect(logger.error).toHaveBeenCalled()
    })
})
