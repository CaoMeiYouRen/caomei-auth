import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '@/server/api/oauth/consents.get'
import { dataSource } from '@/server/database'
import { getUserSession } from '@/server/utils/get-user-session'
import { OAuthConsent } from '@/server/entities/oauth-consent'
import { OAuthApplication } from '@/server/entities/oauth-application'

// Mock dependencies
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

vi.mock('@/server/utils/get-user-session', () => ({
    getUserSession: vi.fn(),
}))

describe('server/api/oauth/consents.get', () => {
    const mockConsentRepo = {
        createQueryBuilder: vi.fn(),
    }
    const mockAppRepo = {
        findOne: vi.fn(),
    }
    const mockQueryBuilder = {
        leftJoinAndSelect: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getRawAndEntities: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockImplementation((entity) => {
            if (entity === OAuthConsent) {
                return mockConsentRepo as any
            }
            if (entity === OAuthApplication) {
                return mockAppRepo as any
            }
            return {} as any
        })
        mockConsentRepo.createQueryBuilder.mockReturnValue(mockQueryBuilder)
    })

    it('should return authorized apps for logged in user', async () => {
        const userId = 'user-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)

        const mockConsents = [
            { id: 'c1', clientId: 'client-1', createdAt: new Date(), scopes: 'openid,profile', consentGiven: true },
        ]
        mockQueryBuilder.getRawAndEntities.mockResolvedValue({
            entities: mockConsents,
            raw: [],
        })

        const mockApp = {
            clientId: 'client-1',
            name: 'Test App',
            description: 'Test Description',
            logoUri: 'https://example.com/logo.png',
            clientUri: 'https://example.com',
            tosUri: 'https://example.com/tos',
            policyUri: 'https://example.com/policy',
            disabled: false,
        }
        mockAppRepo.findOne.mockResolvedValue(mockApp)

        const event = { context: {} }
        const result = await handler(event as any)

        expect(getUserSession).toHaveBeenCalledWith(event)
        expect(mockConsentRepo.createQueryBuilder).toHaveBeenCalledWith('consent')
        expect(mockQueryBuilder.where).toHaveBeenCalledWith('consent.userId = :userId', { userId })
        expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('consent.consentGiven = :consentGiven', { consentGiven: true })
        expect(mockAppRepo.findOne).toHaveBeenCalledWith({ where: { clientId: 'client-1' } })

        expect(result).toEqual({
            status: 200,
            success: true,
            data: [
                {
                    id: 'c1',
                    clientId: 'client-1',
                    consentedAt: mockConsents[0]!.createdAt,
                    scopes: ['openid', 'profile'],
                    application: {
                        name: 'Test App',
                        description: 'Test Description',
                        logoUri: 'https://example.com/logo.png',
                        clientUri: 'https://example.com',
                        tosUri: 'https://example.com/tos',
                        policyUri: 'https://example.com/policy',
                    },
                },
            ],
        })
    })

    it('should throw 401 if user is not logged in', async () => {
        vi.mocked(getUserSession).mockResolvedValue(null as any)

        const event = { context: {} }
        await expect(handler(event as any)).rejects.toThrow('请先登录')
    })

    it('should skip disabled applications', async () => {
        const userId = 'user-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)

        const mockConsents = [
            { id: 'c1', clientId: 'client-1', createdAt: new Date(), scopes: 'openid', consentGiven: true },
        ]
        mockQueryBuilder.getRawAndEntities.mockResolvedValue({
            entities: mockConsents,
            raw: [],
        })

        mockAppRepo.findOne.mockResolvedValue({ disabled: true })

        const event = { context: {} }
        const result = await handler(event as any)

        expect(result.data).toHaveLength(0)
    })

    it('should handle database errors', async () => {
        const userId = 'user-123'
        vi.mocked(getUserSession).mockResolvedValue({
            user: { id: userId },
        } as any)

        const error = new Error('Database error')
        mockConsentRepo.createQueryBuilder.mockImplementation(() => {
            throw error
        })

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
