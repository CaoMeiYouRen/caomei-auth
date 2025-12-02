<template>
    <div class="form-section">
        <h4>OIDC 配置</h4>

        <div class="form-group">
            <label for="clientId">Client ID *</label>
            <InputText
                id="clientId"
                v-model="localModel.clientId"
                placeholder="在 OIDC 提供商处注册的客户端 ID"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="clientSecret">Client Secret *</label>
            <Password
                id="clientSecret"
                v-model="localModel.clientSecret"
                placeholder="客户端密钥"
                :feedback="false"
                toggle-mask
                class="w-full"
                input-class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="discoveryEndpoint">Discovery Endpoint</label>
            <InputText
                id="discoveryEndpoint"
                v-model="localModel.discoveryEndpoint"
                placeholder="例如：https://accounts.google.com/.well-known/openid-configuration"
                class="w-full"
            />
            <small class="text-muted">
                如果提供此 URL，其他端点将自动发现
            </small>
        </div>

        <div class="form-group">
            <label for="authorizationEndpoint">Authorization Endpoint</label>
            <InputText
                id="authorizationEndpoint"
                v-model="localModel.authorizationEndpoint"
                placeholder="授权端点 URL"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="tokenEndpoint">Token Endpoint</label>
            <InputText
                id="tokenEndpoint"
                v-model="localModel.tokenEndpoint"
                placeholder="令牌端点 URL"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="userInfoEndpoint">UserInfo Endpoint</label>
            <InputText
                id="userInfoEndpoint"
                v-model="localModel.userInfoEndpoint"
                placeholder="用户信息端点 URL"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="jwksEndpoint">JWKS Endpoint</label>
            <InputText
                id="jwksEndpoint"
                v-model="localModel.jwksEndpoint"
                placeholder="JSON Web Key Set 端点 URL"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="scopes">作用域</label>
            <InputText
                id="scopes"
                v-model="scopesInput"
                placeholder="例如：openid profile email"
                class="w-full"
                @input="updateScopes"
            />
            <small class="text-muted">
                用空格分隔多个作用域
            </small>
        </div>

        <div class="form-group">
            <div class="field-checkbox">
                <Checkbox
                    id="pkce"
                    v-model="localModel.pkce"
                    binary
                />
                <label for="pkce">启用 PKCE</label>
            </div>
        </div>
    </div>
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

const emit = defineEmits(['update:modelValue'])

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

function updateScopes() {
    const newScopes = scopesInput.value
        .split(' ')
        .map((s) => s.trim())
        .filter((s) => s)

    localModel.value.scopes = newScopes
}
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
</style>
