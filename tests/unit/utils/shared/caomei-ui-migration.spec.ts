import { describe, expect, it } from 'vitest'
import { CAOMEI_UI_ROUTE_PREFIXES, isCaomeiUiRoute } from '@/utils/shared/caomei-ui-migration'

describe('utils/shared/caomei-ui-migration', () => {
    it('默认白名单为空集', () => {
        expect(CAOMEI_UI_ROUTE_PREFIXES).toEqual([])
        expect(isCaomeiUiRoute('/login')).toBe(false)
        expect(isCaomeiUiRoute('/')).toBe(false)
    })

    it('按路径段匹配前缀', () => {
        const prefixes = ['/login', '/admin/users']

        expect(isCaomeiUiRoute('/login', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/login/oauth', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/admin/users', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/admin/users/123', prefixes)).toBe(true)
    })

    it('不把相似前缀当作命中', () => {
        const prefixes = ['/login']

        expect(isCaomeiUiRoute('/login-extra', prefixes)).toBe(false)
        expect(isCaomeiUiRoute('/loginfo', prefixes)).toBe(false)
    })

    it('忽略查询串与哈希', () => {
        const prefixes = ['/login']

        expect(isCaomeiUiRoute('/login?mode=email', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/login#form', prefixes)).toBe(true)
    })

    it('容忍带尾斜杠或空字符串的前缀', () => {
        const prefixes = ['/login/', '', '/']

        expect(isCaomeiUiRoute('/login', prefixes)).toBe(true)
        expect(isCaomeiUiRoute('/other', prefixes)).toBe(false)
    })
})
