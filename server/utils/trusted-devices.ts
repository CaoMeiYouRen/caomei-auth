import type { Repository } from 'typeorm'
import { TrustedDevice } from '@/server/entities/trusted-device'
import { Verification } from '@/server/entities/verification'
import { dataSource } from '@/server/database'
import logger from '@/server/utils/logger'
import { requestAuditMeta, writeAuditEvent } from '@/server/utils/audit-log'

/**
 * 可信设备采集与吊销（阶段 12 M4.1 / D23）。
 *
 * 上游 `trust_device` cookie 是「非公开契约」：格式为签名值 `token!trust-device-xxx.signature`，
 * 这里只解析 identifier 用于与 `verification` 行对齐；解析失败只 warn，不影响 2FA 验证。
 */
export const TRUST_DEVICE_COOKIE_NAME = 'trust_device'
export const TRUST_DEVICE_DEFAULT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60

export type TrustedDeviceRepository = Pick<Repository<TrustedDevice>, 'findOne' | 'create' | 'save' | 'update' | 'find' | 'delete'>
type VerificationRepository = Pick<Repository<Verification>, 'delete'>

/** 从 Set-Cookie 中提取 `trust_device` 的 identifier；找不到或格式不符返回 null */
export function parseTrustedDeviceIdentifier(setCookies: readonly string[]): string | null {
    const cookie = setCookies.find((item) => item.split('=', 1)[0]?.trim().endsWith(TRUST_DEVICE_COOKIE_NAME))
    if (!cookie) {
        return null
    }
    const rawValue = cookie.slice(cookie.indexOf('=') + 1).split(';', 1)[0]?.trim()
    if (!rawValue) {
        return null
    }
    let decoded: string
    try {
        decoded = decodeURIComponent(rawValue)
    } catch {
        return null
    }
    /* 签名 cookie：<token>!<identifier>.<signature> */
    const identifier = decoded.split('!')[1]?.split('.')[0]
    if (!identifier || !identifier.startsWith('trust-device-')) {
        return null
    }
    return identifier
}

/** 从 Set-Cookie 的 Max-Age 推导过期时间；缺失时回落 30 天 */
export function parseTrustedDeviceExpiresAt(setCookies: readonly string[], now: Date = new Date()): Date {
    const cookie = setCookies.find((item) => item.split('=', 1)[0]?.trim().endsWith(TRUST_DEVICE_COOKIE_NAME))
    const maxAge = cookie?.match(/Max-Age=(\d+)/iu)?.[1]
    const seconds = maxAge ? Number(maxAge) : TRUST_DEVICE_DEFAULT_MAX_AGE_SECONDS
    return new Date(now.getTime() + (Number.isFinite(seconds) && seconds > 0 ? seconds : TRUST_DEVICE_DEFAULT_MAX_AGE_SECONDS) * 1000)
}

export interface TrustedDeviceInput {
    userId: string
    identifier: string
    userAgent?: string | null
    ip?: string | null
    expiresAt: Date
    now?: Date
}

/** 同一 identifier 去重：存在则更新 UA / IP / 过期时间与 lastUsedAt */
export async function recordTrustedDevice(
    input: TrustedDeviceInput,
    options: { repository?: TrustedDeviceRepository } = {},
): Promise<TrustedDevice> {
    const repository = options.repository ?? dataSource.getRepository(TrustedDevice)
    const now = input.now ?? new Date()
    const existing = await repository.findOne({ where: { identifier: input.identifier, userId: input.userId } })
    if (existing) {
        const patch = {
            userAgent: input.userAgent?.trim() || null,
            ip: input.ip?.trim() || null,
            expiresAt: input.expiresAt,
            lastUsedAt: now,
        }
        await repository.update(existing.id, patch)
        return Object.assign(existing, patch)
    }
    const device = repository.create({
        userId: input.userId,
        identifier: input.identifier,
        userAgent: input.userAgent?.trim() || null,
        ip: input.ip?.trim() || null,
        expiresAt: input.expiresAt,
        lastUsedAt: now,
    })
    try {
        return await repository.save(device)
    } catch (error) {
        /* 并发双写撞唯一索引：改为更新已存在记录，不丢设备 */
        const concurrent = await repository.findOne({ where: { identifier: input.identifier, userId: input.userId } })
        if (!concurrent) {
            throw error
        }
        const patch = {
            userAgent: input.userAgent?.trim() || null,
            ip: input.ip?.trim() || null,
            expiresAt: input.expiresAt,
            lastUsedAt: now,
        }
        await repository.update(concurrent.id, patch)
        return Object.assign(concurrent, patch)
    }
}

/** 用户可信设备列表（按创建时间倒序，含已过期项供 UI 标注） */
export async function listTrustedDevices(
    userId: string,
    options: { repository?: Pick<TrustedDeviceRepository, 'find'> } = {},
): Promise<TrustedDevice[]> {
    const repository = options.repository ?? dataSource.getRepository(TrustedDevice)
    return repository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
    })
}

/** 吊销：删除 verification 行 + 实体；返回是否命中 */
export async function revokeTrustedDevice(input: {
    userId: string
    id: string
    deviceRepository?: TrustedDeviceRepository
    verificationRepository?: VerificationRepository
}): Promise<boolean> {
    const revokeWith = async (
        deviceRepository: TrustedDeviceRepository,
        verificationRepository: VerificationRepository,
    ): Promise<boolean> => {
        const device = await deviceRepository.findOne({ where: { id: input.id, userId: input.userId } })
        if (!device) {
            return false
        }
        await verificationRepository.delete({ identifier: device.identifier })
        await deviceRepository.delete({ id: device.id, userId: input.userId })
        writeAuditEvent({
            action: 'trustedDevice.revoke',
            actorId: input.userId,
            targetUserId: input.userId,
            after: { identifier: device.identifier },
        })
        return true
    }

    /* 默认路径用事务保证 verification 行与实体一致；测试注入仓储时按顺序执行 */
    if (!input.deviceRepository && !input.verificationRepository) {
        return dataSource.transaction((manager) => revokeWith(
            manager.getRepository(TrustedDevice) as TrustedDeviceRepository,
            manager.getRepository(Verification) as VerificationRepository,
        ))
    }
    return revokeWith(
        input.deviceRepository ?? dataSource.getRepository(TrustedDevice),
        input.verificationRepository ?? dataSource.getRepository(Verification),
    )
}

/** 2FA 验证成功后从响应头采集；解析失败只 warn，不阻断验证 */
export async function captureTrustedDevice(input: {
    userId: string
    setCookies: readonly string[]
    request?: { headers?: Headers | { get?: (name: string) => string | null } } | null
    now?: Date
    repository?: TrustedDeviceRepository
}): Promise<TrustedDevice | null> {
    const identifier = parseTrustedDeviceIdentifier(input.setCookies)
    if (!identifier) {
        logger.warn('trusted device: trust_device cookie is missing or malformed', { userId: input.userId })
        return null
    }
    const meta = requestAuditMeta(input.request)
    const now = input.now ?? new Date()
    const device = await recordTrustedDevice({
        userId: input.userId,
        identifier,
        userAgent: meta.userAgent,
        ip: meta.ip,
        expiresAt: parseTrustedDeviceExpiresAt(input.setCookies, now),
        now,
    }, { repository: input.repository })
    writeAuditEvent({
        action: 'trustedDevice.create',
        actorId: input.userId,
        targetUserId: input.userId,
        after: { identifier },
        ...meta,
    })
    return device
}
