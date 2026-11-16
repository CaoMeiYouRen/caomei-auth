import { describe, expect, it } from 'vitest'
import { extractKeyLiterals, findUnknownSourceKeys } from '../../../scripts/i18n/lib/locale-data.mjs'
import { parseSourceKeyAllowlist } from '../../../scripts/i18n/audit-locale-keys.mjs'

describe('scripts/i18n/lib/locale-data 反向键校验', () => {
    it('提取 t / $t / te / $te 与模板字符串的字面量键', () => {
        const source = `
            const a = t('auth.login.title')
            const b = $t("common.status.normal")
            const c = te('validation.invalid')
            const d = $te('validation.required')
            const e = i18n.t('app.title')
            const f = t(\`auth.register.title\`)
            const g = t('auth.login.placeholderEmail', { name })
        `
        expect(extractKeyLiterals(source)).toEqual([
            'app.title',
            'auth.login.placeholderEmail',
            'auth.login.title',
            'auth.register.title',
            'common.status.normal',
            'validation.invalid',
            'validation.required',
        ])
    })

    it('提取 keypath 属性与 usePageMeta 参数', () => {
        const source = `
            <i18n-t keypath="static.privacy.title" />
            usePageMeta('admin.users.page.title', 'admin.users.page.subtitle')
        `
        expect(extractKeyLiterals(source)).toEqual([
            'admin.users.page.subtitle',
            'admin.users.page.title',
            'static.privacy.title',
        ])
    })

    it('忽略普通函数名、单段键、拼接与插值模板', () => {
        const source = `
            format('a.b')
            set('c.d')
            t('user')
            t('auth.' + kind)
            t(\`auth.\${kind}.title\`)
        `
        expect(extractKeyLiterals(source)).toEqual([])
    })

    it('返回源码引用但语言包缺失的键，白名单键跳过', () => {
        const known = new Map([['auth.login.title', '登录']])
        const unknown = findUnknownSourceKeys(
            ['auth.login.title', 'auth.missing.key', 'demo.dynamic.key'],
            known,
            ['demo.dynamic.key'],
        )
        expect(unknown).toEqual(['auth.missing.key'])
    })
})

describe('scripts/i18n/audit-locale-keys 白名单解析', () => {
    it('接受数组与 { keys } 两种形态', () => {
        expect(parseSourceKeyAllowlist('[{"key":"a.b","reason":"动态拼接"}]').keys.has('a.b')).toBe(true)
        expect(parseSourceKeyAllowlist('{"keys":[{"key":"c.d","reason":"运行时来源"}]}').keys.has('c.d')).toBe(true)
    })

    it('拒绝缺少 key 或 reason 的条目', () => {
        expect(() => parseSourceKeyAllowlist('{"keys":[{"key":"a.b"}]}')).toThrow('reason')
        expect(() => parseSourceKeyAllowlist('{"keys":[{"key":"","reason":"x"}]}')).toThrow('key')
    })

    it('拒绝非数组结构', () => {
        expect(() => parseSourceKeyAllowlist('{"keys":{}}')).toThrow('必须是数组')
    })
})
