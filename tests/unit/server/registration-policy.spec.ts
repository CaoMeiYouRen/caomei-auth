import { describe, expect, it } from 'vitest'
import {
    evaluateRules,
    extractEmailDomain,
    matchesDomain,
    normalizeRuleValue,
} from '@/server/utils/registration-policy'
import type { RegistrationRule } from '@/server/entities/registration-rule'

function rule(partial: Partial<RegistrationRule>): RegistrationRule {
    return {
        enabled: true,
        type: 'email-domain',
        mode: 'deny',
        value: 'blocked.test',
        note: null,
        ...partial,
    } as RegistrationRule
}

describe('server/utils/registration-policy', () => {
    it('规范化与提取', () => {
        expect(normalizeRuleValue(' Example.COM ')).toBe('example.com')
        expect(extractEmailDomain('User@Example.com')).toBe('example.com')
        expect(extractEmailDomain('bad')).toBeNull()
        expect(matchesDomain('.edu.cn', 'mail.edu.cn')).toBe(true)
        expect(matchesDomain('.edu.cn', 'edu.cn')).toBe(true)
        expect(matchesDomain('blocked.test', 'sub.blocked.test')).toBe(false)
    })

    it('黑名单命中即拒绝，allow 为空时默认放行', () => {
        const rules = [rule({})]
        expect(evaluateRules(rules, { email: 'a@blocked.test' }).allowed).toBe(false)
        expect(evaluateRules(rules, { email: 'a@other.com' }).allowed).toBe(true)
        expect(evaluateRules([], { email: 'a@blocked.test' }).allowed).toBe(true)
    })

    it('系统占位邮箱域名不受域名规则影响', () => {
        const rules = [rule({ value: 'example.com' }), rule({ value: 'anonymous.com' })]
        expect(evaluateRules(rules, { email: 'random@example.com' }).allowed).toBe(true)
        expect(evaluateRules(rules, { email: 'random@anonymous.com' }).allowed).toBe(true)
    })

    it('白名单非空时仅放行命中项', () => {
        const rules = [rule({ mode: 'allow', value: '.edu.cn' })]
        expect(evaluateRules(rules, { email: 'a@mail.edu.cn' }).allowed).toBe(true)
        expect(evaluateRules(rules, { email: 'a@gmail.com' }).allowed).toBe(false)
    })

    it('忽略停用规则，并按国家码拒绝手机号', () => {
        expect(evaluateRules([rule({ enabled: false })], { email: 'a@blocked.test' }).allowed).toBe(true)
        const rules = [rule({ type: 'phone-country', mode: 'deny', value: '+86' })]
        expect(evaluateRules(rules, { phone: '+8613800000000' })).toEqual({ allowed: false, reason: 'phone-country' })
        expect(evaluateRules(rules, { phone: '+14155550000' }).allowed).toBe(true)
    })
})
