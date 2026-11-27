import { isIP } from 'node:net'

/**
 * 请求来源 IP 归一化（阶段 17 D62）。
 *
 * 背景：`login_event.ip` 与审计日志的 `ip` 是 `varchar(45)`（IPv6 文本上限）。
 * 写入侧原样取 `x-forwarded-for` 首段 / `x-real-ip`，会带出端口、方括号、IPv6 zone index
 * 或客户端自造的超长值：MySQL 严格模式与 PostgreSQL 会整行拒绝（事件静默丢失），
 * SQLite 则照存，形成三方言行为分叉。
 *
 * 口径：
 * - 取 `x-forwarded-for` 首段，去空白；
 * - `[IPv6]` / `[IPv6]:port` 去方括号与端口；`IPv4:port` 去端口；
 * - 去 IPv6 zone index（`%eth0`）；
 * - `net.isIP()` 校验，非法或长度 > 45 一律回落 `null`（不截断：截断会伪造出别的合法 IP）。
 */
export const MAX_IP_TEXT_LENGTH = 45

/** 从可能带端口的 IPv4 文本里剥掉端口（`203.0.113.10:8080`） */
function stripIpv4Port(value: string): string {
    const match = /^(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$/u.exec(value)
    return match ? match[1]! : value
}

/**
 * 归一化单个 IP 文本；无法归一化时返回 `null`。
 *
 * 纯函数、无 IO，便于在审计 / 登录事件 / 仓储层共用同一口径。
 */
export function normalizeClientIp(raw: string | null | undefined): string | null {
    if (typeof raw !== 'string') {
        return null
    }

    const first = raw.split(',')[0]?.trim()
    if (!first) {
        return null
    }

    let candidate = first
    if (candidate.startsWith('[')) {
        const closing = candidate.indexOf(']')
        if (closing === -1) {
            return null
        }
        candidate = candidate.slice(1, closing)
    } else {
        candidate = stripIpv4Port(candidate)
    }

    const zoneIndex = candidate.indexOf('%')
    if (zoneIndex !== -1) {
        candidate = candidate.slice(0, zoneIndex)
    }

    if (!candidate || candidate.length > MAX_IP_TEXT_LENGTH) {
        return null
    }
    if (isIP(candidate) === 0) {
        return null
    }
    return candidate
}

/**
 * 从 `x-forwarded-for` / `x-real-ip` 取值并归一化。
 *
 * `x-forwarded-for` 优先（与既有审计口径一致）：多级代理下首段是原始客户端地址。
 */
export function resolveClientIp(forwardedFor?: string | null, realIp?: string | null): string | null {
    return normalizeClientIp(forwardedFor) ?? normalizeClientIp(realIp)
}
