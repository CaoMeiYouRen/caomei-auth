import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import type { Repository } from 'typeorm'
import { Verification } from '@/server/entities/verification'
import { dataSource } from '@/server/database'

/**
 * 受控证明 OTP（阶段 10 M2.3）。
 *
 * 与登录用 OTP 分离：写入 `verification` 表时使用 `recovery-proof:` 前缀，
 * 仅用于「改邮箱」的恢复证明，不签发任何登录态。
 */

export const PROOF_OTP_PREFIX = 'recovery-proof:'
/** 证明 OTP 有效期：10 分钟，与改绑验证码窗口一致 */
export const PROOF_OTP_EXPIRES_IN_MS = 10 * 60 * 1000
/** 单个 OTP 最多尝试次数 */
export const PROOF_OTP_MAX_ATTEMPTS = 3

type VerificationRepository = Pick<Repository<Verification>, 'findOne' | 'find' | 'save' | 'delete' | 'create'>

interface ProofOtpPayload {
    hash: string
    phoneNumber: string
    attempts: number
}

function toHash(userId: string, code: string): string {
    return createHash('sha256').update(`${userId}:${code}`).digest('hex')
}

/** 常量时间比较哈希，避免按字节提前返回 */
function hashEquals(actual: string, expected: string): boolean {
    const left = Buffer.from(actual, 'hex')
    const right = Buffer.from(expected, 'hex')
    if (left.length !== right.length || left.length === 0) {
        return false
    }
    return timingSafeEqual(left, right)
}

function identifierFor(userId: string): string {
    return `${PROOF_OTP_PREFIX}${userId}`
}

function parsePayload(value: string): ProofOtpPayload | null {
    try {
        const parsed = JSON.parse(value)
        if (typeof parsed?.hash !== 'string' || typeof parsed?.phoneNumber !== 'string') {
            return null
        }
        return { hash: parsed.hash, phoneNumber: parsed.phoneNumber, attempts: Number(parsed.attempts) || 0 }
    } catch {
        return null
    }
}

/** 生成 6 位证明 OTP，返回明文（只用于短信投递） */
export function generateProofOtp(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** 写入一条证明 OTP（覆盖同用户旧记录），只保存哈希 */
export async function issueProofOtp(input: {
    userId: string
    phoneNumber: string
    code: string
    repository?: VerificationRepository
    now?: number
}): Promise<void> {
    const repository = input.repository ?? dataSource.getRepository(Verification)
    const identifier = identifierFor(input.userId)
    const existing = await repository.find({ where: { identifier } })
    for (const row of existing) {
        await repository.delete({ id: row.id })
    }
    const now = input.now ?? Date.now()
    const payload: ProofOtpPayload = {
        hash: toHash(input.userId, input.code),
        phoneNumber: input.phoneNumber,
        attempts: 0,
    }
    await repository.save(repository.create({
        identifier,
        value: JSON.stringify(payload),
        expiresAt: new Date(now + PROOF_OTP_EXPIRES_IN_MS),
    }))
}

export type ProofOtpFailure = 'CODE_NOT_ISSUED' | 'CODE_EXPIRED' | 'CODE_INVALID' | 'TOO_MANY_ATTEMPTS' | 'PROOF_CONSUMED'

/** 只读校验证明 OTP；错误尝试会累加，达到上限即作废 */
export async function checkProofOtp(input: {
    userId: string
    code: string
    repository?: VerificationRepository
    now?: number
}): Promise<{ valid: boolean, reason?: ProofOtpFailure, phoneNumber?: string }> {
    const repository = input.repository ?? dataSource.getRepository(Verification)
    const row = await repository.findOne({ where: { identifier: identifierFor(input.userId) } })
    if (!row) {
        return { valid: false, reason: 'CODE_NOT_ISSUED' }
    }
    const now = input.now ?? Date.now()
    if (new Date(row.expiresAt).getTime() <= now) {
        await repository.delete({ id: row.id })
        return { valid: false, reason: 'CODE_EXPIRED' }
    }
    const payload = parsePayload(row.value)
    if (!payload) {
        await repository.delete({ id: row.id })
        return { valid: false, reason: 'CODE_EXPIRED' }
    }
    if (payload.attempts >= PROOF_OTP_MAX_ATTEMPTS) {
        await repository.delete({ id: row.id })
        return { valid: false, reason: 'TOO_MANY_ATTEMPTS' }
    }
    if (!hashEquals(payload.hash, toHash(input.userId, input.code.trim()))) {
        payload.attempts += 1
        if (payload.attempts >= PROOF_OTP_MAX_ATTEMPTS) {
            await repository.delete({ id: row.id })
            return { valid: false, reason: 'TOO_MANY_ATTEMPTS' }
        }
        row.value = JSON.stringify(payload)
        await repository.save(row)
        return { valid: false, reason: 'CODE_INVALID' }
    }
    return { valid: true, phoneNumber: payload.phoneNumber }
}

/** 消费证明 OTP：删除记录并以受影响行数判定并发双花 */
export async function consumeProofOtp(input: {
    userId: string
    code: string
    repository?: VerificationRepository
    now?: number
}): Promise<{ ok: boolean, reason?: ProofOtpFailure }> {
    const repository = input.repository ?? dataSource.getRepository(Verification)
    const check = await checkProofOtp(input)
    if (!check.valid) {
        return { ok: false, reason: check.reason }
    }
    const row = await repository.findOne({ where: { identifier: identifierFor(input.userId) } })
    if (!row) {
        return { ok: false, reason: 'PROOF_CONSUMED' }
    }
    const result = await repository.delete({ id: row.id })
    const affected = (result as { affected?: number }).affected ?? 0
    if (!affected) {
        return { ok: false, reason: 'PROOF_CONSUMED' }
    }
    return { ok: true }
}

/** 单用户发送节流（进程内，3 次/分；多实例缺口见 backlog） */
const lastSentAt = new Map<string, number>()
/** 20 秒间隔等价于每分钟最多 3 次 */
export const PROOF_OTP_RESEND_INTERVAL_MS = 20 * 1000

/** 是否允许再次发送（同一用户 3 次/分） */
export function canSendProofOtp(userId: string, now = Date.now()): boolean {
    const last = lastSentAt.get(userId)
    return last === undefined || now - last >= PROOF_OTP_RESEND_INTERVAL_MS
}

/** 记录发送时间 */
export function markProofOtpSent(userId: string, now = Date.now()): void {
    lastSentAt.set(userId, now)
}

/** 仅供单测重置节流状态 */
export function resetProofOtpThrottle(): void {
    lastSentAt.clear()
}

/** 证明 OTP 是否已签发未过期（发送端点用于防止无意义重复投递） */
export async function hasPendingProofOtp(
    userId: string,
    repository?: VerificationRepository,
    now = Date.now(),
): Promise<boolean> {
    const repo = repository ?? dataSource.getRepository(Verification)
    const row = await repo.findOne({ where: { identifier: identifierFor(userId) } })
    return Boolean(row && new Date(row.expiresAt).getTime() > now)
}
