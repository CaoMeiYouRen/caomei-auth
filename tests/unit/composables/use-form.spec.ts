import { nextTick } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { useForm } from '@/composables/core/use-form'

describe('useForm', () => {
    it('initializes with default values', () => {
        const { values, errors, isValid } = useForm({
            initialValues: { name: 'test', age: 18 },
        })

        expect(values.value.name).toBe('test')
        expect(values.value.age).toBe(18)
        expect(errors.value).toEqual({})
        expect(isValid.value).toBe(true)
    })

    it('validates values using validator function', async () => {
        const validate = (vals: { name: string }) => {
            if (!vals.name) {
                return { name: 'Required' }
            }
            return null
        }

        const { values, runValidation, errors, isValid } = useForm({
            initialValues: { name: '' },
            validate,
        })

        const valid = await runValidation()
        expect(valid).toBe(false)
        expect(errors.value.name).toBe('Required')
        expect(isValid.value).toBe(false)

        values.value.name = 'ok'
        const valid2 = await runValidation()
        expect(valid2).toBe(true)
        expect(errors.value).toEqual({})
        expect(isValid.value).toBe(true)
    })

    it('handles submit flow', async () => {
        const validate = (vals: { name: string }) => {
            if (vals.name.length < 3) {
                return { name: 'Too short' }
            }
            return null
        }
        const onSubmit = vi.fn()

        const { values, handleSubmit, submitting } = useForm({
            initialValues: { name: 'no' },
            validate,
        })

        // Fail validation
        const result = await handleSubmit(onSubmit)
        expect(result).toBe(false)
        expect(onSubmit).not.toHaveBeenCalled()
        expect(submitting.value).toBe(false)

        // Pass validation
        values.value.name = 'yes'
        const result2 = await handleSubmit(onSubmit)
        expect(result2).toBe(true)
        expect(onSubmit).toHaveBeenCalledWith(values.value)
        expect(submitting.value).toBe(false)
    })

    it('resets form to initial values', () => {
        const { values, reset, setField } = useForm({
            initialValues: { count: 0 },
        })

        setField('count', 5)
        expect(values.value.count).toBe(5)

        reset()
        expect(values.value.count).toBe(0)
    })

    it('resets form to new values', () => {
        const { values, reset } = useForm({
            initialValues: { count: 0 },
        })

        reset({ count: 10 })
        expect(values.value.count).toBe(10)
    })

    it('validates on change if enabled', async () => {
        const validate = vi.fn((vals: { text: string }) => vals.text === 'bad' ? { text: 'Error' } : null)

        const { setField, errors } = useForm({
            initialValues: { text: 'good' },
            validate,
            validateOnChange: true,
        })

        setField('text', 'bad')
        await nextTick() // wait for async validation (even if sync, it's called via void)
        // Since runValidation is async, we might need a small delay or just await if we could.
        // But setField is void. Let's wait a bit.
        await new Promise((r) => setTimeout(r, 10))

        expect(validate).toHaveBeenCalled()
        expect(errors.value.text).toBe('Error')
    })
})
