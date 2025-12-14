import { describe, it, expect, vi, beforeEach } from 'vitest'
import { H3Event } from 'h3'
import indexHandler from '@/server/api/admin/oauth/applications/index.post'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { snowflake } from '@/server/utils/snowflake'
import { generateClientSecret } from '@/server/utils/auth-generators'
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

vi.mock('@/server/utils/snowflake', () => ({
    snowflake: {
        generateId: vi.fn(),
    },
}))

vi.mock('@/server/utils/auth-generators', () => ({
    generateClientSecret: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        business: {
            oauthAppCreateFailed: vi.fn(),
        },
    },
}))

describe('server/api/admin/oauth/applications/index.post', () => {
    let event: H3Event
    const mockSave = vi.fn()
    const mockRepo = {
        save: mockSave,
    }

    beforeEach(() => {
        vi.clearAllMocks()
        event = {} as H3Event

        // Setup default mocks
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
        vi.mocked(checkAdmin).mockResolvedValue({
            success: true,
            data: { userId: 'admin-123' },
        } as any)
        vi.mocked(snowflake.generateId).mockReturnValue('app-123')
        vi.mocked(generateClientSecret).mockReturnValue('secret-123')
    })

    it('should create application successfully with valid data', async () => {
        const validBody = {
            client_name: 'Test App',
            redirect_uris: ['https://example.com/callback'],
            token_endpoint_auth_method: 'client_secret_basic',
            grant_types: ['authorization_code'],
            response_types: ['code'],
            scope: 'openid profile',
            type: 'web',
            disabled: false,
        }

        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue(validBody)
        mockSave.mockResolvedValue({ ...validBody, id: 'app-123' })

        const result = await indexHandler(event) as any

        expect(result.status).toBe(201)
        expect(result.success).toBe(true)
        expect(result.data.client_id).toBe('app-123')
        expect(result.data.client_secret).toBe('secret-123')
        expect(result.data.client_name).toBe('Test App')
        expect(mockSave).toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
        const invalidBody = {
            // Missing required fields
            client_name: 'Test App',
        }

        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue(invalidBody)

        const result = await indexHandler(event) as any

        expect(result.status).toBe(400)
        expect(result.success).toBe(false)
        expect(result.message).toBeTruthy()
        expect(mockSave).not.toHaveBeenCalled()
    })

    it('should validate redirect URIs', async () => {
        const bodyWithInvalidUri = {
            client_name: 'Test App',
            redirect_uris: ['not-a-url'],
            token_endpoint_auth_method: 'client_secret_basic',
            grant_types: ['authorization_code'],
            response_types: ['code'],
            type: 'web',
        }

        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue(bodyWithInvalidUri)

        const result = await indexHandler(event) as any

        expect(result.status).toBe(400)
        expect(result.success).toBe(false)
        expect(result.message).toContain('无效的重定向URI')
        expect(mockSave).not.toHaveBeenCalled()
    })

    it('should handle database errors', async () => {
        const validBody = {
            client_name: 'Test App',
            redirect_uris: ['https://example.com/callback'],
            token_endpoint_auth_method: 'client_secret_basic',
            grant_types: ['authorization_code'],
            response_types: ['code'],
            type: 'web',
        }

        const { readBody } = await import('h3')
        vi.mocked(readBody).mockResolvedValue(validBody)
        mockSave.mockRejectedValue(new Error('Database error'))

        const result = await indexHandler(event) as any

        expect(result.status).toBe(500)
        expect(result.success).toBe(false)
        expect(result.message).toBe('Database error')
        expect(logger.business.oauthAppCreateFailed).toHaveBeenCalled()
    })
})
