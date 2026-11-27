import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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
            oauthAppUpdateFailed: vi.fn(),
        },
    },
}))

describe('server/api/admin/oauth/applications/[id].put', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
    })

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

        await expect(updateHandler(event)).rejects.toMatchObject({
            statusCode: 400,
            message: '参数不完整',
        })
    })

    it('should return 404 if application not found', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({})
        mockFindOne.mockResolvedValue(null)

        await expect(updateHandler(event)).rejects.toMatchObject({
            statusCode: 404,
            message: '应用不存在',
        })
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

        await expect(updateHandler(event)).rejects.toMatchObject({
            statusCode: 400,
            message: '输入类型不正确',
        })
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

    /* 阶段 19 M1.3 / D70：只在显式传值时更新 PKCE，存量值保持不变 */
    it('updates requirePKCE only when provided', async () => {
        const { readBody } = await import('h3')
        const mockApp = {
            id: 'app-123',
            name: 'Legacy App',
            requirePKCE: false,
        }
        mockFindOne.mockResolvedValue(mockApp)
        mockSave.mockResolvedValue(mockApp)

        vi.mocked(readBody).mockResolvedValue({ client_name: 'Legacy App' })
        await updateHandler(event)
        expect(mockApp.requirePKCE).toBe(false)

        vi.mocked(readBody).mockResolvedValue({ client_name: 'Legacy App', require_pkce: true })
        const result = await updateHandler(event) as any
        expect(mockApp.requirePKCE).toBe(true)
        expect(result.data.requirePkce).toBe(true)
    })

    it('should handle database errors', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({ disabled: true })

        mockFindOne.mockResolvedValue({ id: 'app-123' })
        mockSave.mockRejectedValue(new Error('Database error'))

        await expect(updateHandler(event)).rejects.toMatchObject({
            statusCode: 500,
            message: '更新应用失败',
        })
        expect(logger.business.oauthAppUpdateFailed).toHaveBeenCalled()
    })

    it('returns localized English message for 404 when request language is en-US', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({})
        mockFindOne.mockResolvedValue(null)
        Object.defineProperty(event, 'path', { value: '/api/admin/oauth/applications/app-123', configurable: true })
        const headers = new Map<string, string>()
        Object.defineProperty(event, 'node', {
            value: {
                res: {
                    setHeader: (key: string, value: string) => headers.set(key, value),
                    getHeader: (key: string) => headers.get(key),
                },
            },
            configurable: true,
        })
        vi.stubGlobal('tryHeaderLocale', vi.fn(() => 'en-US'))
        vi.stubGlobal('useTranslation', vi.fn(async () => (key: string) => (
            key === 'errors.admin.oauthAppNotFound' ? 'Application not found' : key
        )))

        await expect(updateHandler(event)).rejects.toMatchObject({
            statusCode: 404,
            message: 'Application not found',
        })
        expect(headers.get('Content-Language')).toBe('en-US')
    })

    it('returns localized English message for 500 when request language is en-US', async () => {
        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue({ disabled: true })
        mockFindOne.mockResolvedValue({ id: 'app-123' })
        mockSave.mockRejectedValue(new Error('Database error'))
        Object.defineProperty(event, 'path', { value: '/api/admin/oauth/applications/app-123', configurable: true })
        vi.stubGlobal('tryHeaderLocale', vi.fn(() => 'en-US'))
        vi.stubGlobal('useTranslation', vi.fn(async () => (key: string) => (
            key === 'errors.admin.oauthAppUpdateFailed' ? 'Could not update the application' : key
        )))

        await expect(updateHandler(event)).rejects.toMatchObject({
            statusCode: 500,
            message: 'Could not update the application',
        })
    })
})
