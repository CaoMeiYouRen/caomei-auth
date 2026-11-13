<template>
    <section class="config-section">
        <h4 class="config-section__title">
            SAML 配置
        </h4>

        <div class="config-section__fields">
            <BaseInputV2
                id="entryPoint"
                v-model="localModel.entryPoint"
                label="入口点 URL"
                placeholder="SAML IdP 的 SSO 入口点 URL"
                required
            />

            <CaomeiFormItem
                id="certificate"
                label="X.509 证书"
                hint="IdP 的 X.509 证书，用于验证 SAML 响应签名"
                required
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="localModel.certificate"
                        :rows="8"
                        placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <CaomeiFormItem
                id="signingKey"
                label="签名私钥"
                hint="可选：用于签名 SAML 请求的私钥"
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="localModel.signingKey"
                        :rows="8"
                        placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <CaomeiFormItem
                id="attributeConsumingServiceIndex"
                label="属性消费服务索引"
            >
                <template #default="field">
                    <CaomeiInputNumber
                        :id="field.id"
                        :model-value="localModel.attributeConsumingServiceIndex"
                        placeholder="0"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                        @update:model-value="updateServiceIndex"
                    />
                </template>
            </CaomeiFormItem>
        </div>
    </section>
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

/** `CaomeiInputNumber` 的清空态为 `null`，回填为 `0` 保持模型为数字（与迁移前的数字语义一致，`0` 与 `undefined` 在唯一消费方等价） */
function updateServiceIndex(value: number | null) {
    localModel.value.attributeConsumingServiceIndex = value ?? 0
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
