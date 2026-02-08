/**
 * @vitest-environment node
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getQuery } from 'h3'
import { Like } from 'typeorm'
import handler from '@/server/api/admin/sso/providers/index.get'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        getQuery: vi.fn(),
    }
})

vi.mock('typeorm', async () => {
    const actual = await vi.importActual('typeorm')
    return {
        ...actual,
        Like: vi.fn((val) => `Like(${val})`),
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

describe('server/api/admin/sso/providers/index.get', () => {
    const mockRepo = {
        findAndCount: vi.fn(),
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
        vi.mocked(getQuery).mockReturnValue({})
    })

    it('should fetch providers with default pagination and sorting', async () => {
        const mockProviders = [
            { id: 'p1', name: 'Provider 1', createdAt: new Date() },
        ]
        mockRepo.findAndCount.mockResolvedValue([mockProviders, 1])

        const event = { context: {} }
        const result = await handler(event as any)

        expect(mockRepo.findAndCount).toHaveBeenCalledWith({
            where: [{}],
            skip: 0,
            take: 10,
            order: { createdAt: 'DESC' },
            relations: ['user'],
        })
        expect(result).toEqual({
            success: true,
            data: mockProviders,
            total: 1,
        })
    })

    it('should apply search and filters', async () => {
        vi.mocked(getQuery).mockReturnValue({
            page: 1,
            limit: 20,
            search: 'test',
            type: 'oidc',
            enabled: 'true',
            sortField: 'name',
            sortOrder: 'ASC',
        })
        mockRepo.findAndCount.mockResolvedValue([[], 0])

        const event = { context: {} }
        await handler(event as any)

        expect(Like).toHaveBeenCalledWith('%test%')
        expect(mockRepo.findAndCount).toHaveBeenCalledWith({
            where: [
                { name: 'Like(%test%)', type: 'oidc', enabled: true },
                { providerId: 'Like(%test%)', type: 'oidc', enabled: true },
                { domain: 'Like(%test%)', type: 'oidc', enabled: true },
                { issuer: 'Like(%test%)', type: 'oidc', enabled: true },
            ],
            skip: 20,
            take: 20,
            order: { name: 'ASC' },
            relations: ['user'],
        })
    })

    it('should sanitize sensitive information', async () => {
        const mockProviders = [
            {
                id: 'p1',
                clientSecret: 'secret-123',
                oidcConfig: JSON.stringify({ clientSecret: 'oidc-secret' }),
                samlConfig: JSON.stringify({ signingKey: 'saml-key' }),
            },
            {
                id: 'p2',
                oidcConfig: { clientSecret: 'oidc-secret-obj' }, // Object format
            },
        ]
        mockRepo.findAndCount.mockResolvedValue([mockProviders, 2])

        const event = { context: {} }
        const result = await handler(event as any)

        const p1 = result.data[0]!
        const p2 = result.data[1]!

        expect(p1.clientSecret).toBe('***')
        expect(JSON.parse(p1.oidcConfig).clientSecret).toBe('***')
        expect(JSON.parse(p1.samlConfig).signingKey).toBe('***')

        expect(JSON.parse(p2.oidcConfig).clientSecret).toBe('***')
    })

    it('should handle database errors', async () => {
        const error = new Error('Database error')
        mockRepo.findAndCount.mockRejectedValue(error)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('Database error')

        expect(logger.error).toHaveBeenCalledWith('Failed to get SSO providers list', {
            error: 'Database error',
        })
    })
})
