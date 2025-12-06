<template>
    <div class="form-group">
        <label
            v-if="label"
            :for="id"
            class="form-label"
        >
            {{ label }}
            <span v-if="required" class="required-mark">*</span>
        </label>
        <div class="form-control-wrapper">
            <slot />
        </div>
        <div v-if="error" class="error-message">
            {{ error }}
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    id?: string
    label?: string
    error?: string
    required?: boolean
}>()
</script>

<style lang="scss" scoped>
.required-mark {
    color: #e63946;
    margin-left: 0.25rem;
}

.error-message {
    color: #e63946;
    font-size: 0.875rem;
    margin-top: 0.25rem;
}
</style>
