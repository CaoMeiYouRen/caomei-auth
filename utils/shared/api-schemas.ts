import { z } from 'zod'

// ============================================
// Path Parameter Schemas
// ============================================

/**
 * Schema for validating ID path parameters
 */
export const idParamSchema = z.object({
    id: z.string().min(1, 'ID 不能为空'),
})

// ============================================
// Pagination Query Schemas
// ============================================

/**
 * Transform string to number for query params
 */
const stringToNumber = z
    .string()
    .regex(/^\d+$/, '必须是数字')
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
})

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
// Type Exports (inferred from schemas)
// ============================================

export type IdParam = z.infer<typeof idParamSchema>
export type PaginationQuery = z.infer<typeof paginationQuerySchema>
export type SSOProvidersQuery = z.infer<typeof ssoProvidersQuerySchema>
export type SessionLogsQuery = z.infer<typeof sessionLogsQuerySchema>
export type SocialProvidersQuery = z.infer<typeof socialProvidersQuerySchema>
