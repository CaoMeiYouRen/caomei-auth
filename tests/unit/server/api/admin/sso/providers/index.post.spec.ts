import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readBody } from 'h3'
import handler from '@/server/api/admin/sso/providers/index.post'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { snowflake } from '@/server/utils/snowflake'

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

vi.mock('@/server/utils/check-admin', () => ({
    checkAdmin: vi.fn(),
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

vi.mock('@/server/utils/snowflake', () => ({
    snowflake: {
        generateId: vi.fn(),
    },
}))

describe('server/api/admin/sso/providers/index.post', () => {
    const mockRepo = {
        findOne: vi.fn(),
        save: vi.fn(),
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
        vi.mocked(snowflake.generateId).mockReturnValue('new-id-123')
    })

    it('should return 400 if validation fails', async () => {
        vi.mocked(readBody).mockResolvedValue({}) // Empty body

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow()
    })

    it('should return 409 if providerId already exists', async () => {
        const validBody = {
            type: 'oidc',
            providerId: 'existing-provider',
            name: 'Existing Provider',
            issuer: 'https://issuer.com',
            domain: 'example.com',
            oidcConfig: {
                clientId: 'client-id',
                clientSecret: 'client-secret',
                authorizationUrl: 'https://auth',
                tokenUrl: 'https://token',
                userInfoUrl: 'https://userinfo',
            },
        }
        vi.mocked(readBody).mockResolvedValue(validBody)
        mockRepo.findOne.mockResolvedValue({ id: 'existing' })

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('Provider ID 已存在')
    })

    it('should create a new OIDC provider successfully', async () => {
        const validBody = {
            type: 'oidc',
            providerId: 'new-oidc',
            name: 'New OIDC',
            issuer: 'https://issuer.com',
            domain: 'example.com',
            oidcConfig: {
                clientId: 'client-id',
                clientSecret: 'client-secret',
                authorizationUrl: 'https://auth',
                tokenUrl: 'https://token',
                userInfoUrl: 'https://userinfo',
            },
        }
        vi.mocked(readBody).mockResolvedValue(validBody)
        mockRepo.findOne.mockResolvedValue(null)
        mockRepo.save.mockImplementation((provider) => Promise.resolve(provider))

        const event = { context: {} }
        const result = await handler(event as any)

        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'new-id-123',
            type: 'oidc',
            providerId: 'new-oidc',
            oidcConfig: expect.any(String),
        }))
        expect(result.success).toBe(true)
        expect(result.message).toBe('SSO 提供商创建成功')
    })

    it('should create a new SAML provider successfully', async () => {
        const validBody = {
            type: 'saml',
            providerId: 'new-saml',
            name: 'New SAML',
            issuer: 'https://issuer.com',
            domain: 'example.com',
            samlConfig: {
                entryPoint: 'https://sso',
                cert: 'cert',
                issuer: 'entity-id',
            },
        }
        vi.mocked(readBody).mockResolvedValue(validBody)
        mockRepo.findOne.mockResolvedValue(null)
        mockRepo.save.mockImplementation((provider) => Promise.resolve(provider))

        const event = { context: {} }
        const result = await handler(event as any)

        expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
            id: 'new-id-123',
            type: 'saml',
            providerId: 'new-saml',
            samlConfig: expect.any(String),
        }))
        expect(result.success).toBe(true)
    })

    it('should handle database errors', async () => {
        const validBody = {
            type: 'oidc',
            providerId: 'error-provider',
            name: 'Error Provider',
            issuer: 'https://issuer.com',
            domain: 'example.com',
            oidcConfig: {
                clientId: 'client-id',
                clientSecret: 'client-secret',
                authorizationUrl: 'https://auth',
                tokenUrl: 'https://token',
                userInfoUrl: 'https://userinfo',
            },
        }
        vi.mocked(readBody).mockResolvedValue(validBody)
        mockRepo.findOne.mockRejectedValue(new Error('Database error'))

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('Database error')

        expect(logger.error).toHaveBeenCalledWith('Failed to create SSO provider', {
            error: 'Database error',
            provider: 'error-provider',
        })
    })
})
