<template>
    <BaseDialogV2
        :visible="visible"
        :title="isEditing ? '编辑应用' : '创建新应用'"
        size="lg"
        @update:visible="visible = $event"
    >
        <form
            class="create-form"
            @submit.prevent="submitApplication"
        >
            <BaseInputV2
                id="client_name"
                v-model="formData.client_name"
                label="应用名称"
                placeholder="例如：我的博客应用"
                :error="!formData.client_name.trim() ? '应用名称为必填项' : ''"
                required
            />

            <CaomeiFormItem
                id="description"
                label="应用描述"
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="formData.description"
                        :rows="3"
                        placeholder="简要描述您的应用功能和用途"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <BaseInputV2
                id="redirectURLs"
                v-model="redirectUrlsInput"
                label="重定向 URL"
                hint="多个URL请用逗号分隔"
                placeholder="https://example.com/callback"
                required
                :error="formData.redirect_uris.length === 0 ? '至少需要一个重定向URL' : ''"
                @blur="updateRedirectUris"
            />

            <BaseInputV2
                id="client_uri"
                v-model="formData.client_uri"
                label="应用主页"
                hint="应用的官方网站地址"
                placeholder="https://example.com"
            />

            <BaseInputV2
                id="logo_uri"
                v-model="formData.logo_uri"
                label="应用Logo"
                hint="应用图标的URL地址"
                placeholder="https://example.com/logo.png"
            />

            <BaseInputV2
                id="scope"
                v-model="formData.scope"
                label="授权范围"
                hint="多个范围用空格分隔，如：openid profile email"
                placeholder="openid profile email"
                required
                :error="!formData.scope.trim() ? '授权范围为必填项' : ''"
            />

            <BaseInputV2
                id="contacts"
                v-model="contactsInput"
                label="联系邮箱"
                hint="应用管理员的联系邮箱，多个邮箱请用逗号分隔"
                placeholder="admin@example.com"
                @blur="updateContacts"
            />

            <CaomeiFormItem
                id="token_endpoint_auth_method"
                label="认证方式"
                hint="客户端向令牌端点进行身份验证的方法（支持 OIDC 标准方法）"
                required
            >
                <template #default="field">
                    <CaomeiSelect
                        :id="field.id"
                        v-model="formData.token_endpoint_auth_method"
                        :options="authMethodOptions"
                        option-label="label"
                        option-value="value"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <CaomeiFormItem
                id="grant_types"
                label="授权类型"
                hint="应用允许使用的 OAuth 2.0 授权类型"
                required
            >
                <template #default="field">
                    <CaomeiMultiSelect
                        :id="field.id"
                        v-model="formData.grant_types"
                        :options="grantTypeOptions"
                        option-label="label"
                        option-value="value"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <BaseInputV2
                id="tos_uri"
                v-model="formData.tos_uri"
                label="服务条款链接"
                placeholder="https://example.com/terms"
            />

            <BaseInputV2
                id="policy_uri"
                v-model="formData.policy_uri"
                label="隐私政策链接"
                placeholder="https://example.com/privacy"
            />

            <div class="create-form__footer">
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
                    {{ isEditing ? '保存修改' : '创建应用' }}
                </CaomeiButton>
            </div>
        </form>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { oauthApplicationFormSchema } from '@/utils/shared/schemas'
import type { AdminOAuthApplicationRow, AdminOAuthClientCredentials } from '@/types/admin'

const props = defineProps<{
    visible: boolean
    application?: AdminOAuthApplicationRow | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
    (e: 'created', application: AdminOAuthClientCredentials): void
    (e: 'updated'): void
}>()

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const isEditing = computed(() => Boolean(props.application))
const toast = useToast()
const submitting = ref(false)

const redirectUrlsInput = ref('')
const contactsInput = ref('')

const authMethodOptions = [
    { label: 'Basic认证 (推荐)', value: 'client_secret_basic' },
    { label: 'POST认证', value: 'client_secret_post' },
    { label: '无认证 (仅公开客户端)', value: 'none' },
]

const grantTypeOptions = [
    { label: '授权码模式 (推荐)', value: 'authorization_code' },
    { label: '刷新令牌', value: 'refresh_token' },
    { label: '隐式模式 (不支持)', value: 'implicit', disabled: true },
    { label: '密码模式 (不支持)', value: 'password', disabled: true },
    { label: '客户端模式 (不支持)', value: 'client_credentials', disabled: true },
]

const formData = ref({
    client_name: '',
    description: '',
    redirect_uris: [] as string[],
    client_uri: '',
    logo_uri: '',
    scope: 'openid profile email',
    contacts: [] as string[],
    tos_uri: '',
    policy_uri: '',
    token_endpoint_auth_method: 'client_secret_basic' as 'none' | 'client_secret_basic' | 'client_secret_post',
    grant_types: ['authorization_code'] as ('authorization_code' | 'refresh_token')[],
    response_types: ['code'] as ('code')[],
    software_id: '',
    software_version: '',
    disabled: false,
})

// 监听 application 变化，初始化表单
watch(() => props.application, (app) => {
    if (app) {
        formData.value = {
            client_name: app.name || '',
            description: app.description || '',
            redirect_uris: app.redirectURLs ? app.redirectURLs.split(',') : [],
            client_uri: app.clientUri || '',
            logo_uri: app.logoUri || '',
            scope: app.scope || 'openid profile email',
            contacts: app.contacts ? app.contacts.split(',') : [],
            tos_uri: app.tosUri || '',
            policy_uri: app.policyUri || '',
            token_endpoint_auth_method: (app.tokenEndpointAuthMethod || 'client_secret_basic') as 'none' | 'client_secret_basic' | 'client_secret_post',
            grant_types: app.grantTypes
                ? app.grantTypes.split(',').filter((type: string) => ['authorization_code', 'refresh_token'].includes(type)) as ('authorization_code' | 'refresh_token')[]
                : ['authorization_code'],
            response_types: app.responseTypes
                ? app.responseTypes.split(',').filter((type: string) => type === 'code') as ('code')[]
                : ['code'],
            software_id: app.softwareId || '',
            software_version: app.softwareVersion || '',
            disabled: app.disabled || false,
        }
        redirectUrlsInput.value = formData.value.redirect_uris.join(',')
        contactsInput.value = formData.value.contacts.join(',')
    } else {
        resetForm()
    }
}, { immediate: true })

// 监听 visible 变化，关闭时重置表单（如果是创建模式）
watch(visible, (val) => {
    if (!val && !props.application) {
        resetForm()
    }
})

function resetForm() {
    formData.value = {
        client_name: '',
        description: '',
        redirect_uris: [],
        client_uri: '',
        logo_uri: '',
        scope: 'openid profile email',
        contacts: [],
        tos_uri: '',
        policy_uri: '',
        token_endpoint_auth_method: 'client_secret_basic',
        grant_types: ['authorization_code'],
        response_types: ['code'],
        software_id: '',
        software_version: '',
        disabled: false,
    }
    redirectUrlsInput.value = ''
    contactsInput.value = ''
}

function updateRedirectUris() {
    const urls = redirectUrlsInput.value
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url)
    formData.value.redirect_uris = urls
}

function updateContacts() {
    const emails = contactsInput.value
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email)
    formData.value.contacts = emails
}

function validateForm(): string[] {
    const errors: string[] = []

    const result = oauthApplicationFormSchema.safeParse(formData.value)
    if (!result.success) {
        for (const issue of result.error.issues) {
            errors.push(issue.message)
        }
    }

    return errors
}

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

async function submitApplication() {
    try {
        submitting.value = true

        updateRedirectUris()
        updateContacts()

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            toast.danger({
                title: '表单验证失败',
                description: validationErrors.join('；'),
                duration: 5000,
            })
            return
        }

        const payload = {
            id: isEditing.value ? props.application?.id : undefined,
            client_name: formData.value.client_name,
            description: formData.value.description,
            redirect_uris: formData.value.redirect_uris,
            client_uri: formData.value.client_uri,
            logo_uri: formData.value.logo_uri,
            scope: formData.value.scope,
            contacts: formData.value.contacts,
            tos_uri: formData.value.tos_uri,
            policy_uri: formData.value.policy_uri,
            token_endpoint_auth_method: formData.value.token_endpoint_auth_method,
            grant_types: formData.value.grant_types,
            response_types: formData.value.response_types,
            software_id: formData.value.software_id,
            software_version: formData.value.software_version,
            disabled: formData.value.disabled,
        }

        const url = isEditing.value
            ? `/api/admin/oauth/applications/${props.application?.id}`
            : '/api/admin/oauth/applications'
        const method = isEditing.value ? 'PUT' : 'POST'

        const response = await $fetch<{
            success: boolean
            message?: string
            data: AdminOAuthClientCredentials
        }>(url, {
            method,
            body: payload,
        })

        if (response.success) {
            toast.success({
                title: isEditing.value ? '更新成功' : '创建成功',
                description: isEditing.value ? '应用信息已更新' : '应用已成功创建',
                duration: 3000,
            })
            visible.value = false
            if (isEditing.value) {
                emit('updated')
            } else {
                emit('created', response.data)
            }
        } else {
            throw new Error(response.message || '操作失败')
        }
    } catch (error: unknown) {
        toast.danger({
            title: isEditing.value ? '更新失败' : '创建失败',
            description: errorMessage(error, '操作失败'),
            duration: 3000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.create-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__footer {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        margin-top: 0.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--admin-border);
    }
}
</style>
