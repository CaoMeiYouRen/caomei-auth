import { describe, expect, it } from 'vitest'
import {
    idParamSchema,
    loginEventHeatmapQuerySchema,
    loginEventStatsQuerySchema,
    loginEventViewSchema,
    loginEventsQuerySchema,
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
                ip: '203.0.113.7',
            })

            expect(parsed).toEqual({
                page: 3,
                limit: 50,
                userId: 'user-1',
                startDate: '2026-01-01',
                endDate: '2026-01-31',
                status: 'active',
                search: 'chrome',
                ip: '203.0.113.7',
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

describe('registrationRule schemas', () => {
    it('更新 schema 不为缺省字段注入默认值', async () => {
        const { registrationRuleUpdateSchema } = await import('@/utils/shared/api-schemas')
        expect(registrationRuleUpdateSchema.parse({ note: 'x' })).toEqual({ note: 'x' })
        expect(registrationRuleUpdateSchema.safeParse({}).success).toBe(false)
    })

    it('拒绝非法类型与超长值', async () => {
        const { registrationRuleSchema } = await import('@/utils/shared/api-schemas')
        expect(registrationRuleSchema.safeParse({ type: 'ip', mode: 'deny', value: 'x' }).success).toBe(false)
        expect(registrationRuleSchema.safeParse({ type: 'email-domain', mode: 'deny', value: 'x'.repeat(129) }).success).toBe(false)
    })
})

describe('loginEventsQuerySchema', () => {
    it('为空查询提供默认分页与倒序', () => {
        expect(loginEventsQuerySchema.parse({})).toMatchObject({
            page: 1,
            limit: 20,
            sort: 'desc',
        })
    })

    it('把字符串分页转为数字并接受合法筛选', () => {
        const parsed = loginEventsQuerySchema.parse({
            page: '2',
            limit: '50',
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'sso',
            sort: 'asc',
        })
        expect(parsed).toMatchObject({
            page: 2,
            limit: 50,
            type: 'sign_in_failure',
            result: 'failure',
            channel: 'sso',
            sort: 'asc',
        })
    })

    it('拒绝越界分页、未知枚举、非法日期与倒置时间窗', () => {
        expect(loginEventsQuerySchema.safeParse({ page: '0' }).success).toBe(false)
        expect(loginEventsQuerySchema.safeParse({ limit: '101' }).success).toBe(false)
        expect(loginEventsQuerySchema.safeParse({ type: 'sign_up' }).success).toBe(false)
        expect(loginEventsQuerySchema.safeParse({ result: 'partial' }).success).toBe(false)
        expect(loginEventsQuerySchema.safeParse({ channel: 'saml' }).success).toBe(false)
        expect(loginEventsQuerySchema.safeParse({ startDate: 'not-a-date' }).success).toBe(false)
        expect(loginEventsQuerySchema.safeParse({
            startDate: '2026-11-22T00:00:00.000Z',
            endDate: '2026-11-21T00:00:00.000Z',
        }).success).toBe(false)
    })

    it('视图 schema 只接受展示字段', () => {
        const view = {
            id: 'event-1',
            type: 'sign_in_success',
            result: 'success',
            channel: 'email',
            userId: 'user-1',
            ip: '203.0.113.9',
            userAgent: 'UA',
            metadata: { provider: 'github' },
            createdAt: '2026-11-20T08:00:00.000Z',
        }
        expect(loginEventViewSchema.parse(view)).toEqual(view)
        expect(loginEventViewSchema.safeParse({ ...view, type: 'sign_up' }).success).toBe(false)
    })
})

describe('loginEventStatsQuerySchema', () => {
    it('与列表共用筛选但不接收分页 / 排序', () => {
        const parsed = loginEventStatsQuerySchema.parse({ type: 'sign_out', channel: 'sso' })
        expect(parsed).toEqual({ type: 'sign_out', channel: 'sso' })
        expect(loginEventStatsQuerySchema.parse({ page: '2' })).toEqual({})
        expect(loginEventStatsQuerySchema.safeParse({
            startDate: '2026-11-22T00:00:00.000Z',
            endDate: '2026-11-21T00:00:00.000Z',
        }).success).toBe(false)
    })
})

describe('loginEventHeatmapQuerySchema', () => {
    it('days 默认 7，接受 30 并转为数字', () => {
        expect(loginEventHeatmapQuerySchema.parse({})).toMatchObject({ days: 7 })
        expect(loginEventHeatmapQuerySchema.parse({ days: '30' })).toMatchObject({ days: 30 })
    })

    it('拒绝非法天数与倒置时间窗', () => {
        expect(loginEventHeatmapQuerySchema.safeParse({ days: '14' }).success).toBe(false)
        expect(loginEventHeatmapQuerySchema.safeParse({
            startDate: '2026-11-22T00:00:00.000Z',
            endDate: '2026-11-21T00:00:00.000Z',
        }).success).toBe(false)
    })
})
