import { describe, expect, it } from 'vitest'
import zhEmail from '@/i18n/locales/zh-CN/email.json'
import enEmail from '@/i18n/locales/en-US/email.json'

function flatten(value: unknown, prefix = ''): Record<string, string> {
    if (typeof value !== 'object' || value === null) {
        return prefix ? { [prefix]: String(value) } : {}
    }
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>((acc, [key, child]) => {
        Object.assign(acc, flatten(child, prefix ? `${prefix}.${key}` : key))
        return acc
    }, {})
}

const zh = flatten(zhEmail)
const en = flatten(enEmail)

describe('i18n/locales/email.json', () => {
    it('keeps zh and en keys aligned', () => {
        expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    })

    it('keeps placeholders identical across locales', () => {
        const placeholders = (value: string) => [...value.matchAll(/\{(\w+)\}/gu)].map((match) => match[1]).sort()

        for (const key of Object.keys(zh)) {
            expect({ key, placeholders: placeholders(en[key] ?? '') })
                .toEqual({ key, placeholders: placeholders(zh[key] ?? '') })
        }
    })

    it('does not leave Chinese copy in the English pack', () => {
        const leftovers = Object.entries(en)
            .filter(([, value]) => /[\u4e00-\u9fa5]/u.test(value))
            .map(([key]) => key)

        expect(leftovers).toEqual([])
    })

    it('has no empty values', () => {
        for (const pack of [zh, en]) {
            expect(Object.entries(pack).filter(([, value]) => !value.trim()).map(([key]) => key)).toEqual([])
        }
    })
})
