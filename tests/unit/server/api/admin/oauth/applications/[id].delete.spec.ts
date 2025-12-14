import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '@/server/api/admin/oauth/applications/[id].delete'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

// Mock dependencies
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
        business: {
            oauthAppDeleted: vi.fn(),
        },
        error: vi.fn(),
    },
}))

describe('server/api/admin/oauth/applications/[id].delete', () => {
    const mockRepo = {
        findOne: vi.fn(),
        remove: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        // Setup default mocks
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        vi.mocked(checkAdmin).mockResolvedValue({
            success: true,
            message: 'Authorized',
            data: { userId: 'admin-123' },
        } as any)
    })

    it('should return 400 if id is missing', async () => {
        const event = {
            context: {
                params: {},
            },
        }

        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: '参数不完整',
            data: null,
        })
    })

    it('should return 404 if application not found', async () => {
        const event = {
            context: {
                params: { id: 'app-123' },
            },
        }

        mockRepo.findOne.mockResolvedValue(null)

        const result = await handler(event as any)

        expect(mockRepo.findOne).toHaveBeenCalledWith({
            where: { id: 'app-123' },
        })
        expect(result).toEqual({
            status: 404,
            success: false,
            message: '应用不存在',
            data: null,
        })
    })

    it('should delete application successfully', async () => {
        const event = {
            context: {
                params: { id: 'app-123' },
            },
        }

        const mockApp = { id: 'app-123', client_name: 'Test App' }
        mockRepo.findOne.mockResolvedValue(mockApp)
        mockRepo.remove.mockResolvedValue(mockApp)

        const result = await handler(event as any)

        expect(mockRepo.findOne).toHaveBeenCalledWith({
            where: { id: 'app-123' },
        })
        expect(mockRepo.remove).toHaveBeenCalledWith(mockApp)
        expect(result).toEqual({
            status: 200,
            success: true,
            message: '删除成功',
            data: null,
        })
    })

    it('should handle database errors', async () => {
        const event = {
            context: {
                params: { id: 'app-123' },
            },
        }

        const error = new Error('Database error')
        mockRepo.findOne.mockRejectedValue(error)

        const result = await handler(event as any)

        expect(logger.business.oauthAppDeleted).toHaveBeenCalledWith({
            appId: 'app-123',
            deletedBy: 'admin-123',
        })
        expect(result).toEqual({
            status: 500,
            success: false,
            message: 'Database error',
            data: null,
        })
    })
})
