import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    getUserSession: vi.fn(),
    validateParamsSafe: vi.fn(),
    count: vi.fn(),
    list: vi.fn(),
    remove: vi.fn(),
    audit: vi.fn(),
}))

vi.mock('@/server/utils/rate-limit', () => ({ rateLimit: vi.fn(async () => undefined) }))
vi.mock('@/server/utils/get-user-session', () => ({ getUserSession: state.getUserSession }))
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
vi.mock('@/server/utils/audit-log', () => ({ auditFromEvent: state.audit }))
vi.mock('@/server/utils/recovery-code', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@/server/utils/recovery-code')>()
    return {
        ...actual,
        countRemainingRecoveryCodes: state.count,
        listRecoveryCodes: state.list,
        deleteRecoveryCode: state.remove,
    }
})

const getHandler = (await import('@/server/api/security/recovery-codes/index.get')).default
const deleteHandler = (await import('@/server/api/security/recovery-codes/[id].delete')).default

describe('recovery code lifecycle API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.getUserSession.mockResolvedValue({ userId: 'u1', user: { id: 'u1' }, session: { session: { createdAt: new Date() } } })
        state.count.mockResolvedValue(7)
        state.list.mockResolvedValue([
            { id: 'rc-1', createdAt: new Date('2026-11-21T00:00:00Z'), usedAt: null },
        ])
        state.remove.mockResolvedValue(true)
        state.validateParamsSafe.mockResolvedValue({ success: true, data: { id: 'rc-1' } })
    })

    it('returns remaining count and metadata without hashes', async () => {
        const response = await getHandler({ headers: new Headers() } as any)
        expect(response).toEqual({
            status: true,
            data: {
                remaining: 7,
                total: 1,
                codes: [{ id: 'rc-1', createdAt: new Date('2026-11-21T00:00:00Z'), usedAt: null }],
            },
        })
        expect(JSON.stringify(response)).not.toMatch(/codeHash|used_at/iu)
    })

    it('deletes an owned recovery code and audits it', async () => {
        const response = await deleteHandler({ headers: new Headers() } as any)
        expect(response).toEqual({ status: true })
        expect(state.remove).toHaveBeenCalledWith({ userId: 'u1', id: 'rc-1' })
        expect(state.audit).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
            action: 'recoveryCodes.delete',
        }))
    })

    it('returns 404 for unknown or foreign codes', async () => {
        state.remove.mockResolvedValue(false)
        await expect(deleteHandler({ headers: new Headers() } as any)).rejects.toMatchObject({
            statusCode: 404,
            data: { code: 'RECOVERY_CODE_NOT_FOUND' },
        })
        expect(state.audit).not.toHaveBeenCalled()
    })
})
