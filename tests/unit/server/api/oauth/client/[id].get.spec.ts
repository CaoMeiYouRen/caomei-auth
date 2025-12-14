import { describe, it, expect, vi, beforeEach } from 'vitest'
import handler from '@/server/api/oauth/client/[id].get'
import { dataSource } from '@/server/database'
import { OAuthApplication } from '@/server/entities/oauth-application'

// Mock dependencies
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: vi.fn(),
    },
}))

describe('server/api/oauth/client/[id].get', () => {
    const mockRepo = {
        findOne: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue(mockRepo as any)
    })

    it('should return public client info', async () => {
        const clientId = 'client-123'
        const mockApp = {
            id: 'app-1',
            clientId,
            name: 'Test App',
            description: 'Test Description',
            clientUri: 'https://example.com',
            logoUri: 'https://example.com/logo.png',
            scope: 'openid',
            tosUri: 'https://example.com/tos',
            policyUri: 'https://example.com/policy',
            type: 'web',
            clientSecret: 'secret', // Should not be returned
            redirectURLs: 'https://callback.com', // Should not be returned
            disabled: false,
        }
        mockRepo.findOne.mockResolvedValue(mockApp)

        const event = { context: { params: { id: clientId } } }
        const result = await handler(event as any)

        expect(dataSource.getRepository).toHaveBeenCalledWith(OAuthApplication)
        expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { clientId } })
        expect(result).toEqual({
            status: 200,
            success: true,
            data: {
                id: 'app-1',
                clientId,
                name: 'Test App',
                description: 'Test Description',
                clientUri: 'https://example.com',
                logoUri: 'https://example.com/logo.png',
                scope: 'openid',
                tosUri: 'https://example.com/tos',
                policyUri: 'https://example.com/policy',
                type: 'web',
            },
        })
    })

    it('should return 400 if client ID is missing', async () => {
        const event = { context: { params: {} } }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: '缺少客户端ID',
            data: null,
        })
    })

    it('should return 404 if client not found', async () => {
        const clientId = 'client-123'
        mockRepo.findOne.mockResolvedValue(null)

        const event = { context: { params: { id: clientId } } }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 404,
            success: false,
            message: '应用不存在或已被禁用',
            data: null,
        })
    })

    it('should return 404 if client is disabled', async () => {
        const clientId = 'client-123'
        mockRepo.findOne.mockResolvedValue({ disabled: true })

        const event = { context: { params: { id: clientId } } }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 404,
            success: false,
            message: '应用不存在或已被禁用',
            data: null,
        })
    })

    it('should handle database errors', async () => {
        const clientId = 'client-123'
        const error = new Error('Database error')
        mockRepo.findOne.mockRejectedValue(error)

        const event = { context: { params: { id: clientId } } }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 500,
            success: false,
            message: 'Database error',
            data: null,
        })
    })
})
