import { createHmac, timingSafeEqual } from 'node:crypto'
import { IsNull, type Repository } from 'typeorm'
import { symmetricDecrypt, symmetricEncrypt } from 'better-auth/crypto'
import { TwoFactor } from '@/server/entities/two-factor'
import { dataSource } from '@/server/database'
import { auth } from '@/lib/auth'

/**
 * 恢复证明因子的底层校验原语（阶段 10 M2.2 交付，M1.1 先用于恢复码重签）。
 *
 * 约束（设计草案 §5.2 / 安全规范 §1.3）：
 * - 只读校验与消费分离：`check*` 不落副作用，`consume*` 才推进锚点；
 * - TOTP / 备份码必须按 better-auth `secretConfig` 解密后再比对，不直接比较库内密文；
 * - 备份码默认以 JSON 明文存储（项目未开启 `storeBackupCodes: 'encrypted'`），
 *   解密失败时按明文 JSON 处理，兼容历史数据。
 */

export const PROOF_FACTORS = ['recovery-code', 'phone-otp', 'totp', 'backup-code'] as const

export type ProofFactor = typeof PROOF_FACTORS[number]

export type ProofFactorFailure =
    | 'FACTOR_UNAVAILABLE'
    | 'CODE_INVALID'
    | 'CODE_EXPIRED'
    | 'TOO_MANY_ATTEMPTS'
    | 'PROOF_CONSUMED'

export const TOTP_PERIOD_SECONDS = 30
export const TOTP_DIGITS = 6
const TOTP_WINDOW = 1
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
const BASE32_PREFIX = 'base32:'

type SecretKey = Parameters<typeof symmetricDecrypt>[0]['key']

type TwoFactorRepository = Pick<Repository<TwoFactor>, 'findOne' | 'save' | 'update'>

/** 读取 better-auth 的对称加密密钥（TOTP secret 使用该密钥加密落库） */
export async function resolveSecretConfig(): Promise<SecretKey> {
    const context = await auth.$context
    return context.secretConfig as unknown as SecretKey
}

/** RFC 4648 base32 解码（better-auth 对导入型 secret 使用 `base32:` 前缀） */
export function decodeBase32(input: string): Buffer {
    const normalized = input.replace(/[=]+$/u, '').toUpperCase()
    let bits = 0
    let value = 0
    const bytes: number[] = []
    for (const char of normalized) {
        const index = BASE32_ALPHABET.indexOf(char)
        if (index === -1) {
            throw new Error(`Invalid base32 character: ${char}`)
        }
        value = (value << 5) | index
        bits += 5
        if (bits >= 8) {
            bytes.push((value >>> (bits - 8)) & 0xff)
            bits -= 8
        }
    }
    return Buffer.from(bytes)
}

/** 生成指定时间步的 TOTP（HMAC-SHA1 + 动态截断） */
export function generateTotpCode(secret: string | Buffer, timeStep: number, digits = TOTP_DIGITS): string {
    const buffer = Buffer.alloc(8)
    buffer.writeBigUInt64BE(BigInt(timeStep))
    const hmac = createHmac('sha1', secret).update(buffer).digest()
    const offset = (hmac[hmac.length - 1] ?? 0) & 0x0f
    const binary = (((hmac[offset] ?? 0) & 0x7f) << 24)
        | (((hmac[offset + 1] ?? 0) & 0xff) << 16)
        | (((hmac[offset + 2] ?? 0) & 0xff) << 8)
        | ((hmac[offset + 3] ?? 0) & 0xff)
    return String(binary % 10 ** digits).padStart(digits, '0')
}

/**
 * 校验 TOTP，返回命中的时间步（用于 `lastUsedTimeStep` 防重放）。
 * 允许前后各一个窗口，与 better-auth 默认 `window=1` 保持一致。
 */
export function verifyTotpCode(
    secret: string | Buffer,
    code: string,
    options: { now?: number, digits?: number, period?: number, window?: number } = {},
): { valid: boolean, timeStep: number | null } {
    const trimmed = code.replace(/\s+/gu, '')
    if (!/^\d{6}$/u.test(trimmed)) {
        return { valid: false, timeStep: null }
    }
    const digits = options.digits ?? TOTP_DIGITS
    const period = options.period ?? TOTP_PERIOD_SECONDS
    const window = options.window ?? TOTP_WINDOW
    const currentStep = Math.floor((options.now ?? Date.now()) / 1000 / period)
    const actual = Buffer.from(trimmed)
    let matched: number | null = null
    for (let offset = -window; offset <= window; offset += 1) {
        const timeStep = currentStep + offset
        const expected = Buffer.from(generateTotpCode(secret, timeStep, digits))
        if (actual.length === expected.length && timingSafeEqual(actual, expected) && matched === null) {
            matched = timeStep
        }
    }
    return { valid: matched !== null, timeStep: matched }
}

/** TOTP secret 解密（支持 `base32:` 导入格式与普通 UTF-8 secret） */
export async function decryptTotpSecret(ciphertext: string, secretConfig?: SecretKey): Promise<string | Buffer> {
    const key = secretConfig ?? await resolveSecretConfig()
    const decrypted = await symmetricDecrypt({ key, data: ciphertext })
    if (decrypted.startsWith(BASE32_PREFIX)) {
        return decodeBase32(decrypted.slice(BASE32_PREFIX.length).toUpperCase())
    }
    return decrypted
}

/** 读取备份码数组：优先按 better-auth 加密格式解密，失败时回退明文 JSON */
export async function readBackupCodes(
    stored: string | null | undefined,
    secretConfig?: SecretKey,
): Promise<string[]> {
    if (!stored) {
        return []
    }
    try {
        const key = secretConfig ?? await resolveSecretConfig()
        const decrypted = await symmetricDecrypt({ key, data: stored })
        const parsed = JSON.parse(decrypted)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        try {
            const parsed = JSON.parse(stored)
            return Array.isArray(parsed) ? parsed : []
        } catch {
            return []
        }
    }
}

/**
 * 按原存储格式写回备份码。
 *
 * 项目未开启 `storeBackupCodes: 'encrypted'`，默认是明文 JSON；若部署侧改为加密存储，
 * 这里必须继续写密文，否则 better-auth 的解密校验会失败、其余备份码全部不可用。
 */
export async function writeBackupCodes(
    codes: string[],
    stored: string,
    secretConfig?: SecretKey,
): Promise<string> {
    const json = JSON.stringify(codes)
    try {
        const key = secretConfig ?? await resolveSecretConfig()
        await symmetricDecrypt({ key, data: stored })
        /* 解密成功说明原值为密文：继续写密文 */
        return await symmetricEncrypt({ key, data: json })
    } catch {
        return json
    }
}

/** 备份码比较：去空格并统一大写，兼容 better-auth 的 `XXXXX-XXXXX` 形态 */
export function normalizeBackupCode(code: string): string {
    return code.replace(/\s+/gu, '').toUpperCase()
}

function normalizeTwoFactorRow(row: any): TwoFactor | null {
    if (!row) {
        return null
    }
    return row as TwoFactor
}

async function loadTwoFactor(userId: string, repository?: TwoFactorRepository): Promise<TwoFactor | null> {
    const repo = repository ?? dataSource.getRepository(TwoFactor)
    return normalizeTwoFactorRow(await repo.findOne({ where: { userId } }))
}

/** 只读校验 TOTP，不推进 `lastUsedTimeStep` */
export async function checkTotpFactor(
    userId: string,
    code: string,
    options: { repository?: TwoFactorRepository, secretConfig?: SecretKey, now?: number } = {},
): Promise<{ valid: boolean, reason?: ProofFactorFailure, timeStep?: number }> {
    const twoFactor = await loadTwoFactor(userId, options.repository)
    if (!twoFactor?.secret) {
        return { valid: false, reason: 'FACTOR_UNAVAILABLE' }
    }
    if (twoFactor.lockedUntil && new Date(twoFactor.lockedUntil).getTime() > (options.now ?? Date.now())) {
        return { valid: false, reason: 'TOO_MANY_ATTEMPTS' }
    }
    let secret: string | Buffer
    try {
        secret = await decryptTotpSecret(twoFactor.secret, options.secretConfig)
    } catch {
        return { valid: false, reason: 'FACTOR_UNAVAILABLE' }
    }
    const result = verifyTotpCode(secret, code, { now: options.now })
    if (!result.valid || result.timeStep === null) {
        return { valid: false, reason: 'CODE_INVALID' }
    }
    if (twoFactor.lastUsedTimeStep !== null && twoFactor.lastUsedTimeStep !== undefined
        && result.timeStep <= Number(twoFactor.lastUsedTimeStep)) {
        return { valid: false, reason: 'PROOF_CONSUMED' }
    }
    return { valid: true, timeStep: result.timeStep }
}

/**
 * 消费 TOTP：CAS 更新 `last_used_time_step`，并发下只有一个请求能把该时间步推进。
 */
export async function consumeTotpFactor(
    userId: string,
    timeStep: number,
    options: { repository?: TwoFactorRepository } = {},
): Promise<boolean> {
    const repo = options.repository ?? dataSource.getRepository(TwoFactor)
    const result = await repo.update(
        { userId, lastUsedTimeStep: IsNull() },
        { lastUsedTimeStep: timeStep },
    )
    let affected = (result as { affected?: number }).affected ?? 0
    if (!affected) {
        /* 已有历史时间步：只允许严格递增，避免重放窗口内的同一时间步 */
        const twoFactor = await loadTwoFactor(userId, repo)
        if (!twoFactor || (twoFactor.lastUsedTimeStep !== null && twoFactor.lastUsedTimeStep !== undefined
            && Number(twoFactor.lastUsedTimeStep) >= timeStep)) {
            return false
        }
        const updateResult = await repo.update(
            { userId, lastUsedTimeStep: twoFactor.lastUsedTimeStep } as any,
            { lastUsedTimeStep: timeStep },
        )
        affected = (updateResult as { affected?: number }).affected ?? 0
    }
    return affected > 0
}

/** 只读校验备份码，返回命中时的完整码表（供消费时做 CAS） */
export async function checkBackupCodeFactor(
    userId: string,
    code: string,
    options: { repository?: TwoFactorRepository, secretConfig?: SecretKey } = {},
): Promise<{ valid: boolean, reason?: ProofFactorFailure, codes?: string[] }> {
    const twoFactor = await loadTwoFactor(userId, options.repository)
    if (!twoFactor?.backupCodes) {
        return { valid: false, reason: 'FACTOR_UNAVAILABLE' }
    }
    const codes = await readBackupCodes(twoFactor.backupCodes, options.secretConfig)
    const normalized = normalizeBackupCode(code)
    if (!codes.length) {
        return { valid: false, reason: 'FACTOR_UNAVAILABLE' }
    }
    if (!codes.includes(normalized)) {
        return { valid: false, reason: 'CODE_INVALID' }
    }
    return { valid: true, codes }
}

/** 消费备份码：`WHERE backup_codes = :old` CAS，成功后该码从码表移除 */
export async function consumeBackupCodeFactor(
    userId: string,
    code: string,
    options: { repository?: TwoFactorRepository, secretConfig?: SecretKey } = {},
): Promise<{ ok: boolean, reason?: ProofFactorFailure }> {
    const check = await checkBackupCodeFactor(userId, code, options)
    if (!check.valid || !check.codes) {
        return { ok: false, reason: check.reason ?? 'CODE_INVALID' }
    }
    const repo = options.repository ?? dataSource.getRepository(TwoFactor)
    const twoFactor = await loadTwoFactor(userId, repo)
    if (!twoFactor?.backupCodes) {
        return { ok: false, reason: 'FACTOR_UNAVAILABLE' }
    }
    const normalized = normalizeBackupCode(code)
    const remaining = check.codes.filter((item) => item !== normalized)
    const nextValue = await writeBackupCodes(remaining, twoFactor.backupCodes, options.secretConfig)
    const result = await repo.update(
        { userId, backupCodes: twoFactor.backupCodes },
        { backupCodes: nextValue },
    )
    const affected = (result as { affected?: number }).affected ?? 0
    if (!affected) {
        return { ok: false, reason: 'PROOF_CONSUMED' }
    }
    return { ok: true }
}
