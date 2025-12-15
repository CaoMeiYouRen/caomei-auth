import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getQuery } from 'h3'
import indexHandler from '@/server/api/admin/oauth/applications/index.get'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'

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
        business: {
            oauthAppListFailed: vi.fn(),
        },
        error: vi.fn(),
    },
}))

describe('server/api/admin/oauth/applications/index.get', () => {
    let mockRepo: any

    beforeEach(() => {
        vi.clearAllMocks()

        mockRepo = {
            findAndCount: vi.fn(),
        }

        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo)
    })

    it('should return application list with default pagination', async () => {
        // Mock Admin
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as any)

        // Mock Query
        vi.mocked(getQuery).mockReturnValue({})

        // Mock DB Result
        const mockApps = [
            {
                id: 'app-1',
                clientId: 'client-1',
                name: 'App 1',
                description: 'Desc 1',
                redirectURLs: 'http://localhost',
                tokenEndpointAuthMethod: 'client_secret_basic',
                grantTypes: 'authorization_code',
                responseTypes: 'code',
                clientUri: '',
                logoUri: '',
                scope: '',
                contacts: '',
                tosUri: '',
                policyUri: '',
                jwksUri: '',
                jwks: '{"keys":[]}',
                metadata: '{"foo":"bar"}',
                softwareId: '',
                softwareVersion: '',
                softwareStatement: '',
                type: 'web',
                disabled: false,
                createdAt: new Date('2023-01-01'),
                updatedAt: new Date('2023-01-01'),
            },
        ]
        mockRepo.findAndCount.mockResolvedValue([mockApps, 1])

        const event = {} as any
        const result = await indexHandler(event)

        expect(result).toEqual({
            status: 200,
            success: true,
            total: 1,
            data: [
                {
                    id: 'app-1',
                    clientId: 'client-1',
                    name: 'App 1',
                    description: 'Desc 1',
                    redirectURLs: 'http://localhost',
                    tokenEndpointAuthMethod: 'client_secret_basic',
                    grantTypes: 'authorization_code',
                    responseTypes: 'code',
                    clientUri: '',
                    logoUri: '',
                    scope: '',
                    contacts: '',
                    tosUri: '',
                    policyUri: '',
                    jwksUri: '',
                    jwks: { keys: [] },
                    metadata: { foo: 'bar' },
                    softwareId: '',
                    softwareVersion: '',
                    softwareStatement: '',
                    type: 'web',
                    disabled: false,
                    createdAt: new Date('2023-01-01'),
                    updatedAt: new Date('2023-01-01'),
                },
            ],
        })

        expect(mockRepo.findAndCount).toHaveBeenCalledWith({
            where: {},
            skip: 0,
            take: 10,
            order: {
                createdAt: 'DESC',
            },
        })
    })

    it('should handle search query and pagination', async () => {
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as any)
        vi.mocked(getQuery).mockReturnValue({
            search: 'test',
            page: '1',
            limit: '20',
            sortField: 'name',
            sortOrder: 'asc',
        })

        mockRepo.findAndCount.mockResolvedValue([[], 0])

        const event = {} as any
        await indexHandler(event)

        expect(mockRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
            where: [
                { name: 'Like(%test%)' },
                { description: 'Like(%test%)' },
                { clientId: 'Like(%test%)' },
            ],
            skip: 20,
            take: 20,
            order: {
                name: 'ASC',
            },
        }))
    })

    it('should handle null jwks and metadata', async () => {
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as any)
        vi.mocked(getQuery).mockReturnValue({})

        const mockApps = [
            {
                id: 'app-2',
                name: 'App 2',
                jwks: '',
                metadata: null,
                // ... other fields
            },
        ]
        mockRepo.findAndCount.mockResolvedValue([mockApps, 1])

        const event = {} as any
        const result = await indexHandler(event)

        expect(result.data?.[0]?.jwks).toBeNull()
        expect(result.data?.[0]?.metadata).toBeNull()
    })

    it('should handle errors', async () => {
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as any)
        vi.mocked(getQuery).mockReturnValue({})

        const error = new Error('DB Error')
        mockRepo.findAndCount.mockRejectedValue(error)

        const event = {} as any
        const result = await indexHandler(event)

        expect(result).toEqual({
            status: 500,
            success: false,
            message: 'DB Error',
            data: null,
        })

        const loggerModule = await import('@/server/utils/logger')
        expect(loggerModule.default.business.oauthAppListFailed).toHaveBeenCalledWith({
            error: 'DB Error',
            adminId: 'admin-1',
        })
    })
})
