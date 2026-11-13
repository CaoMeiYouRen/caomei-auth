<template>
    <BaseDialogV2
        :visible="visible"
        :title="isEditing ? '编辑 SSO 提供商' : '添加 SSO 提供商'"
        size="lg"
        @update:visible="visible = $event"
    >
        <form
            class="provider-form"
            @submit.prevent="submitProvider"
        >
            <p class="provider-form__intro">
                {{ isEditing ? '修改 SSO 提供商配置' : '配置新的 SSO 提供商，支持 OIDC 和 SAML 协议' }}
            </p>

            <!-- 基本信息 -->
            <section class="config-section">
                <h4 class="config-section__title">
                    基本信息
                </h4>

                <div class="config-section__fields">
                    <CaomeiFormItem
                        id="providerType"
                        label="协议类型"
                        required
                    >
                        <template #default="field">
                            <CaomeiRadioGroup
                                :id="field.id"
                                v-model="providerTypeModel"
                                orientation="horizontal"
                                :aria-labelledby="field['aria-labelledby']"
                                :aria-describedby="field['aria-describedby']"
                            >
                                <CaomeiRadioButton
                                    value="oidc"
                                    text="OIDC/OAuth2"
                                    :disabled="isEditing"
                                />
                                <CaomeiRadioButton
                                    value="saml"
                                    text="SAML 2.0"
                                    :disabled="isEditing"
                                />
                            </CaomeiRadioGroup>
                        </template>
                    </CaomeiFormItem>

                    <BaseInputV2
                        id="providerId"
                        v-model="formData.providerId"
                        label="Provider ID"
                        hint="唯一标识符，用于生成回调 URL。编辑时不可修改。"
                        placeholder="例如：company-sso、google-workspace"
                        :disabled="isEditing"
                        required
                    />

                    <BaseInputV2
                        id="name"
                        v-model="formData.name"
                        label="显示名称"
                        placeholder="例如：公司 SSO、Google Workspace"
                    />

                    <CaomeiFormItem
                        id="description"
                        label="描述"
                    >
                        <template #default="field">
                            <CaomeiTextarea
                                :id="field.id"
                                v-model="formData.description"
                                :rows="3"
                                placeholder="SSO 提供商的详细描述"
                                :aria-labelledby="field['aria-labelledby']"
                                :aria-describedby="field['aria-describedby']"
                            />
                        </template>
                    </CaomeiFormItem>

                    <BaseInputV2
                        id="issuer"
                        v-model="formData.issuer"
                        label="发行者 URL"
                        placeholder="例如：https://accounts.google.com、https://company.okta.com"
                        required
                    />

                    <BaseInputV2
                        id="domain"
                        v-model="formData.domain"
                        label="域名"
                        hint="用于域名匹配，用户邮箱域名与此匹配时会使用此 SSO 提供商"
                        placeholder="例如：company.com、example.org"
                        required
                    />

                    <BaseInputV2
                        id="organizationId"
                        v-model="formData.organizationId"
                        label="关联组织 ID"
                        placeholder="可选：关联到特定组织"
                    />

                    <CaomeiCheckbox
                        id="enabled"
                        v-model="formData.enabled"
                        text="启用此 SSO 提供商"
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
                    取消
                </CaomeiButton>
                <CaomeiButton
                    type="submit"
                    :loading="submitting"
                >
                    {{ isEditing ? '更新' : '创建' }}
                </CaomeiButton>
            </div>
        </form>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast, type RadioValue } from 'caomei-ui'
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

/** `CaomeiRadioGroup` 的模型是通用 `RadioValue`，收敛回 `'oidc' | 'saml'` 保持表单类型 */
const providerTypeModel = computed<RadioValue>({
    get: () => formData.value.type,
    set: (value) => {
        formData.value.type = value === 'saml' ? 'saml' : 'oidc'
    },
})

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
            throw new Error('获取提供商数据失败')
        }

        applyProviderDetail(response.data)
    } catch (error: unknown) {
        console.error('获取提供商编辑数据失败:', error)
        toast.danger({
            title: '获取数据失败',
            description: errorMessage(error, '无法获取提供商数据进行编辑'),
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
                title: '表单验证失败',
                description: validationErrors.join('；'),
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
            throw new Error(response.message || '操作失败')
        }

        toast.success({
            title: isEditing.value ? '更新成功' : '创建成功',
            description: `SSO 提供商 ${formData.value.name || formData.value.providerId} ${isEditing.value ? '更新' : '创建'}成功`,
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
            title: isEditing.value ? '更新失败' : '创建失败',
            description: errorMessage(error, '请检查网络连接或联系管理员'),
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
