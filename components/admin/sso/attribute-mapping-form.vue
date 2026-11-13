<template>
    <section class="config-section">
        <h4 class="config-section__title">
            属性映射
        </h4>
        <p class="config-section__description">
            配置如何将 SSO 提供商的属性映射到本地用户字段
        </p>

        <div class="config-section__fields">
            <BaseInputV2
                id="mappingEmail"
                v-model="localModel.email"
                label="邮箱字段"
                placeholder="email"
            />

            <BaseInputV2
                id="mappingName"
                v-model="localModel.name"
                label="姓名字段"
                :placeholder="type === 'saml' ? 'displayName' : 'name'"
            />

            <BaseInputV2
                v-if="type === 'saml'"
                id="mappingFirstName"
                v-model="localModel.firstName"
                label="名字字段"
                placeholder="givenName"
            />

            <BaseInputV2
                v-if="type === 'saml'"
                id="mappingLastName"
                v-model="localModel.lastName"
                label="姓氏字段"
                placeholder="surname"
            />

            <BaseInputV2
                id="mappingEmailVerified"
                v-model="localModel.emailVerified"
                label="邮箱验证字段"
                placeholder="email_verified"
            />

            <BaseInputV2
                id="mappingImage"
                v-model="localModel.image"
                label="头像字段"
                placeholder="picture"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: {
        email: string
        emailVerified: string
        name: string
        firstName: string
        lastName: string
        image: string
    }
    type: 'oidc' | 'saml'
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: typeof props.modelValue): void
}>()

// Create a local copy to avoid mutating prop
const localModel = ref({ ...props.modelValue })

// Watch for prop changes to update local copy
watch(() => props.modelValue, (newVal) => {
    if (JSON.stringify(newVal) !== JSON.stringify(localModel.value)) {
        localModel.value = { ...newVal }
    }
}, { deep: true })

// Watch for local changes to emit update
watch(localModel, (newVal) => {
    emit('update:modelValue', { ...newVal })
}, { deep: true })
</script>

<style lang="scss" scoped>
.config-section {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid var(--admin-border);

    &__title {
        margin: 0 0 1rem;
        color: var(--color-primary);
        font-size: 1.125rem;
        font-weight: 600;
    }

    &__description {
        margin: 0 0 1rem;
        color: var(--admin-muted);
        font-size: 0.875rem;
    }

    &__fields {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
}
</style>
