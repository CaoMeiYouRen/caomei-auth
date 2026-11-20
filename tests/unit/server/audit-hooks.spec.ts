import { describe, expect, it, vi } from 'vitest'
import loggerMock from '../../mocks/logger'
import {
    auditChannelChangeRequested,
    auditEmailChangeRequested,
    auditPasswordReset,
    auditPasswordResetRequested,
    auditPhoneBound,
    auditSocialAccountLinked,
} from '@/server/utils/audit-hooks'

function lastAudit() {
    const calls = vi.mocked(loggerMock.audit.record).mock.calls
    return calls.at(-1)?.[0] as Record<string, any>
}

describe('server/utils/audit-hooks', () => {
    it('records email change requests with masked before/after', () => {
        auditEmailChangeRequested(
            { user: { id: 'u1', email: 'old@example.com' }, newEmail: 'new@example.com' },
            new Request('https://example.com', { headers: { 'x-forwarded-for': '203.0.113.5', 'user-agent': 'ua' } }),
        )
        expect(lastAudit()).toMatchObject({
            action: 'channel.change.request',
            actorId: 'u1',
            targetUserId: 'u1',
            before: { email: 'o***@example.com' },
            after: { email: 'n***@example.com' },
            source: 'web',
            ip: '203.0.113.5',
            userAgent: 'ua',
        })
    })

    it('records phone channel requests with masked target', () => {
        auditChannelChangeRequested({
            user: { id: 'u1' },
            channel: 'phone',
            newValue: '+8613800138000',
            actorId: 'admin-1',
            source: 'admin',
        })
        expect(lastAudit()).toMatchObject({
            action: 'channel.change.request',
            actorId: 'admin-1',
            targetUserId: 'u1',
            before: null,
            after: { phone: '+86 138 **** 8000' },
            source: 'admin',
        })
    })

    it('records phone binding', () => {
        auditPhoneBound({ phoneNumber: '+8613800138000', user: { id: 'u1' } })
        expect(lastAudit()).toMatchObject({ action: 'phone.bind', actorId: 'u1', targetUserId: 'u1' })
    })

    it('skips non-social account providers and records social binds', () => {
        auditSocialAccountLinked({ userId: 'u1', providerId: 'credential' })
        expect(loggerMock.audit.record).not.toHaveBeenCalled()

        auditSocialAccountLinked({ userId: 'u1', providerId: 'github' })
        expect(lastAudit()).toMatchObject({ action: 'social.bind', after: { provider: 'github' } })
    })

    it('only records password reset requests for reset flows', () => {
        auditPasswordResetRequested({ email: 'a@example.com', type: 'sign-in' })
        expect(loggerMock.audit.record).not.toHaveBeenCalled()

        auditPasswordResetRequested({ email: 'a@example.com', type: 'forget-password' })
        expect(lastAudit()).toMatchObject({
            action: 'password.reset.request',
            after: { email: 'a***@example.com' },
        })
    })

    it('records completed password resets', () => {
        auditPasswordReset({ user: { id: 'u1' } })
        expect(lastAudit()).toMatchObject({
            action: 'password.reset',
            actorId: 'u1',
            after: { passwordReset: true },
        })
    })
})
