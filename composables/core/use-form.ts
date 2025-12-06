import { ref, reactive, computed, type Ref } from 'vue'

export type ValidatorFn<T> = (values: T) => Promise<Record<string, string> | null> | Record<string, string> | null

export interface UseFormOptions<T> {
    initialValues: T
    validate?: ValidatorFn<T>
    validateOnChange?: boolean
}

export function useForm<T extends Record<string, any> = Record<string, any>>(options: UseFormOptions<T>) {
    const { initialValues, validate, validateOnChange = false } = options

    const values = reactive({ ...(initialValues as object) }) as T
    const errors: Ref<Record<string, string>> = ref({})
    const submitting = ref(false)

    async function runValidation(): Promise<boolean> {
        if (!validate) {
            errors.value = {}
            return true
        }

        try {
            const res = await validate(values)
            errors.value = res || {}
            return !res || Object.keys(res).length === 0
        } catch (err) {
            // If validator throws, consider it a failure and map to _form error
            errors.value = { _form: (err instanceof Error ? err.message : String(err)) }
            return false
        }
    }

    async function handleSubmit(onSubmit: (vals: T) => Promise<void> | void) {
        submitting.value = true
        try {
            const ok = await runValidation()
            if (!ok) {
                return false
            }
            await onSubmit(values)
            return true
        } finally {
            submitting.value = false
        }
    }

    function reset(newValues?: Partial<T>) {
        // reset values to initial or provided
        const base = newValues ? { ...initialValues, ...newValues } : initialValues
        Object.keys(base).forEach((k) => {
            (values as any)[k] = (base as any)[k]
        })
        errors.value = {}
    }

    function setField<K extends keyof T>(key: K, value: T[K]) {
        values[key] = value
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
