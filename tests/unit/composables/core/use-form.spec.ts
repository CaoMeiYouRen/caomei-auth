import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { useForm } from '@/composables/core/use-form'

describe('useForm', () => {
    it('initializes with values', () => {
        const { values } = useForm({
            initialValues: { name: 'test' },
        })
        expect(values.value).toEqual({ name: 'test' })
    })

    it('validates with zod schema', async () => {
        const schema = z.object({
            name: z.string().min(3),
        })
        const { values, runValidation, errors } = useForm({
            initialValues: { name: 'a' },
            zodSchema: schema,
        })

        const isValid = await runValidation()
        expect(isValid).toBe(false)
        expect(errors.value.name).toBeDefined()

        values.value.name = 'abc'
        const isValid2 = await runValidation()
        expect(isValid2).toBe(true)
        expect(errors.value).toEqual({})
    })

    it('handles submit', async () => {
        const onSubmit = vi.fn()
        const { handleSubmit } = useForm({
            initialValues: { name: 'test' },
        })

        await handleSubmit(onSubmit)
        expect(onSubmit).toHaveBeenCalledWith({ name: 'test' })
    })

    it('resets form', () => {
        const { values, reset, setField } = useForm({
            initialValues: { name: 'initial' },
        })

        setField('name', 'changed')
        expect(values.value.name).toBe('changed')

        reset()
        expect(values.value.name).toBe('initial')
    })
})
