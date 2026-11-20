import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    checkAdmin: vi.fn(),
    validateParamsSafe: vi.fn(),
    createRequest: vi.fn(),
    deliver: vi.fn(),
    phoneConfigured: vi.fn(),
    audit: vi.fn(),
    userRepository: { findOne: vi.fn() },
    channelRepository: { save: vi.fn(async (item) => item) },
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: state.readBody }
})
vi.mock('@/server/utils/check-admin', () => ({ checkAdmin: state.checkAdmin }))
vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/validation', () => ({ validateParamsSafe: state.validateParamsSafe }))
vi.mock('@/server/utils/i18n', () => ({
    getServerI18n: async () => ({ t: (key: string) => key }),
    createLocalizedError: async (_event: unknown, options: { statusCode: number, key: string, data?: unknown }) => {
        const error = new Error(options.key) as Error & { statusCode: number, data?: unknown }
        error.statusCode = options.statusCode
        error.data = options.data
        return error
    },
}))
vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: (entity: any) => {
            if (entity?.name === 'ChannelChangeRequest') {
                return state.channelRepository
            }
            return state.userRepository
        },
    },
}))
vi.mock('@/server/utils/channel-change', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/channel-change')>()
    return {
        ...actual,
        createChannelChangeRequest: state.createRequest,
    }
})
vi.mock('@/server/utils/channel-change-delivery', () => ({ deliverChannelChangeCode: state.deliver }))
vi.mock('@/server/utils/recovery-channels', () => ({ isPhoneChannelConfigured: state.phoneConfigured }))
vi.mock('@/server/utils/registration-policy', () => ({ evaluateRegistration: vi.fn(async () => ({ allowed: true })) }))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))

const handler = (await import('@/server/api/admin/users/[id]/channel-change.post')).default

describe('admin channel change API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.checkAdmin.mockResolvedValue({ data: { userId: 'admin-1' } })
        state.validateParamsSafe.mockResolvedValue({ success: true, data: { id: 'u1' } })
        state.phoneConfigured.mockReturnValue(true)
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', email: 'old@example.com', phoneNumber: '+8613800138000' }
            }
            return null
        })
        state.createRequest.mockResolvedValue({
            request: { id: 'req-1', expiresAt: new Date('2026-11-20T00:10:00Z') },
            code: '123456',
        })
        state.deliver.mockResolvedValue(undefined)
    })

    it('creates a request and audits the administrator action', async () => {
        state.readBody.mockResolvedValue({ channel: 'email', value: 'New@Example.com', reason: 'user lost mailbox' })
        const event = { headers: new Headers(), node: { req: { headers: {} } }, context: {} }
        const result = await handler(event as never)

        expect(state.createRequest).toHaveBeenCalledWith(expect.objectContaining({
            userId: 'u1',
            channel: 'email',
            value: 'new@example.com',
            requestedBy: 'admin-1',
            reason: 'user lost mailbox',
        }))
        expect(result.data).toMatchObject({ id: 'req-1', channel: 'email' })
        expect(state.audit).toHaveBeenCalledWith(event, expect.objectContaining({
            action: 'channel.change.request',
            actorId: 'admin-1',
            targetUserId: 'u1',
            source: 'admin',
        }))
    })

    it('requires a reason and validates the target', async () => {
        state.readBody.mockResolvedValue({ channel: 'email', value: 'new@example.com', reason: '' })
        await expect(handler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({ statusCode: 400 })

        state.readBody.mockResolvedValue({ channel: 'email', value: 'not-an-email', reason: 'ok' })
        await expect(handler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({ statusCode: 400 })
    })

    it('rejects a taken target', async () => {
        state.readBody.mockResolvedValue({ channel: 'email', value: 'taken@example.com', reason: 'ok' })
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', email: 'old@example.com' }
            }
            return { id: 'u2' }
        })
        await expect(handler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({
            statusCode: 409,
            data: { code: 'TARGET_TAKEN' },
        })
    })

    it('rejects phone changes when SMS is not configured', async () => {
        state.phoneConfigured.mockReturnValue(false)
        state.readBody.mockResolvedValue({ channel: 'phone', value: '+8613800138000', reason: 'ok' })
        await expect(handler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({
            statusCode: 400,
            data: { code: 'CHANNEL_NOT_CONFIGURED' },
        })
        expect(state.createRequest).not.toHaveBeenCalled()
    })

    it('cancels the request when delivery fails', async () => {
        state.readBody.mockResolvedValue({ channel: 'email', value: 'new@example.com', reason: 'ok' })
        state.deliver.mockRejectedValue(new Error('smtp down'))
        await expect(handler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({ statusCode: 502 })
        expect(state.channelRepository.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'cancelled' }))
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ result: 'failure' }))
    })
})
