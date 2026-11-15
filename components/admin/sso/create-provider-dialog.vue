<template>
    <BaseDialogV2
        :visible="visible"
        :title="isEditing ? t('admin.sso.create.titleEdit') : t('admin.sso.create.titleCreate')"
        size="lg"
        @update:visible="visible = $event"
    >
        <form
            class="provider-form"
            @submit.prevent="submitProvider"
        >
            <p class="provider-form__intro">
                {{ isEditing ? t('admin.sso.create.introEdit') : t('admin.sso.create.introCreate') }}
            </p>

            <!-- 基本信息 -->
            <section class="config-section">
                <h4 class="config-section__title">
                    {{ t('admin.sso.create.basicInfo') }}
                </h4>

                <div class="config-section__fields">
                    <CaomeiFormItem
                        id="providerType"
                        :label="t('admin.sso.create.type')"
                        required
                    >
                        <template #default="field">
                            <CaomeiSelect
                                :id="field.id"
                                v-model="formData.type"
                                :options="providerTypeOptions"
                                option-label="label"
                                option-value="value"
                                :placeholder="t('admin.sso.create.typePlaceholder')"
                                :disabled="isEditing"
                                :aria-labelledby="field['aria-labelledby']"
                                :aria-describedby="field['aria-describedby']"
                            />
                        </template>
                    </CaomeiFormItem>

                    <BaseInputV2
                        id="providerId"
                        v-model="formData.providerId"
                        :label="t('admin.sso.create.providerId')"
                        :hint="t('admin.sso.create.providerIdHint')"
                        :placeholder="t('admin.sso.create.providerIdPlaceholder')"
                        :disabled="isEditing"
                        required
                    />

                    <BaseInputV2
                        id="name"
                        v-model="formData.name"
                        :label="t('admin.sso.create.name')"
                        :placeholder="t('admin.sso.create.namePlaceholder')"
                    />

                    <CaomeiFormItem
                        id="description"
                        :label="t('admin.sso.create.description')"
                    >
                        <template #default="field">
                            <CaomeiTextarea
                                :id="field.id"
                                v-model="formData.description"
                                :rows="3"
                                :placeholder="t('admin.sso.create.descriptionPlaceholder')"
                                :aria-labelledby="field['aria-labelledby']"
                                :aria-describedby="field['aria-describedby']"
                            />
                        </template>
                    </CaomeiFormItem>

                    <BaseInputV2
                        id="issuer"
                        v-model="formData.issuer"
                        :label="t('admin.sso.create.issuer')"
                        :placeholder="t('admin.sso.create.issuerPlaceholder')"
                        required
                    />

                    <BaseInputV2
                        id="domain"
                        v-model="formData.domain"
                        :label="t('admin.sso.create.domain')"
                        :hint="t('admin.sso.create.domainHint')"
                        :placeholder="t('admin.sso.create.domainPlaceholder')"
                        required
                    />

                    <BaseInputV2
                        id="organizationId"
                        v-model="formData.organizationId"
                        :label="t('admin.sso.create.organizationId')"
                        :placeholder="t('admin.sso.create.organizationIdPlaceholder')"
                    />

                    <CaomeiCheckbox
                        id="enabled"
                        v-model="formData.enabled"
                        :text="t('admin.sso.create.enabled')"
                    />
                </div>
            </section>

            <!-- OIDC 配置 -->
            <OidcConfigForm
                v-if="formData.type === 'oidc'"
                v-model="oidcFormData"
            />

            <!-- SAML 配置 -->
            <SamlConfigForm
                v-if="formData.type === 'saml'"
                v-model="samlFormData"
            />

            <!-- 属性映射 -->
            <AttributeMappingForm
                v-model="mappingFormData"
                :type="formData.type"
            />

            <div class="provider-form__actions">
                <CaomeiButton
                    variant="secondary"
                    @click="visible = false"
                >
                    {{ t('admin.sso.create.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    type="submit"
                    :loading="submitting"
                >
                    {{ isEditing ? t('admin.sso.create.submitUpdate') : t('admin.sso.create.submitCreate') }}
                </CaomeiButton>
            </div>
        </form>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import type { AdminSsoProviderDetail } from '@/types/admin'
import { useSsoProviderForm } from '@/composables/admin/use-sso-provider-form'
import OidcConfigForm from './oidc-config-form.vue'
import SamlConfigForm from './saml-config-form.vue'
import AttributeMappingForm from './attribute-mapping-form.vue'

interface SsoProviderResponse {
    success: boolean
    message?: string
    data?: AdminSsoProviderDetail
}

const props = defineProps<{
    visible: boolean
    provider?: AdminSsoProviderDetail | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'created', provider?: AdminSsoProviderDetail): void
    (e: 'updated'): void
}>()

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const isEditing = computed(() => Boolean(props.provider))
const toast = useToast()
const submitting = ref(false)

const providerTypeOptions: { label: string, value: 'oidc' | 'saml' }[] = [
    { label: 'OIDC/OAuth2', value: 'oidc' },
    { label: 'SAML 2.0', value: 'saml' },
]

const {
    formData,
    oidcFormData,
    samlFormData,
    mappingFormData,
    resetForm,
    applyProviderDetail,
    buildPayload,
    validateForm,
} = useSsoProviderForm()

const { t } = useI18n()
const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

// 监听 provider 变化，初始化表单
watch(() => props.provider, async (provider) => {
    if (!provider) {
        resetForm()
        return
    }

    try {
        // 从API获取最新的提供商数据
        const response = await $fetch<SsoProviderResponse>(`/api/admin/sso/providers/${provider.id}`)

        if (!response?.success || !response.data) {
            throw new Error(t('admin.sso.create.loadFailed'))
        }

        applyProviderDetail(response.data)
    } catch (error: unknown) {
        console.error('Failed to load provider data for editing:', error)
        toast.danger({
            title: t('admin.sso.create.loadFailedTitle'),
            description: errorMessage(error, t('admin.sso.create.loadFailedDescription')),
            duration: 3000,
        })
    }
}, { immediate: true })

// 监听 visible 变化，关闭时重置表单（如果是创建模式）
watch(visible, (val) => {
    if (!val && !props.provider) {
        resetForm()
    }
})

// 提交表单
async function submitProvider() {
    try {
        submitting.value = true

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            toast.danger({
                title: t('admin.sso.create.validationFailed'),
                description: validationErrors.join(t('common.listSeparator')),
                duration: 5000,
            })
            return
        }

        const response = await $fetch<SsoProviderResponse>(
            isEditing.value ? `/api/admin/sso/providers/${props.provider?.id}` : '/api/admin/sso/providers',
            {
                method: isEditing.value ? 'PUT' : 'POST',
                body: buildPayload(),
            },
        )

        if (!response.success) {
            throw new Error(response.message || t('admin.sso.create.operationFailed'))
        }

        toast.success({
            title: isEditing.value ? t('admin.sso.create.updateSuccessTitle') : t('admin.sso.create.createSuccessTitle'),
            description: isEditing.value
                ? t('admin.sso.create.updateSuccess', { name: formData.value.name || formData.value.providerId })
                : t('admin.sso.create.createSuccess', { name: formData.value.name || formData.value.providerId }),
            duration: 3000,
        })

        visible.value = false
        if (isEditing.value) {
            emit('updated')
        } else {
            emit('created', response.data)
        }
    } catch (error: unknown) {
        toast.danger({
            title: isEditing.value ? t('admin.sso.create.updateFailedTitle') : t('admin.sso.create.createFailedTitle'),
            description: errorMessage(error, t('admin.sso.create.failureDescription')),
            duration: 5000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.provider-form {
    display: flex;
    flex-direction: column;

    &__intro {
        margin: 0 0 1.5rem;
        color: var(--admin-muted);
    }

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }

    :deep(.config-section:last-of-type) {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
    }

    @media (width <= 768px) {
        &__actions {
            flex-direction: column-reverse;

            :deep(button) {
                width: 100%;
            }
        }
    }
}

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
