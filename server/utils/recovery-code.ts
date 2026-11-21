import { createHash, randomInt } from 'node:crypto'
import { IsNull, type Repository } from 'typeorm'
import { RecoveryCode } from '@/server/entities/recovery-code'
import { dataSource } from '@/server/database'

/**
 * 账号恢复码（阶段 10 M1）。
 *
 * 与 2FA 备份码分离（D2）：恢复码只用于「通道全失」时的自助恢复证明，
 * 不参与登录时的第二因子校验。签发、消费、重签与删除都只操作本表。
 */

/** 一次签发的恢复码数量 */
export const RECOVERY_CODE_COUNT = 10

/** 恢复码字符集：去掉易混的 I / O / 0 / 1 */
const RECOVERY_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ234567'

/** 恢复码长度（16 × 5 bit = 80 bit 熵，满足 ≥64 bit） */
const RECOVERY_CODE_LENGTH = 16

/** 会话新鲜度窗口：15 分钟内登录（D10 / M1.1） */
export const FRESH_SESSION_MAX_AGE_MS = 15 * 60 * 1000

type RecoveryCodeRepository = Pick<Repository<RecoveryCode>, 'find' | 'findOne' | 'save' | 'delete' | 'count' | 'create' | 'update'>

export type RecoveryCodeFailure = 'NOT_FOUND' | 'PROOF_CONSUMED'

/** 生成一条恢复码明文，格式 `ABCD-EFGH-JKLM-NPQR` */
export function generateRecoveryCode(): string {
    let raw = ''
    for (let index = 0; index < RECOVERY_CODE_LENGTH; index += 1) {
        raw += RECOVERY_CODE_ALPHABET[randomInt(0, RECOVERY_CODE_ALPHABET.length)]
    }
    return raw.match(/.{1,4}/gu)!.join('-')
}

/** 规范化用户输入：去空格与分隔符并统一大写 */
export function normalizeRecoveryCode(code: string): string {
    return code.replace(/[^A-Za-z0-9]/gu, '').toUpperCase()
}

/** 恢复码哈希（sha256，规范化后） */
export function hashRecoveryCode(code: string): string {
    return createHash('sha256').update(normalizeRecoveryCode(code)).digest('hex')
}

/**
 * 判断会话是否新鲜（15 分钟内登录）。
 *
 * 只读 `session.createdAt`，不使用客户端传参，也不依赖 better-auth 的 `freshAge`
 * （项目配置为 1 天，口径与恢复能力不匹配）。
 */
export function isFreshSession(
    sessionCreatedAt: Date | string | number | null | undefined,
    options: { now?: number, maxAgeMs?: number } = {},
): boolean {
    if (sessionCreatedAt === null || sessionCreatedAt === undefined) {
        return false
    }
    const created = sessionCreatedAt instanceof Date
        ? sessionCreatedAt.getTime()
        : new Date(sessionCreatedAt).getTime()
    if (!Number.isFinite(created)) {
        return false
    }
    const now = options.now ?? Date.now()
    const maxAge = options.maxAgeMs ?? FRESH_SESSION_MAX_AGE_MS
    const age = now - created
    return age >= 0 && age <= maxAge
}

/** 重签：失效该用户全部旧码并签发新码，返回仅在本次响应中出现的明文 */
export async function generateRecoveryCodes(input: {
    userId: string
    count?: number
    repository?: RecoveryCodeRepository
}): Promise<string[]> {
    /* 重签必须在单事务内「删除旧码 + 写入新码」，避免中途失败把用户恢复到零码状态 */
    if (input.repository) {
        return writeRecoveryCodes(input.repository, input.userId, input.count)
    }
    return dataSource.transaction(async (manager) => (
        writeRecoveryCodes(manager.getRepository(RecoveryCode), input.userId, input.count)
    ))
}

async function writeRecoveryCodes(
    repository: RecoveryCodeRepository,
    userId: string,
    count = RECOVERY_CODE_COUNT,
): Promise<string[]> {
    const existing = await repository.find({ where: { userId } })
    if (existing.length) {
        await repository.delete({ userId })
    }
    const codes = Array.from({ length: count }, () => generateRecoveryCode())
    const rows = codes.map((code) => repository.create({
        userId,
        codeHash: hashRecoveryCode(code),
        usedAt: null,
    }))
    await repository.save(rows)
    return codes
}

/** 剩余可用恢复码数量 */
export async function countRemainingRecoveryCodes(
    userId: string,
    repository?: RecoveryCodeRepository,
): Promise<number> {
    const repo = repository ?? dataSource.getRepository(RecoveryCode)
    return repo.count({ where: { userId, usedAt: IsNull() } })
}

/**
 * 消费恢复码：`used_at IS NULL` 条件更新，并发双花只有一个成功。
 *
 * 找不到与已使用对外统一为 `PROOF_CONSUMED`，避免暴露「该码是否存在」。
 */
export async function consumeRecoveryCode(input: {
    userId: string
    code: string
    repository?: RecoveryCodeRepository
    now?: number
}): Promise<{ ok: true } | { ok: false, reason: RecoveryCodeFailure }> {
    const repository = input.repository ?? dataSource.getRepository(RecoveryCode)
    const codeHash = hashRecoveryCode(input.code)
    const record = await repository.findOne({ where: { userId: input.userId, codeHash } })
    if (!record) {
        return { ok: false, reason: 'NOT_FOUND' }
    }
    if (record.usedAt) {
        return { ok: false, reason: 'PROOF_CONSUMED' }
    }
    const result = await repository.update(
        { id: record.id, usedAt: IsNull() },
        { usedAt: new Date(input.now ?? Date.now()) },
    )
    const affected = (result as { affected?: number }).affected ?? 0
    if (!affected) {
        return { ok: false, reason: 'PROOF_CONSUMED' }
    }
    return { ok: true }
}

/** 只读校验恢复码，不消费（供 M2.2 校验阶段使用） */
export async function checkRecoveryCode(input: {
    userId: string
    code: string
    repository?: RecoveryCodeRepository
}): Promise<{ valid: boolean, reason?: RecoveryCodeFailure }> {
    const repository = input.repository ?? dataSource.getRepository(RecoveryCode)
    const record = await repository.findOne({
        where: { userId: input.userId, codeHash: hashRecoveryCode(input.code) },
    })
    if (!record) {
        return { valid: false, reason: 'NOT_FOUND' }
    }
    if (record.usedAt) {
        return { valid: false, reason: 'PROOF_CONSUMED' }
    }
    return { valid: true }
}

/** 删除单条恢复码（只能删自己的） */
export async function deleteRecoveryCode(input: {
    userId: string
    id: string
    repository?: RecoveryCodeRepository
}): Promise<boolean> {
    const repository = input.repository ?? dataSource.getRepository(RecoveryCode)
    const record = await repository.findOne({ where: { id: input.id, userId: input.userId } })
    if (!record) {
        return false
    }
    await repository.delete({ id: record.id, userId: input.userId })
    return true
}

/** 列表（不含明文，只返回可用于展示与删除的元信息） */
export async function listRecoveryCodes(
    userId: string,
    repository?: RecoveryCodeRepository,
): Promise<Array<{ id: string, createdAt: Date, usedAt: Date | null }>> {
    const repo = repository ?? dataSource.getRepository(RecoveryCode)
    const rows = await repo.find({ where: { userId } })
    return rows
        .map((row) => ({ id: row.id, createdAt: row.createdAt, usedAt: row.usedAt }))
        .sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime())
}
