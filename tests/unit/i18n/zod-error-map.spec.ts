import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { adminRoleSyncSchema, oauthApplicationFormSchema } from '@/utils/shared/schemas'
import { useForm } from '@/composables/core/use-form'

/** 假的 t()：返回 key，便于断言映射命中 */
const t = (key: string) => `t:${key}`

describe('utils/shared/zod-error-map', () => {
    it('translates issues that have no schema-level message', () => {
        const schema = z.object({
            count: z.number(),
            name: z.string().min(2),
        })
        const result = schema.safeParse({ count: 'x', name: 'a' }, { error: createZodErrorMap(t) })

        expect(result.success).toBe(false)
        expect(result.error?.issues.map((issue) => issue.message)).toEqual([
            't:validation.type',
            't:validation.tooSmall',
        ])
    })

    it('keeps schema-level messages (documented M2 prerequisite)', () => {
        const result = z.string().min(1, '请输入邮箱').safeParse('', { error: createZodErrorMap(t) })

        expect(result.error?.issues[0]?.message).toBe('请输入邮箱')
    })

    it('works with the admin role sync API schema', () => {
        const result = adminRoleSyncSchema.safeParse(
            { userId: 'user-1', action: 'invalid' },
            { error: createZodErrorMap(t) },
        )

        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe('t:validation.invalidValue')
    })

    it('works with the OAuth application form schema', () => {
        const result = oauthApplicationFormSchema.safeParse(
            {
                client_name: 'app',
                redirect_uris: ['https://example.com/callback'],
                scope: 'openid',
                token_endpoint_auth_method: 'unsupported',
                grant_types: ['authorization_code'],
                response_types: ['code'],
            },
            { error: createZodErrorMap(t) },
        )

        expect(result.success).toBe(false)
        expect(result.error?.issues[0]?.message).toBe('t:validation.invalidValue')
    })

    it('drives useForm validation through the per-parse map', async () => {
        const schema = z.object({
            nickname: z.string().min(2),
            age: z.number().max(10),
        })
        const form = useForm({
            initialValues: { nickname: 'a', age: 20 },
            zodSchema: schema,
            errorMap: createZodErrorMap(t),
        })

        await expect(form.handleSubmit(() => undefined)).resolves.toBe(false)
        expect(form.errors.value.nickname).toBe('t:validation.tooSmall')
        expect(form.errors.value.age).toBe('t:validation.tooBig')
    })
})
