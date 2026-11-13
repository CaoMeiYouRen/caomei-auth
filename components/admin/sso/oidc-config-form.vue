<template>
    <section class="config-section">
        <h4 class="config-section__title">
            OIDC 配置
        </h4>

        <div class="config-section__fields">
            <BaseInputV2
                id="clientId"
                v-model="localModel.clientId"
                label="Client ID"
                placeholder="在 OIDC 提供商处注册的客户端 ID"
                required
            />

            <BasePasswordV2
                id="clientSecret"
                v-model="localModel.clientSecret"
                label="Client Secret"
                placeholder="客户端密钥"
                required
            />

            <BaseInputV2
                id="discoveryEndpoint"
                v-model="localModel.discoveryEndpoint"
                label="Discovery Endpoint"
                hint="如果提供此 URL，其他端点将自动发现"
                placeholder="例如：https://accounts.google.com/.well-known/openid-configuration"
            />

            <BaseInputV2
                id="authorizationEndpoint"
                v-model="localModel.authorizationEndpoint"
                label="Authorization Endpoint"
                placeholder="授权端点 URL"
            />

            <BaseInputV2
                id="tokenEndpoint"
                v-model="localModel.tokenEndpoint"
                label="Token Endpoint"
                placeholder="令牌端点 URL"
            />

            <BaseInputV2
                id="userInfoEndpoint"
                v-model="localModel.userInfoEndpoint"
                label="UserInfo Endpoint"
                placeholder="用户信息端点 URL"
            />

            <BaseInputV2
                id="jwksEndpoint"
                v-model="localModel.jwksEndpoint"
                label="JWKS Endpoint"
                placeholder="JSON Web Key Set 端点 URL"
            />

            <BaseInputV2
                id="scopes"
                :model-value="scopesInput"
                label="作用域"
                hint="用空格分隔多个作用域"
                placeholder="例如：openid profile email"
                @update:model-value="updateScopesInput"
            />

            <CaomeiCheckbox
                id="pkce"
                v-model="localModel.pkce"
                text="启用 PKCE"
            />
        </div>
    </section>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: {
        clientId: string
        clientSecret: string
        discoveryEndpoint: string
        authorizationEndpoint: string
        tokenEndpoint: string
        userInfoEndpoint: string
        jwksEndpoint: string
        scopes: string[]
        pkce: boolean
    }
}>()

const emit = defineEmits<{
    (e: 'update:modelValue', value: typeof props.modelValue): void
}>()

// Create a local copy to avoid mutating prop
const localModel = ref({ ...props.modelValue })
const scopesInput = ref(props.modelValue.scopes.join(' '))

// Watch for prop changes to update local copy
watch(() => props.modelValue, (newVal) => {
    // Simple check to avoid infinite loops or unnecessary updates
    if (JSON.stringify(newVal) !== JSON.stringify(localModel.value)) {
        localModel.value = { ...newVal }
        scopesInput.value = newVal.scopes.join(' ')
    }
}, { deep: true })

// Watch for local changes to emit update
watch(localModel, (newVal) => {
    emit('update:modelValue', { ...newVal })
}, { deep: true })

function updateScopesInput(value: string) {
    scopesInput.value = value
    localModel.value.scopes = value
        .split(' ')
        .map((scope) => scope.trim())
        .filter((scope) => scope)
}
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

    &__fields {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }
}
</style>
