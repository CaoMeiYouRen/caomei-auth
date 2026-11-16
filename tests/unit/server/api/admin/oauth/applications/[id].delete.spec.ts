import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getValidatedRouterParams } from 'h3'
import handler from '@/server/api/admin/oauth/applications/[id].delete'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        getValidatedRouterParams: vi.fn(),
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
        business: {
            oauthAppDeleteFailed: vi.fn(),
        },
        error: vi.fn(),
    },
}))

describe('server/api/admin/oauth/applications/[id].delete', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

    const mockRepo = {
        findOne: vi.fn(),
        remove: vi.fn(),
        delete: vi.fn(),
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
        vi.mocked(getValidatedRouterParams).mockResolvedValue({
            success: false,
            error: { issues: [{ message: 'ID 不能为空' }] },
        } as any)

        const event = {
            context: {
                params: {},
            },
        }

        await expect(handler(event as any)).rejects.toMatchObject({
            statusCode: 400,
            message: 'ID 不能为空',
        })
    })

    it('should return 404 if application not found', async () => {
        vi.mocked(getValidatedRouterParams).mockResolvedValue({ success: true, data: { id: 'app-123' } } as any)

        const event = {
            context: {
                params: { id: 'app-123' },
            },
        }

        mockRepo.findOne.mockResolvedValue(null)

        await expect(handler(event as any)).rejects.toMatchObject({
            statusCode: 404,
            message: '应用不存在',
        })
        expect(mockRepo.findOne).toHaveBeenCalledWith({
            where: { id: 'app-123' },
        })
    })

    it('should delete application successfully', async () => {
        vi.mocked(getValidatedRouterParams).mockResolvedValue({ success: true, data: { id: 'app-123' } } as any)

        const event = {
            context: {
                params: { id: 'app-123' },
            },
        }

        const mockApp = { id: 'app-123', clientId: 'client-123', client_name: 'Test App' }
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
        vi.mocked(getValidatedRouterParams).mockResolvedValue({ success: true, data: { id: 'app-123' } } as any)

        const event = {
            context: {
                params: { id: 'app-123' },
            },
        }

        const error = new Error('Database error')
        mockRepo.findOne.mockRejectedValue(error)

        await expect(handler(event as any)).rejects.toMatchObject({
            statusCode: 500,
            message: '删除应用失败',
        })
        expect(logger.business.oauthAppDeleteFailed).toHaveBeenCalledWith({
            appId: 'app-123',
            deletedBy: 'admin-123',
            error: 'Database error',
        })
    })

    it('returns localized English message for 404 when request language is en-US', async () => {
        vi.mocked(getValidatedRouterParams).mockResolvedValue({ success: true, data: { id: 'app-123' } } as any)
        mockRepo.findOne.mockResolvedValue(null)
        const event = { context: { params: { id: 'app-123' } }, path: '/api/admin/oauth/applications/app-123' } as any
        const headers = new Map<string, string>()
        event.node = {
            res: {
                setHeader: (key: string, value: string) => headers.set(key, value),
                getHeader: (key: string) => headers.get(key),
            },
        }
        vi.stubGlobal('tryHeaderLocale', vi.fn(() => 'en-US'))
        vi.stubGlobal('useTranslation', vi.fn(async () => (key: string) => (
            key === 'errors.admin.oauthAppNotFound' ? 'Application not found' : key
        )))

        await expect(handler(event)).rejects.toMatchObject({
            statusCode: 404,
            message: 'Application not found',
        })
        expect(headers.get('Content-Language')).toBe('en-US')
    })
})
