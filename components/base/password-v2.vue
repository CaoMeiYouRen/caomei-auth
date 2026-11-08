<template>
    <CaomeiFormItem
        :id="id"
        :label="label"
        :error="error"
        :required="required"
        :name="name"
    >
        <template #default="field">
            <CaomeiPassword
                :id="field.id"
                :name="field.name"
                :model-value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                :feedback="feedback"
                :invalid="field.invalid"
                :aria-labelledby="field['aria-labelledby']"
                :aria-describedby="field['aria-describedby']"
                v-bind="$attrs"
                @update:model-value="$emit('update:modelValue', $event)"
            />
        </template>
    </CaomeiFormItem>
</template>

<script setup lang="ts">
defineOptions({
    inheritAttrs: false,
})

withDefaults(defineProps<{
    id: string
    label?: string
    modelValue: string
    placeholder?: string
    error?: string
    disabled?: boolean
    feedback?: boolean
    required?: boolean
    name?: string
}>(), {
    label: '',
    placeholder: '',
    error: '',
    disabled: false,
    feedback: false,
    required: false,
    name: '',
})

defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>
