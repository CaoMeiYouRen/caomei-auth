import { dataSource } from '@/server/database'
import { RegistrationRule } from '@/server/entities/registration-rule'
import { ANONYMOUS_EMAIL_DOMAIN_NAME, TEMP_EMAIL_DOMAIN_NAME } from '@/utils/shared/env'

/** 系统生成的占位邮箱域名（手机注册 / 匿名 / 无邮箱第三方）不参与域名名单判定 */
const IGNORED_EMAIL_DOMAINS = new Set([
    normalizeRuleValue(TEMP_EMAIL_DOMAIN_NAME),
    normalizeRuleValue(ANONYMOUS_EMAIL_DOMAIN_NAME),
])

export interface RegistrationInput {
    email?: string | null
    phone?: string | null
}

export interface RegistrationDecision {
    allowed: boolean
    reason?: 'email-domain' | 'phone-country'
}

/** 统一小写并去掉空白；前导点表示「后缀匹配」 */
export function normalizeRuleValue(value: string): string {
    return value.trim().toLowerCase()
}

export function extractEmailDomain(email: string | null | undefined): string | null {
    if (!email || !email.includes('@')) {
        return null
    }
    const domain = email.split('@').pop()?.trim().toLowerCase()
    return domain || null
}

/** 域名匹配：精确（example.com）或后缀（.edu.cn） */
export function matchesDomain(ruleValue: string, domain: string): boolean {
    const rule = normalizeRuleValue(ruleValue)
    if (rule.startsWith('.')) {
        return domain === rule.slice(1) || domain.endsWith(rule)
    }
    return domain === rule
}

function pickRules(rules: RegistrationRule[], type: RegistrationRule['type'], mode: RegistrationRule['mode']) {
    return rules.filter((rule) => rule.enabled && rule.type === type && rule.mode === mode)
}

/** 纯函数：按规则集合判断是否允许注册（allow 非空则需命中，deny 命中即拒绝） */
export function evaluateRules(rules: RegistrationRule[], input: RegistrationInput): RegistrationDecision {
    const domain = extractEmailDomain(input.email)
    if (domain && !IGNORED_EMAIL_DOMAINS.has(domain)) {
        const denied = pickRules(rules, 'email-domain', 'deny').some((rule) => matchesDomain(rule.value, domain))
        if (denied) {
            return { allowed: false, reason: 'email-domain' }
        }
        const allowed = pickRules(rules, 'email-domain', 'allow')
        if (allowed.length > 0 && !allowed.some((rule) => matchesDomain(rule.value, domain))) {
            return { allowed: false, reason: 'email-domain' }
        }
    }

    const phone = input.phone?.trim()
    if (phone) {
        /* 国家码长度不定（+1 / +86 / +998），用规则值做前缀匹配，最长命中优先 */
        const matchesCountry = (ruleValue: string) => {
            const normalized = normalizeRuleValue(ruleValue)
            return normalized.startsWith('+') && phone.startsWith(normalized)
        }
        if (pickRules(rules, 'phone-country', 'deny').some((rule) => matchesCountry(rule.value))) {
            return { allowed: false, reason: 'phone-country' }
        }
        const allowed = pickRules(rules, 'phone-country', 'allow')
        if (allowed.length > 0 && !allowed.some((rule) => matchesCountry(rule.value))) {
            return { allowed: false, reason: 'phone-country' }
        }
    }

    return { allowed: true }
}

let cache: { rules: RegistrationRule[], expiresAt: number } | null = null
const CACHE_TTL_MS = 30_000

export function invalidateRegistrationRuleCache(): void {
    cache = null
}

async function loadRules(): Promise<RegistrationRule[]> {
    if (cache && cache.expiresAt > Date.now()) {
        return cache.rules
    }
    const rules = await dataSource.getRepository(RegistrationRule).find({ where: { enabled: true } })
    cache = { rules, expiresAt: Date.now() + CACHE_TTL_MS }
    return rules
}

/** 读取规则并判定（DB 不可用时放行，避免注册入口整体不可用） */
export async function evaluateRegistration(input: RegistrationInput): Promise<RegistrationDecision> {
    try {
        return evaluateRules(await loadRules(), input)
    } catch {
        return { allowed: true }
    }
}
