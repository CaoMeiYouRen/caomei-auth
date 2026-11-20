import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    readBody: vi.fn(),
    getUserSession: vi.fn(),
    changeEmail: vi.fn(),
    verifyPhoneNumber: vi.fn(),
    userRepository: { findOne: vi.fn() },
}))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: state.readBody }
})
vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            changeEmail: state.changeEmail,
            verifyPhoneNumber: state.verifyPhoneNumber,
        },
    },
}))
vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: state.getUserSession }))
vi.mock('@/server/utils/i18n', () => ({
    createLocalizedError: async (_event: unknown, options: { statusCode: number, key: string, data?: unknown }) => {
        const error = new Error(options.key) as Error & { statusCode: number, data?: unknown }
        error.statusCode = options.statusCode
        error.data = options.data
        return error
    },
}))
vi.mock('@/server/database', () => ({
    dataSource: { getRepository: () => state.userRepository },
}))
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: vi.fn() }))

const changeEmailHandler = (await import('@/server/api/security/change-email.post')).default
const bindPhoneHandler = (await import('@/server/api/security/bind-phone.post')).default

describe('self-service channel change APIs', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.getUserSession.mockResolvedValue({ userId: 'u1' })
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', email: 'old@example.com', phoneNumber: '+8613800138000' }
            }
            return null
        })
    })

    it('rejects an email already used by another account', async () => {
        state.readBody.mockResolvedValue({ newEmail: 'taken@example.com' })
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', email: 'old@example.com' }
            }
            return { id: 'u2' }
        })

        await expect(changeEmailHandler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({
            statusCode: 409,
            data: { code: 'TARGET_TAKEN' },
        })
        expect(state.changeEmail).not.toHaveBeenCalled()
    })

    it('delegates a valid email change to better-auth with the same headers', async () => {
        state.readBody.mockResolvedValue({ newEmail: 'new@example.com', callbackURL: '/profile' })
        state.changeEmail.mockResolvedValue({ status: true })
        const headers = new Headers({ 'x-captcha-response': 'token' })

        const result = await changeEmailHandler({ headers, context: {} } as never)

        expect(result).toEqual({ status: true })
        expect(state.changeEmail).toHaveBeenCalledWith({
            body: { newEmail: 'new@example.com', callbackURL: '/profile' },
            headers,
        })
    })

    it('rejects a phone number already used by another account', async () => {
        state.readBody.mockResolvedValue({ phoneNumber: '+8613800138000', code: '123456' })
        state.userRepository.findOne.mockImplementation(async ({ where }: any) => {
            if (where.id === 'u1') {
                return { id: 'u1', phoneNumber: '+8613800138000' }
            }
            return { id: 'u2' }
        })

        await expect(bindPhoneHandler({ headers: new Headers(), context: {} } as never)).rejects.toMatchObject({
            statusCode: 409,
            data: { code: 'TARGET_TAKEN' },
        })
        expect(state.verifyPhoneNumber).not.toHaveBeenCalled()
    })

    it('binds a free phone number through better-auth', async () => {
        state.readBody.mockResolvedValue({ phoneNumber: '+8613900139000', code: '123456' })
        state.verifyPhoneNumber.mockResolvedValue({ status: true })

        await bindPhoneHandler({ headers: new Headers(), context: {} } as never)

        expect(state.verifyPhoneNumber).toHaveBeenCalledWith(expect.objectContaining({
            body: { phoneNumber: '+8613900139000', code: '123456', updatePhoneNumber: true },
        }))
    })
})
