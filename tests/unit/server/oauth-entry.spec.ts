import { describe, expect, it } from 'vitest'
import { resolveOAuthEntryPath } from '@/server/utils/oauth-entry'

describe('resolveOAuthEntryPath', () => {
    it('默认语言不加前缀', () => {
        expect(resolveOAuthEntryPath('/login', 'http://localhost/api/oauth-entry/login?client_id=a', 'zh-CN')).toBe('/login?client_id=a')
    })

    it('无 cookie 时回落默认语言', () => {
        expect(resolveOAuthEntryPath('/oauth/consent', 'http://localhost/api/oauth-entry/consent?client_id=a', undefined)).toBe('/oauth/consent?client_id=a')
    })

    it('启用语言补前缀并保留 query', () => {
        expect(resolveOAuthEntryPath(
            '/oauth/consent',
            'http://localhost/api/oauth-entry/consent?client_id=a&redirect_uri=http%3A%2F%2Fx%2Fcb&response_type=code&state=s1',
            'ja-JP',
        )).toBe('/ja-JP/oauth/consent?client_id=a&redirect_uri=http%3A%2F%2Fx%2Fcb&response_type=code&state=s1')
    })

    it('未启用或非法语言回落默认语言', () => {
        expect(resolveOAuthEntryPath('/login', 'http://localhost/api/oauth-entry/login', 'fr-FR')).toBe('/login')
        expect(resolveOAuthEntryPath('/login', 'http://localhost/api/oauth-entry/login', '../x')).toBe('/login')
    })

    it('短码 / 大小写变体按 registry 归一化', () => {
        expect(resolveOAuthEntryPath('/login', 'http://localhost/api/oauth-entry/login', 'ja-jp')).toBe('/ja-JP/login')
        expect(resolveOAuthEntryPath('/login', 'http://localhost/api/oauth-entry/login', 'en')).toBe('/en-US/login')
    })

    it('外部 host / 协议相对 URL 不会进入 Location', () => {
        expect(resolveOAuthEntryPath('/login', 'http://evil.com/api/oauth-entry/login?x=1', 'ja-JP')).toBe('/ja-JP/login?x=1')
        expect(resolveOAuthEntryPath('/login', '//evil.com/api/oauth-entry/login?x=1', 'ja-JP')).toBe('/ja-JP/login?x=1')
        expect(resolveOAuthEntryPath('/login', 'javascript:alert(1)?x=1', 'ja-JP')).toBe('/ja-JP/login?x=1')
    })

    it('query 只解码一次并原样保留', () => {
        expect(resolveOAuthEntryPath('/login', 'http://localhost/api/oauth-entry/login?b=%252F&a=1+2', 'ja-JP')).toBe('/ja-JP/login?b=%252F&a=1+2')
    })
})
