import { describe, expect, it, vi } from 'vitest'
import loggerMock from '../../mocks/logger'
import {
    buildAuditEntry,
    eventAuditMeta,
    requestAuditMeta,
    sanitizeAuditValue,
    writeAuditEvent,
} from '@/server/utils/audit-log'

describe('server/utils/audit-log', () => {
    it('defaults missing fields and keeps a timestamp', () => {
        const entry = buildAuditEntry({ action: 'twoFactor.enable' })
        expect(entry.action).toBe('twoFactor.enable')
        expect(entry.actorId).toBeNull()
        expect(entry.targetUserId).toBeNull()
        expect(entry.result).toBe('success')
        expect(entry.source).toBe('web')
        expect(entry.before).toBeNull()
        expect(entry.after).toBeNull()
        expect(() => new Date(entry.timestamp).toISOString()).not.toThrow()
    })

    it('masks email and phone and redacts secrets in nested state', () => {
        const entry = buildAuditEntry({
            action: 'channel.change.request',
            before: {
                email: 'old@example.com',
                phoneNumber: '+8613800138000',
                nested: { password: 'secret', code: '123456', note: 'ok' },
            },
            after: { email: 'new@example.com' },
        })
        const before = entry.before as Record<string, unknown>
        expect(before.email).toBe('o***@example.com')
        expect(before.phoneNumber).toBe('+86 138 **** 8000')
        expect(before.nested).toEqual({ password: '[REDACTED]', code: '[REDACTED]', note: 'ok' })
        expect((entry.after as Record<string, unknown>).email).toBe('n***@example.com')
        expect(JSON.stringify(entry)).not.toContain('old@example.com')
        expect(JSON.stringify(entry)).not.toContain('123456')
    })

    it('sanitizes arrays without dropping the parent key semantics', () => {
        expect(sanitizeAuditValue([{ email: 'a@b.com' }], 'items')).toEqual([{ email: 'a***@b.com' }])
    })

    it('writes entries through the audit channel and never throws', () => {
        writeAuditEvent({
            action: 'password.reset',
            actorId: 'user-1',
            targetUserId: 'user-1',
            reason: 'otp',
        })
        expect(loggerMock.audit.record).toHaveBeenCalledWith(expect.objectContaining({
            action: 'password.reset',
            actorId: 'user-1',
            reason: 'otp',
        }))

        vi.mocked(loggerMock.audit.record).mockImplementationOnce(() => {
            throw new Error('disk full')
        })
        expect(() => writeAuditEvent({ action: 'password.reset' })).not.toThrow()
        expect(loggerMock.warn).toHaveBeenCalled()
    })

    it('extracts request metadata from web and H3 requests', () => {
        const request = new Request('https://example.com', {
            headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.1', 'user-agent': 'vitest' },
        })
        expect(requestAuditMeta(request)).toEqual({ ip: '203.0.113.9', userAgent: 'vitest' })
        expect(requestAuditMeta(null)).toEqual({ ip: null, userAgent: null })

        const event = {
            node: { req: { headers: { 'x-real-ip': '198.51.100.2', 'user-agent': 'h3' } } },
            context: { authUserId: 'actor-1' },
        }
        expect(eventAuditMeta(event as never)).toEqual({
            ip: '198.51.100.2',
            userAgent: 'h3',
            actorId: 'actor-1',
        })
    })
})
