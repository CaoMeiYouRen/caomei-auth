<template>
    <div class="form-section">
        <h4>属性映射</h4>
        <p class="text-muted">
            配置如何将 SSO 提供商的属性映射到本地用户字段
        </p>

        <div class="form-group">
            <label for="mappingId">用户 ID 字段</label>
            <InputText
                id="mappingId"
                v-model="localModel.id"
                :placeholder="type === 'saml' ? 'nameID' : 'sub'"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="mappingEmail">邮箱字段</label>
            <InputText
                id="mappingEmail"
                v-model="localModel.email"
                placeholder="email"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="mappingName">姓名字段</label>
            <InputText
                id="mappingName"
                v-model="localModel.name"
                :placeholder="type === 'saml' ? 'displayName' : 'name'"
                class="w-full"
            />
        </div>

        <div v-if="type === 'saml'" class="form-group">
            <label for="mappingFirstName">名字字段</label>
            <InputText
                id="mappingFirstName"
                v-model="localModel.firstName"
                placeholder="givenName"
                class="w-full"
            />
        </div>

        <div v-if="type === 'saml'" class="form-group">
            <label for="mappingLastName">姓氏字段</label>
            <InputText
                id="mappingLastName"
                v-model="localModel.lastName"
                placeholder="surname"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="mappingEmailVerified">邮箱验证字段</label>
            <InputText
                id="mappingEmailVerified"
                v-model="localModel.emailVerified"
                placeholder="email_verified"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="mappingImage">头像字段</label>
            <InputText
                id="mappingImage"
                v-model="localModel.image"
                placeholder="picture"
                class="w-full"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: {
        id: string
        email: string
        emailVerified: string
        name: string
        firstName: string
        lastName: string
        image: string
    }
    type: 'oidc' | 'saml'
}>()

const emit = defineEmits(['update:modelValue'])

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
.form-section {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid #e2e8f0;

    h4 {
        color: var(--primary-color);
        margin: 0 0 1rem;
        font-size: 1.125rem;
        font-weight: 600;
    }
}

.form-group {
    margin-bottom: 1.5rem;

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
        color: #4a5568;
    }
}

.text-muted {
    color: #718096;
    font-size: 0.875rem;
    margin-bottom: 1rem;
}
</style>
