<template>
    <CaomeiFormItem
        :id="id"
        :label="label"
        :error="error"
        :required="required"
        :name="name"
    >
        <template #default="field">
            <div :class="{'code-row': $slots.append}">
                <CaomeiInput
                    :id="field.id"
                    :name="field.name"
                    :model-value="modelValue"
                    :type="type"
                    :placeholder="placeholder"
                    :disabled="disabled"
                    :invalid="field.invalid"
                    :aria-labelledby="field['aria-labelledby']"
                    :aria-describedby="field['aria-describedby']"
                    v-bind="$attrs"
                    @update:model-value="$emit('update:modelValue', $event)"
                />
                <slot name="append" />
            </div>
        </template>
    </CaomeiFormItem>
</template>

<script setup lang="ts">
import type { InputType } from 'caomei-ui'

defineOptions({
    inheritAttrs: false,
})

withDefaults(defineProps<{
    id: string
    label?: string
    modelValue: string
    placeholder?: string
    error?: string
    type?: InputType
    disabled?: boolean
    required?: boolean
    name?: string
}>(), {
    label: '',
    placeholder: '',
    error: '',
    type: 'text',
    disabled: false,
    required: false,
    name: '',
})

defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>

<style scoped lang="scss">
.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;

    :deep(.caomei-input) {
        flex: 1;
    }
}
</style>
