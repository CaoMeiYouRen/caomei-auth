import type { LoginEventInput } from './repository'
import { createSeededRandom } from '@/server/utils/demo-data-generator'
import type { LoginEventChannel, LoginEventResult, LoginEventType } from '@/utils/shared/login-events'

/**
 * Demo 模式登录事件生成（阶段 12 M1.2）。
 *
 * 使用固定种子与固定窗口，保证同一 seed / 时间锚点下事件集合稳定：
 * 管理端事件视图与热力图需要有可复现的分布，而不是每次启动都随机。
 */
const DEMO_EVENT_SEED = 20261122
const DEMO_EVENT_COUNT = 180
const DEMO_EVENT_DAYS = 7

const DEMO_CHANNELS: readonly LoginEventChannel[] = [
    'email',
    'username',
    'phone',
    'email-otp',
    'phone-otp',
    'magic-link',
    'email-verification',
    'social',
    'sso',
]

const DEMO_EVENT_WEIGHTS: ReadonlyArray<readonly [LoginEventType, number]> = [
    ['sign_in_success', 50],
    ['sign_in_failure', 20],
    ['two_factor_challenge', 8],
    ['two_factor_success', 7],
    ['two_factor_failure', 3],
    ['sign_out', 8],
    ['session_revoked', 4],
]

const DEMO_USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
]

const DEMO_PROVIDERS = ['github', 'google', 'microsoft', 'okta']

export interface DemoLoginEventOptions {
    /** 已创建的 Demo 用户 ID（为空时事件不关联用户） */
    userIds: readonly string[]
    /** 时间锚点；默认当前时间 */
    now?: Date
    /** 覆盖天数，默认 7 */
    days?: number
    /** 事件数量，默认 180 */
    count?: number
    /** 随机种子，默认 20261122 */
    seed?: number
}

function pickWeightedType(random: () => number): LoginEventType {
    const total = DEMO_EVENT_WEIGHTS.reduce((sum, [, weight]) => sum + weight, 0)
    let ticket = random() * total
    for (const [type, weight] of DEMO_EVENT_WEIGHTS) {
        ticket -= weight
        if (ticket < 0) {
            return type
        }
    }
    return 'sign_in_success'
}

function resultForType(type: LoginEventType): LoginEventResult {
    return type === 'sign_in_failure' || type === 'two_factor_failure' ? 'failure' : 'success'
}

function metadataFor(type: LoginEventType, channel: LoginEventChannel, random: () => number): Record<string, unknown> | null {
    if (type === 'two_factor_success' || type === 'two_factor_failure') {
        const factors = ['totp', 'otp', 'backup-code'] as const
        return { factor: factors[Math.floor(random() * factors.length)] }
    }
    if ((channel === 'social' || channel === 'sso') && (type === 'sign_in_success' || type === 'sign_in_failure')) {
        return { provider: DEMO_PROVIDERS[Math.floor(random() * DEMO_PROVIDERS.length)] }
    }
    if (type === 'sign_in_failure') {
        return { reason: random() > 0.5 ? 'invalid_credentials' : 'rate_limited' }
    }
    return null
}

/** 生成确定性的 Demo 登录事件（按时间倒序返回） */
export function generateDemoLoginEvents(options: DemoLoginEventOptions): Array<LoginEventInput & { createdAt: Date }> {
    const now = options.now ?? new Date()
    const days = options.days ?? DEMO_EVENT_DAYS
    const count = options.count ?? DEMO_EVENT_COUNT
    const random = createSeededRandom(options.seed ?? DEMO_EVENT_SEED)
    const windowMs = Math.max(days, 1) * 24 * 60 * 60 * 1000
    const userIds = options.userIds

    const events: Array<LoginEventInput & { createdAt: Date }> = []
    for (let index = 0; index < count; index += 1) {
        const type = pickWeightedType(random)
        const channel = DEMO_CHANNELS[Math.floor(random() * DEMO_CHANNELS.length)] ?? 'unknown'
        const createdAt = new Date(now.getTime() - Math.floor(random() * windowMs / 60_000) * 60_000)
        const userId = type === 'sign_in_failure' && random() < 0.2
            ? null
            : userIds[Math.floor(random() * userIds.length)] ?? null
        events.push({
            type,
            result: resultForType(type),
            channel,
            userId,
            ip: `203.0.113.${1 + Math.floor(random() * 254)}`,
            userAgent: DEMO_USER_AGENTS[Math.floor(random() * DEMO_USER_AGENTS.length)] ?? null,
            metadata: metadataFor(type, channel, random),
            createdAt,
        })
    }
    return events.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
}
