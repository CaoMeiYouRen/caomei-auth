import { z } from 'zod'
import { LOGIN_EVENT_CHANNELS, LOGIN_EVENT_RESULTS, LOGIN_EVENT_TYPES } from './login-events'

// ============================================
// Path Parameter Schemas
// ============================================

/**
 * Schema for validating ID path parameters
 */
export const idParamSchema = z.object({
    id: z.string().min(1, 'validation.idRequired'),
})

// ============================================
// Pagination Query Schemas
// ============================================

/**
 * Transform string to number for query params
 */
const stringToNumber = z
    .string()
    .regex(/^\d+$/, 'validation.digitsOnly')
    .transform(Number)
    .or(z.number())

/**
 * Base pagination schema - can be extended
 */
export const paginationQuerySchema = z.object({
    page: stringToNumber.optional().default(0),
    limit: stringToNumber.optional().default(10),
    search: z.string().optional().default(''),
    sortField: z.string().optional().default('createdAt'),
    sortOrder: z
        .enum(['ASC', 'DESC', 'asc', 'desc'])
        .optional()
        .default('DESC')
        .transform((v) => v.toUpperCase() as 'ASC' | 'DESC'),
})

/**
 * SSO providers list query schema
 */
export const ssoProvidersQuerySchema = paginationQuerySchema.extend({
    type: z.enum(['oidc', 'saml']).optional().or(z.literal('')),
    enabled: z
        .string()
        .optional()
        .transform((v) => {
            if (v === 'true') {
                return true
            }
            if (v === 'false') {
                return false
            }
            return undefined
        }),
})

/**
 * Session logs query schema
 */
export const sessionLogsQuerySchema = z.object({
    page: stringToNumber.optional().default(1),
    limit: stringToNumber.optional().default(20),
    userId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['active', 'expired', 'all']).optional().default('all'),
    search: z.string().optional(),
    /** 精确匹配 IP（搜索框为模糊匹配） */
    ip: z.string().trim().max(64).optional(),
})

/**
 * Session log statistics query schema（与会话列表同一组筛选）
 */
export const logStatsQuerySchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.enum(['active', 'expired', 'all']).optional().default('all'),
    search: z.string().optional(),
    ip: z.string().trim().max(64).optional(),
})

/**
 * Registration rule schema（阶段 6 M13）
 */
export const registrationRuleTypeSchema = z.enum(['email-domain', 'phone-country'])
export const registrationRuleModeSchema = z.enum(['allow', 'deny'])

export const registrationRuleSchema = z.object({
    type: registrationRuleTypeSchema,
    mode: registrationRuleModeSchema,
    value: z.string().trim().min(1).max(128),
    enabled: z.boolean().optional().default(true),
    note: z.string().trim().max(255).nullable().optional(),
})

export const registrationRuleUpdateSchema = z.object({
    type: registrationRuleTypeSchema.optional(),
    mode: registrationRuleModeSchema.optional(),
    value: z.string().trim().min(1).max(128).optional(),
    enabled: z.boolean().optional(),
    note: z.string().trim().max(255).nullable().optional(),
}).refine(
    (value) => Object.keys(value).length > 0,
    { message: 'validation.invalid' },
)

/**
 * Social providers query schema
 */
export const socialProvidersQuerySchema = z.object({
    includeDisabled: z
        .string()
        .optional()
        .transform((v) => v === 'true'),
})

// ============================================
// Login event schemas（阶段 12 M2.1）
// ============================================

/** 可被 `Date.parse` 解析的时间字符串；非法日期在边界直接 400 */
const isoDateString = z.string().refine(
    (value) => !Number.isNaN(Date.parse(value)),
    { message: 'validation.invalid' },
)

export const loginEventsQuerySchema = z.object({
    page: stringToNumber.optional().default(1).pipe(z.number().int().min(1)),
    limit: stringToNumber.optional().default(20).pipe(z.number().int().min(1).max(100)),
    type: z.enum(LOGIN_EVENT_TYPES).optional(),
    result: z.enum(LOGIN_EVENT_RESULTS).optional(),
    channel: z.enum(LOGIN_EVENT_CHANNELS).optional(),
    userId: z.string().trim().max(36).optional(),
    /** 精确匹配 IP；TEXT 列无索引，建议与时间窗组合使用（M2.3 默认 30 天） */
    ip: z.string().trim().max(64).optional(),
    /** 按时刻解释；日期粒度需自行补齐当日末刻 */
    startDate: isoDateString.optional(),
    /** 按时刻解释；日期粒度需自行补齐当日末刻 */
    endDate: isoDateString.optional(),
    sort: z.enum(['asc', 'desc']).optional().default('desc'),
}).refine(
    (value) => !value.startDate || !value.endDate || Date.parse(value.startDate) <= Date.parse(value.endDate),
    { message: 'validation.invalidValue', path: ['startDate'] },
)

/** 事件视图 DTO：只暴露脱敏后的字段，metadata 已在写入时白名单过滤 */
export const loginEventViewSchema = z.object({
    id: z.string(),
    type: z.enum(LOGIN_EVENT_TYPES),
    result: z.enum(LOGIN_EVENT_RESULTS),
    channel: z.enum(LOGIN_EVENT_CHANNELS),
    userId: z.string().nullable(),
    ip: z.string().nullable(),
    userAgent: z.string().nullable(),
    metadata: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string(),
})

// ============================================
// Type Exports (inferred from schemas)
// ============================================

export type IdParam = z.infer<typeof idParamSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type SSOProvidersQuery = z.infer<typeof ssoProvidersQuerySchema>
export type SessionLogsQuery = z.infer<typeof sessionLogsQuerySchema>
export type LogStatsQuery = z.infer<typeof logStatsQuerySchema>
export type RegistrationRuleInput = z.infer<typeof registrationRuleSchema>
export type RegistrationRuleUpdate = z.infer<typeof registrationRuleUpdateSchema>
export type SocialProvidersQuery = z.infer<typeof socialProvidersQuerySchema>
export type LoginEventsQuery = z.infer<typeof loginEventsQuerySchema>
export type LoginEventView = z.infer<typeof loginEventViewSchema>
