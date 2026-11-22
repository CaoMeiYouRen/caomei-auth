import { describe, expect, it } from 'vitest'
import { buildAdminUserSearchQuery } from '@/utils/web/user-search'

describe('utils/web/user-search', () => {
    it('无搜索条件返回空对象', () => {
        expect(buildAdminUserSearchQuery('')).toEqual({})
        expect(buildAdminUserSearchQuery(undefined, '')).toEqual({})
    })

    it('保留既有姓名 / 邮箱 / @用户名搜索语义', () => {
        expect(buildAdminUserSearchQuery('草梅')).toEqual({ searchField: 'name', searchValue: '草梅', searchOperator: 'contains' })
        expect(buildAdminUserSearchQuery('admin@example.com')).toEqual({ searchField: 'email', searchValue: 'admin@example.com', searchOperator: 'contains' })
        expect(buildAdminUserSearchQuery('@demo')).toEqual({ searchField: 'name', searchValue: 'demo', searchOperator: 'contains' })
    })

    it('显式 userId 只在搜索框为空或仍为该 ID 时生效', () => {
        const userId = '1a2b3c4d5e6f7890'
        expect(buildAdminUserSearchQuery('', userId)).toEqual({})
        expect(buildAdminUserSearchQuery(userId, userId)).toEqual({ filterField: 'id', filterValue: userId, filterOperator: 'eq' })
        /* 用户手动改搜索词后回到普通搜索，不再被固定 ID 过滤 */
        expect(buildAdminUserSearchQuery('someone', userId)).toEqual({ searchField: 'name', searchValue: 'someone', searchOperator: 'contains' })
    })

    it('手机号 / 纯数字等普通输入不会被误判为用户 ID', () => {
        expect(buildAdminUserSearchQuery('8613800138000')).toEqual({ searchField: 'name', searchValue: '8613800138000', searchOperator: 'contains' })
        expect(buildAdminUserSearchQuery('123456789012')).toEqual({ searchField: 'name', searchValue: '123456789012', searchOperator: 'contains' })
    })
})
