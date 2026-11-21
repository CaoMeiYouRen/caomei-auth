import { beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 阶段 10 集成测试：恢复码 → 证明校验 → 改邮箱申请 → 归属确认 → 冷静期生效。
 *
 * 使用真实内存 SQLite（`tests/setup/vitest.setup.ts` 固定 `:memory:` + synchronize），
 * 只替换外部副作用（密码校验、邮件投递、二级存储）。
 */

vi.mock('@/lib/auth', () => ({
    auth: {
        $context: Promise.resolve({
            internalAdapter: {
                findCredentialAccount: vi.fn(async () => ({ id: 'acc-int-1', password: 'hashed' })),
            },
            password: { verify: vi.fn(async () => true) },
            secondaryStorage: undefined,
        }),
    },
}))

vi.mock('@/server/utils/email/service', () => ({
    emailService: {
        sendChannelChangeNotification: vi.fn(async () => undefined),
        sendChannelChangeCode: vi.fn(async () => undefined),
    },
}))

const { dataSource } = await import('@/server/database')
const { User } = await import('@/server/entities/user')
const { Session } = await import('@/server/entities/session')
const { ChannelChangeRequest } = await import('@/server/entities/channel-change-request')
const { generateRecoveryCodes, consumeRecoveryCode } = await import('@/server/utils/recovery-code')
const { verifyRecoveryProof, consumeProofFactor } = await import('@/server/utils/recovery-proof')
const { createChannelChangeRequest, verifyChannelChangeRequest } = await import('@/server/utils/channel-change')
const { applyScheduledChannelChange } = await import('@/server/utils/channel-change-apply')
const { resolveRequestState } = await import('@/server/utils/channel-change-state')

describe('phase 10 self-service email change integration', () => {
    beforeEach(async () => {
        await dataSource.getRepository(ChannelChangeRequest).clear()
        await dataSource.getRepository(Session).clear()
        await dataSource.getRepository(User).clear()
    })

    it('runs the full flow and applies the change exactly once', async () => {
        const userId = 'u-int-1'
        const userRepository = dataSource.getRepository(User)
        await userRepository.save(userRepository.create({
            id: userId,
            name: 'Integration',
            email: 'old@example.com',
            emailVerified: true,
            role: 'user',
            banned: false,
            twoFactorEnabled: false,
            mustResetPassword: false,
        } as any))

        const sessionRepository = dataSource.getRepository(Session)
        for (const token of ['token-1', 'token-2']) {
            await sessionRepository.save(sessionRepository.create({
                id: `s-${token}`,
                token,
                userId,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
            } as any))
        }

        const [code] = await generateRecoveryCodes({ userId, count: 1 })
        const proof = await verifyRecoveryProof({
            userId,
            purpose: 'change-email',
            password: 'passw0rd',
            factor: 'recovery-code',
            code: code!,
        })
        expect(proof.ok).toBe(true)
        if (!proof.ok) {
            return
        }
        expect(await consumeProofFactor({ userId, factor: proof.factor, code: code!, timeStep: proof.timeStep }))
            .toEqual({ ok: true })
        /* 同一恢复码不能再次使用 */
        expect(await consumeRecoveryCode({ userId, code: code! })).toEqual({ ok: false, reason: 'PROOF_CONSUMED' })

        const { request, code: ownershipCode } = await createChannelChangeRequest({
            userId,
            channel: 'email',
            value: 'New@Example.com',
            source: 'user',
            proofFactor: 'recovery-code',
        })
        const verified = await verifyChannelChangeRequest({ id: request.id, code: ownershipCode })
        expect(verified.ok).toBe(true)

        const repository = dataSource.getRepository(ChannelChangeRequest)
        request.scheduledAt = new Date(Date.now() - 1000)
        await repository.save(request)
        expect(resolveRequestState(request)).toBe('confirmed')

        const first = await applyScheduledChannelChange(request.id)
        expect(first.applied).toBe(true)

        const second = await applyScheduledChannelChange(request.id)
        expect(second).toMatchObject({ applied: false, reason: 'ALREADY_HANDLED' })

        const updated = await userRepository.findOne({ where: { id: userId } })
        expect(updated?.email).toBe('new@example.com')
        expect(updated?.emailVerified).toBe(true)
        expect(await sessionRepository.count({ where: { userId } })).toBe(0)

        const stored = await repository.findOne({ where: { id: request.id } })
        expect(stored?.status).toBe('confirmed')
        expect(stored?.confirmedAt).toBeInstanceOf(Date)
    })

    it('keeps the request pending until the cooling-off period ends', async () => {
        const userId = 'u-int-2'
        const userRepository = dataSource.getRepository(User)
        await userRepository.save(userRepository.create({
            id: userId,
            name: 'Pending',
            email: 'old@example.com',
            emailVerified: true,
            role: 'user',
            banned: false,
            twoFactorEnabled: false,
            mustResetPassword: false,
        } as any))

        const { request } = await createChannelChangeRequest({
            userId,
            channel: 'email',
            value: 'next@example.com',
            source: 'user',
            proofFactor: 'totp',
        })
        const repository = dataSource.getRepository(ChannelChangeRequest)
        request.scheduledAt = new Date(Date.now() + 60 * 60 * 1000)
        await repository.save(request)

        expect(resolveRequestState(request)).toBe('pending')
        expect(await applyScheduledChannelChange(request.id)).toMatchObject({ applied: false, reason: 'NOT_DUE' })
        const user = await userRepository.findOne({ where: { id: userId } })
        expect(user?.email).toBe('old@example.com')
    })
})
