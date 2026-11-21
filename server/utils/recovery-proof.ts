import type { EntityManager } from 'typeorm'
import {
    checkBackupCodeFactor,
    checkTotpFactor,
    consumeBackupCodeFactor,
    consumeTotpFactor,
    type ProofFactor,
} from './proof-factors'
import { checkRecoveryCode, consumeRecoveryCode, isFreshSession } from './recovery-code'
import { checkProofOtp, consumeProofOtp } from './proof-otp'
import { auth } from '@/lib/auth'
import { RecoveryCode } from '@/server/entities/recovery-code'
import { TwoFactor } from '@/server/entities/two-factor'
import { Verification } from '@/server/entities/verification'

/**
 * 自助恢复证明校验与消费（阶段 10 M2.2）。
 *
 * 判定顺序固定为「密码 → 因子 → 状态」，调用方不能放宽因子集合：
 * - `PURPOSE_FACTORS` 是每个用途的允许因子全集；
 * - 调用方只能通过 `allowedFactors` 继续收窄（与服务层取交集）；
 * - 失败计数按 `userId + factor` 独立统计（15 分钟 5 次锁定，进程内缓存），
 *   写在事务外，业务回滚不会清零（避免「回滚即重置尝试次数」被利用）。
 *
 * 社交绑定（account 表）不在因子集合内（D6），只作为登录通道。
 */

export type RecoveryProofPurpose = 'change-email' | 'self-service-password'

export const PURPOSE_FACTORS: Record<RecoveryProofPurpose, ProofFactor[]> = {
    'change-email': ['recovery-code', 'phone-otp', 'totp', 'backup-code'],
    /* D3 延伸：手机 OTP 不得用于设置 / 重置密码，避免 SIM swap 直接提升为账号接管 */
    'self-service-password': ['recovery-code', 'totp', 'backup-code'],
}

export const PROOF_MAX_FAILURES = 5
export const PROOF_FAILURE_WINDOW_MS = 15 * 60 * 1000

export type RecoveryProofFailure =
    | 'PASSWORD_REQUIRED'
    | 'PASSWORD_INVALID'
    | 'PROOF_REQUIRED'
    | 'FACTOR_NOT_ALLOWED'
    | 'FACTOR_UNAVAILABLE'
    | 'PROOF_INVALID'
    | 'PROOF_CONSUMED'
    | 'TOO_MANY_ATTEMPTS'
    | 'SESSION_NOT_FRESH'

export type RecoveryProofResult =
    | { ok: true, factor: ProofFactor, timeStep?: number }
    | { ok: false, reason: RecoveryProofFailure }

interface FailureRecord {
    count: number
    firstAt: number
    lockedUntil: number | null
}

const failureStore = new Map<string, FailureRecord>()

/** 仅供单测重置进程内计数 */
export function resetProofFailures(): void {
    failureStore.clear()
}

function failureKey(userId: string, factor: ProofFactor): string {
    return `${userId}:${factor}`
}

/** 当前锁定状态（超过窗口的计数自动视为过期） */
export function getProofFailureState(
    userId: string,
    factor: ProofFactor,
    now = Date.now(),
): { count: number, locked: boolean } {
    const record = failureStore.get(failureKey(userId, factor))
    if (!record) {
        return { count: 0, locked: false }
    }
    if (record.lockedUntil !== null) {
        if (record.lockedUntil > now) {
            return { count: record.count, locked: true }
        }
        failureStore.delete(failureKey(userId, factor))
        return { count: 0, locked: false }
    }
    if (now - record.firstAt > PROOF_FAILURE_WINDOW_MS) {
        failureStore.delete(failureKey(userId, factor))
        return { count: 0, locked: false }
    }
    return { count: record.count, locked: false }
}

/** 记录一次因子校验失败；达到阈值后锁定 15 分钟 */
export function recordProofFailure(userId: string, factor: ProofFactor, now = Date.now()): void {
    const state = getProofFailureState(userId, factor, now)
    const count = state.count + 1
    const record: FailureRecord = {
        count,
        firstAt: failureStore.get(failureKey(userId, factor))?.firstAt ?? now,
        lockedUntil: count >= PROOF_MAX_FAILURES ? now + PROOF_FAILURE_WINDOW_MS : null,
    }
    failureStore.set(failureKey(userId, factor), record)
}

/** 校验成功后清零该因子的失败计数 */
export function clearProofFailures(userId: string, factor: ProofFactor): void {
    failureStore.delete(failureKey(userId, factor))
}

async function verifyPassword(userId: string, password: string): Promise<boolean> {
    const context = await auth.$context
    const account = await context.internalAdapter.findCredentialAccount(userId)
    if (!account?.password) {
        return false
    }
    return context.password.verify({ hash: account.password, password })
}

function normalizeFactor(factor: string | null | undefined): ProofFactor | null {
    if (!factor) {
        return null
    }
    return (['recovery-code', 'phone-otp', 'totp', 'backup-code'] as const).includes(factor as ProofFactor)
        ? factor as ProofFactor
        : null
}

function mapFactorFailure(reason: string | undefined): RecoveryProofFailure {
    switch (reason) {
        case 'PROOF_CONSUMED':
            return 'PROOF_CONSUMED'
        case 'TOO_MANY_ATTEMPTS':
            return 'TOO_MANY_ATTEMPTS'
        case 'FACTOR_UNAVAILABLE':
            return 'FACTOR_UNAVAILABLE'
        case 'CODE_EXPIRED':
            return 'PROOF_INVALID'
        default:
            return 'PROOF_INVALID'
    }
}

export interface VerifyRecoveryProofInput {
    userId: string
    purpose: RecoveryProofPurpose
    /** 改邮箱必填；自助设密码可空（OAuth-only 用户无密码） */
    password?: string | null
    factor?: string | null
    code?: string | null
    /** 当前会话创建时间（自助设密码要求 15 分钟内登录） */
    sessionCreatedAt?: Date | string | null
    /** 调用方进一步收窄的因子集合；只能小于等于 PURPOSE_FACTORS */
    allowedFactors?: ProofFactor[]
    now?: number
}

/**
 * 校验恢复证明（只读，不消费）。
 *
 * 成功后由调用方在业务事务内调用 `consumeProofFactor`，保证「业务失败不消耗因子」。
 */
export async function verifyRecoveryProof(input: VerifyRecoveryProofInput): Promise<RecoveryProofResult> {
    const now = input.now ?? Date.now()
    const purposeFactors = PURPOSE_FACTORS[input.purpose]
    const allowed = input.allowedFactors
        ? purposeFactors.filter((factor) => input.allowedFactors!.includes(factor))
        : purposeFactors

    /* 1. 密码 */
    if (input.purpose === 'change-email') {
        if (!input.password) {
            return { ok: false, reason: 'PASSWORD_REQUIRED' }
        }
        const validPassword = await verifyPassword(input.userId, input.password)
        if (!validPassword) {
            return { ok: false, reason: 'PASSWORD_INVALID' }
        }
    }

    /* 2. 状态：自助设密码要求新鲜会话（15 分钟内登录） */
    if (input.purpose === 'self-service-password' && !isFreshSession(input.sessionCreatedAt, { now })) {
        return { ok: false, reason: 'SESSION_NOT_FRESH' }
    }

    /* 3. 因子 */
    if (!input.factor || !input.code) {
        return { ok: false, reason: 'PROOF_REQUIRED' }
    }
    const factor = normalizeFactor(input.factor)
    if (!factor || !purposeFactors.includes(factor) || !allowed.includes(factor)) {
        return { ok: false, reason: 'FACTOR_NOT_ALLOWED' }
    }
    if (getProofFailureState(input.userId, factor, now).locked) {
        return { ok: false, reason: 'TOO_MANY_ATTEMPTS' }
    }

    const code = input.code.trim()
    let failureReason: RecoveryProofFailure | null = null
    let timeStep: number | undefined

    switch (factor) {
        case 'recovery-code': {
            const result = await checkRecoveryCode({ userId: input.userId, code })
            if (!result.valid) {
                failureReason = mapFactorFailure(result.reason)
            }
            break
        }
        case 'phone-otp': {
            const result = await checkProofOtp({ userId: input.userId, code, now })
            if (!result.valid) {
                failureReason = mapFactorFailure(result.reason)
            }
            break
        }
        case 'totp': {
            const result = await checkTotpFactor(input.userId, code, { now })
            if (!result.valid) {
                failureReason = mapFactorFailure(result.reason)
            } else {
                timeStep = result.timeStep
            }
            break
        }
        case 'backup-code': {
            const result = await checkBackupCodeFactor(input.userId, code)
            if (!result.valid) {
                failureReason = mapFactorFailure(result.reason)
            }
            break
        }
    }

    if (failureReason) {
        /* 已消费 / 已锁定不再累加，避免用重放把自己锁死 */
        if (failureReason !== 'PROOF_CONSUMED' && failureReason !== 'TOO_MANY_ATTEMPTS') {
            recordProofFailure(input.userId, factor, now)
        }
        return { ok: false, reason: failureReason }
    }

    clearProofFailures(input.userId, factor)
    return { ok: true, factor, timeStep }
}

/**
 * 在业务事务内消费已校验的因子；保证同一因子只能成功消费一次。
 *
 * 传入 `manager` 时所有写入都走该事务，业务失败可整体回滚（失败计数仍在事务外）。
 */
export async function consumeProofFactor(input: {
    userId: string
    factor: ProofFactor
    code: string
    timeStep?: number
    now?: number
    manager?: EntityManager
}): Promise<{ ok: boolean, reason?: RecoveryProofFailure }> {
    const code = input.code.trim()
    const manager = input.manager
    switch (input.factor) {
        case 'recovery-code': {
            const result = await consumeRecoveryCode({
                userId: input.userId,
                code,
                now: input.now,
                repository: manager ? manager.getRepository(RecoveryCode) : undefined,
            })
            return result.ok ? { ok: true } : { ok: false, reason: mapFactorFailure(result.reason) }
        }
        case 'phone-otp': {
            const result = await consumeProofOtp({
                userId: input.userId,
                code,
                now: input.now,
                repository: manager ? manager.getRepository(Verification) : undefined,
            })
            return result.ok ? { ok: true } : { ok: false, reason: mapFactorFailure(result.reason) }
        }
        case 'totp': {
            const repository = manager ? manager.getRepository(TwoFactor) : undefined
            let timeStep = input.timeStep
            if (timeStep === undefined) {
                const check = await checkTotpFactor(input.userId, code, { now: input.now, repository })
                if (!check.valid || check.timeStep === undefined) {
                    return { ok: false, reason: mapFactorFailure(check.reason) }
                }
                timeStep = check.timeStep
            }
            const consumed = await consumeTotpFactor(input.userId, timeStep, { repository })
            return consumed ? { ok: true } : { ok: false, reason: 'PROOF_CONSUMED' }
        }
        case 'backup-code': {
            const result = await consumeBackupCodeFactor(input.userId, code, {
                repository: manager ? manager.getRepository(TwoFactor) : undefined,
            })
            return result.ok ? { ok: true } : { ok: false, reason: mapFactorFailure(result.reason) }
        }
    }
}
