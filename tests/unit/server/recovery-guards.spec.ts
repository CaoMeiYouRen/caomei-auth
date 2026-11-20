import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

const { assertAdminWriteAllowed, assertPasswordResetCompleted, clearPasswordResetRequirement } = await import('@/server/utils/recovery-guards')

describe('server/utils/recovery-guards', () => {
    it('blocks administrator password setting and direct channel edits', () => {
        expect(() => assertAdminWriteAllowed('/admin/set-user-password', {})).toThrow()
        expect(() => assertAdminWriteAllowed('/admin/update-user', { data: { email: 'a@b.com' } })).toThrow()
        expect(() => assertAdminWriteAllowed('/admin/update-user', { data: { phoneNumber: '+1' } })).toThrow()
    })

    it('allows name / role updates and unrelated endpoints', () => {
        expect(() => assertAdminWriteAllowed('/admin/update-user', { data: { name: 'n', role: 'user' } })).not.toThrow()
        expect(() => assertAdminWriteAllowed('/admin/ban-user', {})).not.toThrow()
    })

    it('blocks session creation while a password reset is required', async () => {
        const repository = { findOne: vi.fn(async () => ({ id: 'u1', mustResetPassword: true })) }
        await expect(assertPasswordResetCompleted({ userId: 'u1' }, null, repository as any))
            .rejects.toMatchObject({ body: { code: 'PASSWORD_RESET_REQUIRED' } })
    })

    it('allows session creation when no reset is required or user is missing', async () => {
        const allowed = { findOne: vi.fn(async () => ({ id: 'u1', mustResetPassword: false })) }
        await expect(assertPasswordResetCompleted({ userId: 'u1' }, null, allowed as any)).resolves.toBeUndefined()

        const missing = { findOne: vi.fn(async () => null) }
        await expect(assertPasswordResetCompleted({ userId: 'u1' }, null, missing as any)).resolves.toBeUndefined()
        await expect(assertPasswordResetCompleted({}, null, missing as any)).resolves.toBeUndefined()
    })

    it('clears the forced reset flag', async () => {
        const repository = { update: vi.fn(async () => ({ affected: 1 })) }
        await clearPasswordResetRequirement('u1', repository as any)
        expect(repository.update).toHaveBeenCalledWith({ id: 'u1' }, { mustResetPassword: false })
    })
})
