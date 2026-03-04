import { createError, getValidatedQuery, getValidatedRouterParams, readValidatedBody, type H3Event } from 'h3'
import type { z } from 'zod'

/**
 * Validation error response format
 */
export interface ValidationErrorResponse {
    status: 400
    success: false
    message: string
    data: null
}

/**
 * Extracts the first error message from Zod validation issues
 */
export function getFirstZodError(error: z.ZodError): string {
    return error.issues[0]?.message || '参数校验失败'
}

/**
 * Creates a standardized validation error response
 */
export function createValidationError(message: string): ValidationErrorResponse {
    return {
        status: 400,
        success: false,
        message,
        data: null,
    }
}

/**
 * Validates request body with Zod schema
 * Returns validated data or throws H3 error
 */
export async function validateBody<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
    const result = await readValidatedBody(event, (body) => schema.safeParse(body))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: getFirstZodError(result.error),
        })
    }

    return result.data
}

/**
 * Validates request body with Zod schema (returns response object instead of throwing)
 * Useful for handlers that return response objects instead of throwing errors
 */
export async function validateBodySafe<T extends z.ZodType>(
    event: H3Event,
    schema: T,
): Promise<{ success: true, data: z.infer<T> } | { success: false, error: ValidationErrorResponse }> {
    const result = await readValidatedBody(event, (body) => schema.safeParse(body))

    if (!result.success) {
        return {
            success: false,
            error: createValidationError(getFirstZodError(result.error)),
        }
    }

    return { success: true, data: result.data }
}

/**
 * Validates query parameters with Zod schema
 * Returns validated data or throws H3 error
 */
export async function validateQuery<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
    const result = await getValidatedQuery(event, (query) => schema.safeParse(query))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: getFirstZodError(result.error),
        })
    }

    return result.data
}

/**
 * Validates router/path parameters with Zod schema
 * Returns validated data or throws H3 error
 */
export async function validateParams<T extends z.ZodType>(event: H3Event, schema: T): Promise<z.infer<T>> {
    const result = await getValidatedRouterParams(event, (params) => schema.safeParse(params))

    if (!result.success) {
        throw createError({
            statusCode: 400,
            statusMessage: getFirstZodError(result.error),
        })
    }

    return result.data
}

/**
 * Validates router parameters (returns response object instead of throwing)
 * Useful for handlers that return response objects instead of throwing errors
 */
export async function validateParamsSafe<T extends z.ZodType>(
    event: H3Event,
    schema: T,
): Promise<{ success: true, data: z.infer<T> } | { success: false, error: ValidationErrorResponse }> {
    const result = await getValidatedRouterParams(event, (params) => schema.safeParse(params))

    if (!result.success) {
        return {
            success: false,
            error: createValidationError(getFirstZodError(result.error)),
        }
    }

    return { success: true, data: result.data }
}
