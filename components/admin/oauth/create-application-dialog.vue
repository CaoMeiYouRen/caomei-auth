<template>
    <BaseDialogV2
        :visible="visible"
        :title="isEditing ? t('admin.oauth.create.titleEdit') : t('admin.oauth.create.titleCreate')"
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
                :label="t('admin.oauth.create.name')"
                :placeholder="t('admin.oauth.create.namePlaceholder')"
                :error="!formData.client_name.trim() ? t('admin.oauth.create.nameRequired') : ''"
                required
            />

            <CaomeiFormItem
                id="description"
                :label="t('admin.oauth.create.description')"
            >
                <template #default="field">
                    <CaomeiTextarea
                        :id="field.id"
                        v-model="formData.description"
                        :rows="3"
                        :placeholder="t('admin.oauth.create.descriptionPlaceholder')"
                        :aria-labelledby="field['aria-labelledby']"
                        :aria-describedby="field['aria-describedby']"
                    />
                </template>
            </CaomeiFormItem>

            <BaseInputV2
                id="redirectURLs"
                v-model="redirectUrlsInput"
                :label="t('admin.oauth.create.redirect')"
                :hint="t('admin.oauth.create.redirectHint')"
                placeholder="https://example.com/callback"
                required
                :error="formData.redirect_uris.length === 0 ? t('admin.oauth.create.redirectRequired') : ''"
                @blur="updateRedirectUris"
            />

            <BaseInputV2
                id="client_uri"
                v-model="formData.client_uri"
                :label="t('admin.oauth.create.homepage')"
                :hint="t('admin.oauth.create.homepageHint')"
                placeholder="https://example.com"
            />

            <BaseInputV2
                id="logo_uri"
                v-model="formData.logo_uri"
                :label="t('admin.oauth.create.logo')"
                :hint="t('admin.oauth.create.logoHint')"
                placeholder="https://example.com/logo.png"
            />

            <BaseInputV2
                id="scope"
                v-model="formData.scope"
                :label="t('admin.oauth.create.scope')"
                :hint="t('admin.oauth.create.scopeHint')"
                placeholder="openid profile email"
                required
                :error="!formData.scope.trim() ? t('admin.oauth.create.scopeRequired') : ''"
            />

            <BaseInputV2
                id="contacts"
                v-model="contactsInput"
                :label="t('admin.oauth.create.contact')"
                :hint="t('admin.oauth.create.contactHint')"
                placeholder="admin@example.com"
                @blur="updateContacts"
            />

            <CaomeiFormItem
                id="token_endpoint_auth_method"
                :label="t('admin.oauth.create.authMethod')"
                :hint="t('admin.oauth.create.authMethodHint')"
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
                :label="t('admin.oauth.create.grantTypes')"
                :hint="t('admin.oauth.create.grantTypesHint')"
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

            <CaomeiFormItem
                id="require_pkce-field"
                :hint="t('admin.oauth.create.requirePkceHint')"
            >
                <template #default>
                    <CaomeiCheckbox
                        id="require_pkce"
                        v-model="formData.require_pkce"
                        :text="t('admin.oauth.create.requirePkce')"
                    />
                </template>
            </CaomeiFormItem>

            <BaseInputV2
                id="tos_uri"
                v-model="formData.tos_uri"
                :label="t('admin.oauth.create.tos')"
                placeholder="https://example.com/terms"
            />

            <BaseInputV2
                id="policy_uri"
                v-model="formData.policy_uri"
                :label="t('admin.oauth.create.policy')"
                placeholder="https://example.com/privacy"
            />

            <div class="create-form__footer">
                <CaomeiButton
                    variant="secondary"
                    @click="visible = false"
                >
                    {{ t('admin.oauth.create.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    type="submit"
                    :loading="submitting"
                >
                    {{ isEditing ? t('admin.oauth.create.save') : t('admin.oauth.create.create') }}
                </CaomeiButton>
            </div>
        </form>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useToast } from 'caomei-ui'
import { useValidationMessage } from '@/composables/utils/use-validation-message'
import { oauthApplicationFormSchema } from '@/utils/shared/schemas'
import type { AdminOAuthApplicationRow, AdminOAuthClientCredentials } from '@/types/admin'
import { getApiErrorMessage } from '@/utils/shared/api-error'

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
const translateValidation = useValidationMessage()
const { t } = useI18n()
const submitting = ref(false)

const redirectUrlsInput = ref('')
const contactsInput = ref('')

const authMethodOptions = computed(() => [
    { label: t('admin.oauth.create.authMethods.basic'), value: 'client_secret_basic' },
    { label: t('admin.oauth.create.authMethods.post'), value: 'client_secret_post' },
    { label: t('admin.oauth.create.authMethods.none'), value: 'none' },
])

const grantTypeOptions = computed(() => [
    { label: t('admin.oauth.create.grantTypesList.code'), value: 'authorization_code' },
    { label: t('admin.oauth.create.grantTypesList.refresh'), value: 'refresh_token' },
    { label: t('admin.oauth.create.grantTypesList.implicit'), value: 'implicit', disabled: true },
    { label: t('admin.oauth.create.grantTypesList.password'), value: 'password', disabled: true },
    { label: t('admin.oauth.create.grantTypesList.clientCredentials'), value: 'client_credentials', disabled: true },
])

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
    /* 阶段 19 D69：新建默认开启 PKCE，与后端缺省值一致 */
    require_pkce: true,
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
            /* 存量客户端可能是 false，编辑时按实际值回显 */
            require_pkce: app.requirePkce ?? true,
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
        require_pkce: true,
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
            /* `validation.*` 键在边界统一翻译，避免 Toast 直接显示键名 */
            errors.push(translateValidation(issue.message))
        }
    }

    return errors
}

async function submitApplication() {
    try {
        submitting.value = true

        updateRedirectUris()
        updateContacts()

        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            toast.danger({
                title: t('admin.oauth.create.validationFailed'),
                description: validationErrors.join(t('common.listSeparator')),
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
            require_pkce: formData.value.require_pkce,
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
                title: isEditing.value ? t('admin.oauth.create.updateSuccessTitle') : t('admin.oauth.create.createSuccessTitle'),
                description: isEditing.value ? t('admin.oauth.create.updateSuccess') : t('admin.oauth.create.createSuccess'),
                duration: 3000,
            })
            visible.value = false
            if (isEditing.value) {
                emit('updated')
            } else {
                emit('created', response.data)
            }
        } else {
            throw new Error(response.message || t('admin.oauth.create.operationFailed'))
        }
    } catch (error: unknown) {
        toast.danger({
            title: isEditing.value ? t('admin.oauth.create.updateFailedTitle') : t('admin.oauth.create.createFailedTitle'),
            description: getApiErrorMessage(error, t('admin.oauth.create.operationFailed')),
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
