<template>
    <div class="form-section">
        <h4>SAML 配置</h4>

        <div class="form-group">
            <label for="entryPoint">入口点 URL *</label>
            <InputText
                id="entryPoint"
                v-model="localModel.entryPoint"
                placeholder="SAML IdP 的 SSO 入口点 URL"
                class="w-full"
            />
        </div>

        <div class="form-group">
            <label for="certificate">X.509 证书 *</label>
            <Textarea
                id="certificate"
                v-model="localModel.certificate"
                placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                rows="8"
                class="w-full"
            />
            <small class="text-muted">
                IdP 的 X.509 证书，用于验证 SAML 响应签名
            </small>
        </div>

        <div class="form-group">
            <label for="signingKey">签名私钥</label>
            <Textarea
                id="signingKey"
                v-model="localModel.signingKey"
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                rows="8"
                class="w-full"
            />
            <small class="text-muted">
                可选：用于签名 SAML 请求的私钥
            </small>
        </div>

        <div class="form-group">
            <label for="attributeConsumingServiceIndex">属性消费服务索引</label>
            <InputNumber
                id="attributeConsumingServiceIndex"
                v-model="localModel.attributeConsumingServiceIndex"
                placeholder="0"
                class="w-full"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    modelValue: {
        entryPoint: string
        certificate: string
        signingKey: string
        attributeConsumingServiceIndex: number
    }
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
</style>
