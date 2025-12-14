import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRouterParam } from 'h3'
import handler from '@/server/api/admin/sso/providers/[id].get'
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

describe('server/api/admin/sso/providers/[id].get', () => {
    const mockRepo = {
        findOne: vi.fn(),
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

    it('should return 400 if ID is missing', async () => {
        vi.mocked(getRouterParam).mockReturnValue(undefined)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('缺少提供商 ID')
    })

    it('should return 404 if provider not found', async () => {
        vi.mocked(getRouterParam).mockReturnValue('non-existent')
        mockRepo.findOne.mockResolvedValue(null)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('SSO 提供商不存在')
    })

    it('should return provider details with sanitized secrets (OIDC)', async () => {
        vi.mocked(getRouterParam).mockReturnValue('oidc-1')
        const mockProvider = {
            id: 'oidc-1',
            type: 'oidc',
            clientSecret: 'secret-123',
            oidcConfig: JSON.stringify({
                clientId: 'client-id',
                clientSecret: 'secret-456',
            }),
        }
        mockRepo.findOne.mockResolvedValue(mockProvider)

        const event = { context: {} }
        const result = await handler(event as any)

        expect(result.success).toBe(true)
        expect(result.data.id).toBe('oidc-1')
        expect(result.data.clientSecret).toBe('***')

        const parsedConfig = JSON.parse(result.data.oidcConfig)
        expect(parsedConfig.clientSecret).toBe('***')
        expect(parsedConfig.clientId).toBe('client-id')
    })

    it('should return provider details with sanitized secrets (SAML)', async () => {
        vi.mocked(getRouterParam).mockReturnValue('saml-1')
        const mockProvider = {
            id: 'saml-1',
            type: 'saml',
            samlConfig: JSON.stringify({
                entryPoint: 'https://sso',
                signingKey: 'private-key',
            }),
        }
        mockRepo.findOne.mockResolvedValue(mockProvider)

        const event = { context: {} }
        const result = await handler(event as any)

        expect(result.success).toBe(true)
        expect(result.data.id).toBe('saml-1')

        const parsedConfig = JSON.parse(result.data.samlConfig)
        expect(parsedConfig.signingKey).toBe('***')
        expect(parsedConfig.entryPoint).toBe('https://sso')
    })

    it('should handle database errors', async () => {
        vi.mocked(getRouterParam).mockReturnValue('error-id')
        mockRepo.findOne.mockRejectedValue(new Error('Database error'))

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('Database error')

        expect(logger.error).toHaveBeenCalledWith('Failed to get SSO provider details', {
            error: 'Database error',
            providerId: 'error-id',
        })
    })
})
