import { ref, computed, type Ref } from 'vue'
import { type ZodSchema } from 'zod'

export type ValidatorFn<T> = (values: T) => Promise<Record<string, string> | null> | Record<string, string> | null

export interface UseFormOptions<T> {
    initialValues: T
    validate?: ValidatorFn<T>
    zodSchema?: ZodSchema<T>
    validateOnChange?: boolean
}

export function useForm<T extends Record<string, any> = Record<string, any>>(options: UseFormOptions<T>) {
    const { initialValues, validate, zodSchema, validateOnChange = false } = options

    const values = ref({ ...initialValues }) as Ref<T>
    const errors: Ref<Record<string, string>> = ref({})
    const submitting = ref(false)

    async function runValidation(): Promise<boolean> {
        errors.value = {}

        if (zodSchema) {
            const result = zodSchema.safeParse(values.value)
            if (!result.success) {
                const zodErrors: Record<string, string> = {}
                result.error.issues.forEach((err) => {
                    const path = err.path.join('.')
                    if (path) {
                        zodErrors[path] = err.message
                    } else {
                        zodErrors._form = err.message
                    }
                })
                errors.value = zodErrors
            }
        }

        if (validate) {
            try {
                const res = await validate(values.value)
                if (res) {
                    errors.value = { ...errors.value, ...res }
                }
            } catch (err) {
                // If validator throws, consider it a failure and map to _form error
                errors.value = { ...errors.value, _form: (err instanceof Error ? err.message : String(err)) }
            }
        }

        return Object.keys(errors.value).length === 0
    }

    async function handleSubmit(onSubmit: (vals: T) => Promise<void> | void) {
        submitting.value = true
        try {
            const ok = await runValidation()
            if (!ok) {
                return false
            }
            await onSubmit(values.value)
            return true
        } finally {
            submitting.value = false
        }
    }

    function reset(newValues?: Partial<T>) {
        // reset values to initial or provided
        const base = newValues ? { ...initialValues, ...newValues } : initialValues
        values.value = { ...base } as T
        errors.value = {}
    }

    function setField<K extends keyof T>(key: K, value: T[K]) {
        values.value[key] = value
        if (validateOnChange) {
            // fire-and-forget
            void runValidation()
        }
    }

    function setErrors(next: Record<string, string>) {
        errors.value = next
    }

    const isValid = computed(() => Object.keys(errors.value).length === 0)

    return {
        values,
        errors,
        submitting,
        isValid,
        runValidation,
        handleSubmit,
        reset,
        setField,
        setErrors,
    }
}

export default useForm
