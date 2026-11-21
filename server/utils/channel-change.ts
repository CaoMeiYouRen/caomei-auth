import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import type { Repository } from 'typeorm'
import { maskEmail, maskPhone } from './privacy'
import { ChannelChangeRequest, type ChannelChangeSource, type ChannelChangeType } from '@/server/entities/channel-change-request'
import { dataSource } from '@/server/database'
/** 改绑验证码有效期：10 分钟（阶段 9 §5.3），自助请求统一使用该窗口 */
export const CHANNEL_CHANGE_EXPIRES_IN_MS = 10 * 60 * 1000

/** 验证码最多尝试次数 */
export const CHANNEL_CHANGE_MAX_ATTEMPTS = 3

type ChannelChangeRepository = Pick<Repository<ChannelChangeRequest>, 'findOne' | 'find' | 'save' | 'create'>

/** 规范化目标值：邮箱小写去空格，手机号去空格 */
export function normalizeChannelValue(channel: ChannelChangeType, value: string): string {
    const trimmed = value.trim()
    return channel === 'email' ? trimmed.toLowerCase() : trimmed
}

/** 生成 6 位数字验证码 */
export function generateChannelChangeCode(): string {
    return String(randomInt(0, 1_000_000)).padStart(6, '0')
}

/** 验证码哈希：绑定请求 ID，避免不同请求的同一验证码互相命中 */
export function hashChannelChangeCode(requestId: string, code: string): string {
    return createHash('sha256').update(`${requestId}:${code}`).digest('hex')
}

/** 常量时间比较验证码哈希 */
export function verifyChannelChangeCode(requestId: string, code: string, expectedHash: string): boolean {
    const actual = Buffer.from(hashChannelChangeCode(requestId, code), 'hex')
    const expected = Buffer.from(expectedHash, 'hex')
    if (actual.length !== expected.length) {
        return false
    }
    return timingSafeEqual(actual, expected)
}

/** 目标值脱敏展示（确认页与管理员提示共用） */
export function maskChannelValue(channel: ChannelChangeType, value: string): string {
    return channel === 'email' ? maskEmail(value) : maskPhone(value)
}

/**
 * 验证码窗口截止时间：统一按 `createdAt + CHANNEL_CHANGE_EXPIRES_IN_MS`。
 *
 * `expiresAt` 只作为老数据的回落值（阶段 9 请求创建时两者等价），
 * 且不参与冷静期生效判定（阶段 10 M2.1）。
 */
function toTimestamp(value: Date | string | number | null | undefined): number {
    if (value === null || value === undefined) {
        return Number.NaN
    }
    return value instanceof Date ? value.getTime() : new Date(value).getTime()
}

export function getVerificationDeadline(
    request: Partial<Pick<ChannelChangeRequest, 'createdAt' | 'expiresAt'>>,
): Date {
    const created = toTimestamp(request.createdAt)
    if (Number.isFinite(created)) {
        return new Date(created + CHANNEL_CHANGE_EXPIRES_IN_MS)
    }
    const expires = toTimestamp(request.expiresAt)
    return new Date(Number.isFinite(expires) ? expires : 0)
}

/** 验证码窗口是否已关闭（与冷静期无关） */
export function isChannelChangeExpired(
    request: Partial<Pick<ChannelChangeRequest, 'createdAt' | 'expiresAt'>>,
    now = Date.now(),
): boolean {
    return getVerificationDeadline(request).getTime() <= now
}

export interface CreateChannelChangeInput {
    userId: string
    channel: ChannelChangeType
    value: string
    /** 发起方；管理员协助默认 admin，用户自助传 user */
    source?: ChannelChangeSource
    /** 用户自助申请使用的恢复因子类型 */
    proofFactor?: string | null
    requestedBy?: string | null
    reason?: string | null
    repository?: ChannelChangeRepository
    now?: number
}

/**
 * 创建改绑请求。
 *
 * 同一用户同一通道同时只保留一条有效请求：旧的 pending 记录会被标记为 cancelled，
 * 避免用户拿到多个验证码后混用（阶段 9 §5.3）。
 */
export async function createChannelChangeRequest(input: CreateChannelChangeInput): Promise<{
    request: ChannelChangeRequest
    code: string
}> {
    const repository = input.repository ?? dataSource.getRepository(ChannelChangeRequest)
    const normalizedValue = normalizeChannelValue(input.channel, input.value)
    const now = input.now ?? Date.now()

    const pending = await repository.find({
        where: { userId: input.userId, channel: input.channel, status: 'pending' },
    })
    for (const previous of pending) {
        previous.status = 'cancelled'
        previous.cancelledAt = new Date(now)
        await repository.save(previous)
    }

    const request = repository.create({
        id: randomBytes(16).toString('hex'),
        userId: input.userId,
        channel: input.channel,
        newValue: normalizedValue,
        codeHash: '',
        status: 'pending',
        source: input.source ?? 'admin',
        attempts: 0,
        requestedBy: input.requestedBy ?? null,
        reason: input.reason ?? null,
        expiresAt: new Date(now + CHANNEL_CHANGE_EXPIRES_IN_MS),
        scheduledAt: null,
        cancelledAt: null,
        proofFactor: input.proofFactor ?? null,
        confirmedAt: null,
    })
    const code = generateChannelChangeCode()
    request.codeHash = hashChannelChangeCode(request.id, code)
    await repository.save(request)
    return { request, code }
}

export type ChannelChangeVerifyFailure =
    | 'REQUEST_NOT_FOUND'
    | 'REQUEST_CONSUMED'
    | 'CODE_EXPIRED'
    | 'CODE_INVALID'
    | 'TOO_MANY_ATTEMPTS'

export type ChannelChangeVerifyResult =
    | { ok: true, request: ChannelChangeRequest }
    | { ok: false, reason: ChannelChangeVerifyFailure, request?: ChannelChangeRequest }

/**
 * 校验确认页提交的验证码。
 *
 * 过期、已验证、已取消、尝试次数用尽均不可重放；错误次数会累加，达到上限即作废。
 */
export async function verifyChannelChangeRequest(input: {
    id: string
    code: string
    repository?: ChannelChangeRepository
    now?: number
}): Promise<ChannelChangeVerifyResult> {
    const repository = input.repository ?? dataSource.getRepository(ChannelChangeRequest)
    const request = await repository.findOne({ where: { id: input.id } })
    if (!request) {
        return { ok: false, reason: 'REQUEST_NOT_FOUND' }
    }
    if (request.status !== 'pending') {
        return { ok: false, reason: 'REQUEST_CONSUMED', request }
    }
    if (isChannelChangeExpired(request, input.now)) {
        request.status = 'expired'
        await repository.save(request)
        return { ok: false, reason: 'CODE_EXPIRED', request }
    }
    if (request.attempts >= CHANNEL_CHANGE_MAX_ATTEMPTS) {
        request.status = 'expired'
        await repository.save(request)
        return { ok: false, reason: 'TOO_MANY_ATTEMPTS', request }
    }
    if (!verifyChannelChangeCode(request.id, input.code, request.codeHash)) {
        request.attempts += 1
        if (request.attempts >= CHANNEL_CHANGE_MAX_ATTEMPTS) {
            request.status = 'expired'
        }
        await repository.save(request)
        return { ok: false, reason: 'CODE_INVALID', request }
    }
    return { ok: true, request }
}

/** 标记请求已确认（在用户字段更新成功后调用） */
export async function markChannelChangeConfirmed(
    request: ChannelChangeRequest,
    repository?: ChannelChangeRepository,
    now = new Date(),
): Promise<void> {
    const repo = repository ?? dataSource.getRepository(ChannelChangeRequest)
    request.status = 'confirmed'
    request.confirmedAt = now
    await repo.save(request)
}
