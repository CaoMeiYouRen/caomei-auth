<template>
    <div class="form-group">
        <label
            v-if="label"
            :for="id"
            class="form-label"
        >
            {{ label }}
            <span v-if="required" style="color: #e63946;">*</span>
        </label>
        <Password
            :id="id"
            v-bind="$attrs"
            :model-value="modelValue"
            :class="['form-input', 'password-input', {'p-invalid': !!error}]"
            :placeholder="placeholder"
            :disabled="disabled"
            :feedback="feedback"
            :toggle-mask="toggleMask"
            @update:model-value="$emit('update:modelValue', $event as string)"
        />
        <slot name="append" />
        <div v-if="error" class="error-message">
            {{ error }}
        </div>
    </div>
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
    toggleMask?: boolean
    required?: boolean
}>(), {
    label: '',
    placeholder: '',
    error: '',
    disabled: false,
    feedback: false,
    toggleMask: true,
    required: false,
})

defineEmits<{
    (e: 'update:modelValue', value: string): void
}>()
</script>
