import { describe, expect, it } from 'vitest'
import {
    idParamSchema,
    paginationQuerySchema,
    sessionLogsQuerySchema,
    socialProvidersQuerySchema,
    ssoProvidersQuerySchema,
} from '@/utils/shared/api-schemas'

describe('utils/shared/api-schemas', () => {
    describe('idParamSchema', () => {
        it('接受非空字符串 id', () => {
            expect(idParamSchema.parse({ id: 'abc-123' })).toEqual({ id: 'abc-123' })
        })

        it('拒绝空 id', () => {
            const result = idParamSchema.safeParse({ id: '' })

            expect(result.success).toBe(false)
            expect(result.error?.issues[0]?.message).toBe('validation.idRequired')
        })
    })

    describe('paginationQuerySchema', () => {
        it('为空查询提供默认分页与排序', () => {
            expect(paginationQuerySchema.parse({})).toEqual({
                page: 0,
                limit: 10,
                search: '',
                sortField: 'createdAt',
                sortOrder: 'DESC',
            })
        })

        it('把字符串形式的数字转换为 number', () => {
            const parsed = paginationQuerySchema.parse({ page: '2', limit: '25' })

            expect(parsed.page).toBe(2)
            expect(parsed.limit).toBe(25)
        })

        it('拒绝非数字分页参数', () => {
            expect(paginationQuerySchema.safeParse({ page: 'abc' }).success).toBe(false)
            expect(paginationQuerySchema.safeParse({ limit: '1.5' }).success).toBe(false)
            expect(paginationQuerySchema.safeParse({ limit: '-1' }).success).toBe(false)
        })

        it('把 sortOrder 归一化为大写', () => {
            expect(paginationQuerySchema.parse({ sortOrder: 'asc' }).sortOrder).toBe('ASC')
            expect(paginationQuerySchema.parse({ sortOrder: 'desc' }).sortOrder).toBe('DESC')
        })

        it('拒绝非法 sortOrder', () => {
            expect(paginationQuerySchema.safeParse({ sortOrder: 'random' }).success).toBe(false)
        })
    })

    describe('ssoProvidersQuerySchema', () => {
        it('保留分页默认值', () => {
            expect(ssoProvidersQuerySchema.parse({})).toMatchObject({ page: 0, limit: 10 })
        })

        it('把 enabled 字符串转换为布尔值', () => {
            expect(ssoProvidersQuerySchema.parse({ enabled: 'true' }).enabled).toBe(true)
            expect(ssoProvidersQuerySchema.parse({ enabled: 'false' }).enabled).toBe(false)
        })

        it('无法识别的 enabled 视为未筛选', () => {
            expect(ssoProvidersQuerySchema.parse({ enabled: 'yes' }).enabled).toBeUndefined()
            expect(ssoProvidersQuerySchema.parse({}).enabled).toBeUndefined()
        })

        it('只接受 oidc / saml / 空字符串作为 type', () => {
            expect(ssoProvidersQuerySchema.parse({ type: 'oidc' }).type).toBe('oidc')
            expect(ssoProvidersQuerySchema.parse({ type: 'saml' }).type).toBe('saml')
            expect(ssoProvidersQuerySchema.parse({ type: '' }).type).toBe('')
            expect(ssoProvidersQuerySchema.safeParse({ type: 'oauth' }).success).toBe(false)
        })
    })

    describe('sessionLogsQuerySchema', () => {
        it('使用与列表接口不同的默认分页', () => {
            expect(sessionLogsQuerySchema.parse({})).toEqual({
                page: 1,
                limit: 20,
                status: 'all',
            })
        })

        it('保留筛选条件', () => {
            const parsed = sessionLogsQuerySchema.parse({
                page: '3',
                limit: '50',
                userId: 'user-1',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
                status: 'active',
                search: 'chrome',
            })

            expect(parsed).toEqual({
                page: 3,
                limit: 50,
                userId: 'user-1',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
                status: 'active',
                search: 'chrome',
            })
        })

        it('拒绝非法 status', () => {
            expect(sessionLogsQuerySchema.safeParse({ status: 'banned' }).success).toBe(false)
        })
    })

    describe('socialProvidersQuerySchema', () => {
        it('仅在 includeDisabled=true 时返回 true', () => {
            expect(socialProvidersQuerySchema.parse({ includeDisabled: 'true' }).includeDisabled).toBe(true)
            expect(socialProvidersQuerySchema.parse({ includeDisabled: 'false' }).includeDisabled).toBe(false)
            expect(socialProvidersQuerySchema.parse({}).includeDisabled).toBe(false)
            expect(socialProvidersQuerySchema.parse({ includeDisabled: '1' }).includeDisabled).toBe(false)
        })
    })
})
