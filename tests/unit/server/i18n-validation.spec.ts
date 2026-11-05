import { describe, expect, it, vi } from 'vitest'
import { validateBodySafe } from '@/server/utils/validation'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { adminRoleSyncSchema } from '@/utils/shared/schemas'

const bodyRef = vi.hoisted(() => ({ current: {} as unknown }))

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return {
        ...actual,
        readValidatedBody: async (_event: unknown, parse: (body: unknown) => unknown) => parse(bodyRef.current),
    }
})

const t = (key: string) => `t:${key}`

describe('server/utils/validation i18n error map', () => {
    it('returns translated message when the schema has no explicit message', async () => {
        bodyRef.current = { userId: 'user-1', action: 'invalid' }

        const result = await validateBodySafe({} as any, adminRoleSyncSchema, {
            errorMap: createZodErrorMap(t),
        })

        expect(result.success).toBe(false)
        expect(result.success ? '' : result.error.message).toBe('t:validation.invalidValue')
    })

    it('keeps behavior unchanged without an error map', async () => {
        bodyRef.current = { userId: 'user-1', action: 'invalid' }

        const result = await validateBodySafe({} as any, adminRoleSyncSchema)

        expect(result.success).toBe(false)
        expect(result.success ? '' : result.error.status).toBe(400)
    })
})
