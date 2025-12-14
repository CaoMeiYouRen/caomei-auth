import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readBody } from 'h3'
import handler from '@/server/api/oauth/revoke-consent.post'
import { dataSource } from '@/server/database'
import { getUserSession } from '@/server/utils/get-user-session'
import { OAuthConsent } from '@/server/entities/oauth-consent'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        readBody: vi.fn(),
    }
})

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/get-user-session', () => ({
    getUserSession: vi.fn(),
}))

describe('server/api/oauth/revoke-consent.post', () => {
    const mockRepo = {
        delete: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
    })

    it('should revoke consent successfully', async () => {
        const userId = 'user-123'
        const clientId = 'client-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)
        vi.mocked(readBody).mockResolvedValue({ clientId })
        mockRepo.delete.mockResolvedValue({ affected: 1 })

        const event = { context: {} }
        const result = await handler(event as any)

        expect(getUserSession).toHaveBeenCalledWith(event)
        expect(dataSource.getRepository).toHaveBeenCalledWith(OAuthConsent)
        expect(mockRepo.delete).toHaveBeenCalledWith({ userId, clientId })
        expect(result).toEqual({
            status: 200,
            success: true,
            message: '成功撤销授权',
            data: null,
        })
    })

    it('should throw 401 if user is not logged in', async () => {
        vi.mocked(getUserSession).mockResolvedValue(null as any)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('请先登录')
    })

    it('should return 400 if validation fails', async () => {
        const userId = 'user-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)
        vi.mocked(readBody).mockResolvedValue({}) // Missing clientId

        const event = { context: {} }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: expect.any(String), // Accept any validation error message
            data: null,
        })
    })

    it('should return 404 if consent not found', async () => {
        const userId = 'user-123'
        const clientId = 'client-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)
        vi.mocked(readBody).mockResolvedValue({ clientId })
        mockRepo.delete.mockResolvedValue({ affected: 0 })

        const event = { context: {} }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 404,
            success: false,
            message: '未找到对该应用的授权记录',
            data: null,
        })
    })

    it('should handle database errors', async () => {
        const userId = 'user-123'
        const clientId = 'client-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)
        vi.mocked(readBody).mockResolvedValue({ clientId })
        
        const error = new Error('Database error')
        mockRepo.delete.mockRejectedValue(error)

        const event = { context: {} }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 500,
            success: false,
            message: 'Database error',
            data: null,
        })
    })
})
