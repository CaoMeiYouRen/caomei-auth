import { describe, it, expect, vi, beforeEach } from 'vitest'
import { H3Event } from 'h3'
import updateHandler from '@/server/api/admin/oauth/applications/[id].put'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        readBody: vi.fn(),
        defineEventHandler: (handler: any) => handler,
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
            oauthAppUpdated: vi.fn(),
        },
    },
}))

describe('server/api/admin/oauth/applications/[id].put', () => {
    let event: H3Event
    const mockSave = vi.fn()
    const mockFindOne = vi.fn()
    const mockRepo = {
        save: mockSave,
        findOne: mockFindOne,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        event = {
            context: {
                params: { id: 'app-123' },
            },
        } as any

        // Setup default mocks
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        vi.mocked(checkAdmin).mockResolvedValue({
            success: true,
            data: { userId: 'admin-123' },
        } as any)
    })

    it('should return 400 if id is missing', async () => {
        event.context.params = {}
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({})

        const result = await updateHandler(event) as any

        expect(result.status).toBe(400)
        expect(result.success).toBe(false)
        expect(result.message).toBe('参数不完整')
    })

    it('should return 404 if application not found', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({})
        mockFindOne.mockResolvedValue(null)

        const result = await updateHandler(event) as any

        expect(result.status).toBe(404)
        expect(result.success).toBe(false)
        expect(result.message).toBe('应用不存在')
    })

    it('should toggle disabled status successfully', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({ disabled: true })

        const mockApp = { id: 'app-123', disabled: false }
        mockFindOne.mockResolvedValue(mockApp)
        mockSave.mockResolvedValue({ ...mockApp, disabled: true })

        const result = await updateHandler(event) as any

        expect(result.status).toBe(200)
        expect(result.success).toBe(true)
        expect(result.message).toBe('应用已禁用')
        expect(mockApp.disabled).toBe(true)
        expect(mockSave).toHaveBeenCalledWith(mockApp)
    })

    it('should handle validation errors for full update', async () => {
        const { readBody } = await import('h3')
        // Invalid body: providing invalid types
        vi.mocked(readBody).mockResolvedValue({
            client_name: 123, // Should be string
            redirect_uris: 123, // Should be string or array of strings
        })

        mockFindOne.mockResolvedValue({ id: 'app-123' })

        const result = await updateHandler(event) as any

        expect(result.status).toBe(400)
        expect(result.success).toBe(false)
        expect(result.message).toBeTruthy()
        expect(mockSave).not.toHaveBeenCalled()
    })

    it('should update application successfully with valid data', async () => {
        const updateData = {
            client_name: 'Updated App',
            redirect_uris: ['https://example.com/callback'],
            scope: 'openid email',
            contacts: ['admin@example.com'],
            token_endpoint_auth_method: 'client_secret_post',
            grant_types: ['authorization_code'],
            response_types: ['code'],
            disabled: false,
        }

        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue(updateData)

        const mockApp = {
            id: 'app-123',
            name: 'Old Name',
            redirectURLs: 'old-url',
            scope: 'old-scope',
        }
        mockFindOne.mockResolvedValue(mockApp)
        mockSave.mockResolvedValue({ ...mockApp, ...updateData })

        const result = await updateHandler(event) as any

        expect(result.status).toBe(200)
        expect(result.success).toBe(true)
        expect(result.data.name).toBe('Updated App')
        expect(result.data.redirectURLs).toBe('https://example.com/callback')
        expect(mockSave).toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({ disabled: true })

        mockFindOne.mockResolvedValue({ id: 'app-123' })
        mockSave.mockRejectedValue(new Error('Database error'))

        const result = await updateHandler(event) as any

        expect(result.status).toBe(500)
        expect(result.success).toBe(false)
        expect(result.message).toBe('Database error')
        expect(logger.business.oauthAppUpdated).toHaveBeenCalled()
    })
})
