<template>
    <Dialog
        v-model:visible="visible"
        :header="isEditing ? '编辑应用' : '创建新应用'"
        :modal="true"
        class="create-app-dialog"
        :style="{width: '600px'}"
    >
        <div class="create-form">
            <div class="form-group">
                <label for="client_name">
                    应用名称 <span class="required">*</span>
                </label>
                <InputText
                    id="client_name"
                    v-model="formData.client_name"
                    class="w-full"
                    :invalid="!formData.client_name.trim()"
                    placeholder="例如：我的博客应用"
                />
                <small v-if="!formData.client_name.trim()" class="error-text">
                    应用名称为必填项
                </small>
            </div>
            <div class="form-group">
                <label for="description">应用描述</label>
                <Textarea
                    id="description"
                    v-model="formData.description"
                    rows="3"
                    class="w-full"
                    placeholder="简要描述您的应用功能和用途"
                />
            </div>
            <div class="form-group">
                <label for="redirectURLs">
                    重定向 URL <span class="required">*</span>
                </label>
                <InputText
                    id="redirectURLs"
                    v-model="redirectUrlsInput"
                    class="w-full"
                    :invalid="formData.redirect_uris.length === 0"
                    placeholder="https://example.com/callback"
                    @blur="updateRedirectUris"
                />
                <small v-if="formData.redirect_uris.length === 0" class="error-text">
                    至少需要一个重定向URL
                </small>
                <small v-else class="helper-text">多个URL请用逗号分隔</small>
            </div>
            <div class="form-group">
                <label for="client_uri">应用主页</label>
                <InputText
                    id="client_uri"
                    v-model="formData.client_uri"
                    placeholder="https://example.com"
                    class="w-full"
                />
                <small class="helper-text">应用的官方网站地址</small>
            </div>
            <div class="form-group">
                <label for="logo_uri">应用Logo</label>
                <InputText
                    id="logo_uri"
                    v-model="formData.logo_uri"
                    placeholder="https://example.com/logo.png"
                    class="w-full"
                />
                <small class="helper-text">应用图标的URL地址</small>
            </div>
            <div class="form-group">
                <label for="scope">
                    授权范围 <span class="required">*</span>
                </label>
                <InputText
                    id="scope"
                    v-model="formData.scope"
                    placeholder="openid profile email"
                    class="w-full"
                    :invalid="!formData.scope.trim()"
                />
                <small v-if="!formData.scope.trim()" class="error-text">
                    授权范围为必填项
                </small>
                <small v-else class="helper-text">多个范围用空格分隔，如：openid profile email</small>
            </div>
            <div class="form-group">
                <label for="contacts">联系邮箱</label>
                <InputText
                    id="contacts"
                    v-model="contactsInput"
                    class="w-full"
                    placeholder="admin@example.com"
                    @blur="updateContacts"
                />
                <small class="helper-text">应用管理员的联系邮箱，多个邮箱请用逗号分隔</small>
            </div>
            <div class="form-group">
                <label for="token_endpoint_auth_method">
                    认证方式 <span class="required">*</span>
                </label>
                <Dropdown
                    id="token_endpoint_auth_method"
                    v-model="formData.token_endpoint_auth_method"
                    :options="[
                        {label: 'Basic认证 (推荐)', value: 'client_secret_basic'},
                        {label: 'POST认证', value: 'client_secret_post'},
                        {label: '无认证 (仅公开客户端)', value: 'none'}
                    ]"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                />
                <small class="helper-text">客户端向令牌端点进行身份验证的方法（支持 OIDC 标准方法）</small>
            </div>
            <div class="form-group">
                <label for="grant_types">
                    授权类型 <span class="required">*</span>
                </label>
                <MultiSelect
                    id="grant_types"
                    v-model="formData.grant_types"
                    :options="[
                        {label: '授权码模式 (推荐)', value: 'authorization_code'},
                        {label: '刷新令牌', value: 'refresh_token'},
                        {label: '隐式模式 (不支持)', value: 'implicit', disabled: true},
                        {label: '密码模式 (不支持)', value: 'password', disabled: true},
                        {label: '客户端模式 (不支持)', value: 'client_credentials', disabled: true}
                    ]"
                    option-label="label"
                    option-value="value"
                    class="w-full"
                    display="chip"
                />
                <small class="helper-text">应用允许使用的 OAuth 2.0 授权类型</small>
            </div>
            <div class="form-group">
                <label for="tos_uri">服务条款链接</label>
                <InputText
                    id="tos_uri"
                    v-model="formData.tos_uri"
                    placeholder="https://example.com/terms"
                    class="w-full"
                />
            </div>
            <div class="form-group">
                <label for="policy_uri">隐私政策链接</label>
                <InputText
                    id="policy_uri"
                    v-model="formData.policy_uri"
                    placeholder="https://example.com/privacy"
                    class="w-full"
                />
            </div>
        </div>
        <template #footer>
            <Button
                label="取消"
                class="p-button-text"
                @click="visible = false"
            />
            <Button
                :label="isEditing ? '保存修改' : '创建应用'"
                :loading="submitting"
                @click="submitApplication"
            />
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { validateEmail, validateUrl } from '@/utils/validate'

const props = defineProps<{
    visible: boolean
    application?: any
}>()

const emit = defineEmits(['update:visible', 'created', 'updated'])

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const isEditing = computed(() => !!props.application)
const toast = useToast()
const submitting = ref(false)

const redirectUrlsInput = ref('')
const contactsInput = ref('')

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
            token_endpoint_auth_method: app.tokenEndpointAuthMethod || 'client_secret_basic',
            grant_types: app.grantTypes ? app.grantTypes.split(',').filter((type: string) => ['authorization_code', 'refresh_token'].includes(type)) as ('authorization_code' | 'refresh_token')[] : ['authorization_code'],
            response_types: app.responseTypes ? app.responseTypes.split(',').filter((type: string) => type === 'code') as ('code')[] : ['code'],
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

function validateForm() {
    const errors: string[] = []

    if (!formData.value.client_name.trim()) {
        errors.push('应用名称不能为空')
    }

    if (formData.value.redirect_uris.length === 0) {
        errors.push('至少需要一个重定向URL')
    }

    for (const uri of formData.value.redirect_uris) {
        if (!validateUrl(uri)) {
            errors.push(`重定向URL格式无效：${uri}`)
        }
    }

    if (!formData.value.scope.trim()) {
        errors.push('授权范围不能为空')
    }

    if (formData.value.grant_types.length === 0) {
        errors.push('至少需要选择一种授权类型')
    }

    const supportedGrantTypes = ['authorization_code', 'refresh_token']
    const unsupportedGrants = formData.value.grant_types.filter((type) => !supportedGrantTypes.includes(type))
    if (unsupportedGrants.length > 0) {
        errors.push(`不支持的授权类型：${unsupportedGrants.join(', ')}`)
    }

    if (formData.value.response_types.length === 0) {
        errors.push('至少需要选择一种响应类型')
    }

    const supportedResponseTypes = ['code']
    const unsupportedResponses = formData.value.response_types.filter((type) => !supportedResponseTypes.includes(type))
    if (unsupportedResponses.length > 0) {
        errors.push(`不支持的响应类型：${unsupportedResponses.join(', ')}`)
    }

    const urlFields = [
        { field: 'client_uri', name: '应用主页' },
        { field: 'logo_uri', name: '应用Logo' },
        { field: 'tos_uri', name: '服务条款链接' },
        { field: 'policy_uri', name: '隐私政策链接' },
    ]

    for (const { field, name } of urlFields) {
        const value = formData.value[field as keyof typeof formData.value] as string
        if (value && value.trim()) {
            if (!validateUrl(value)) {
                errors.push(`${name}格式无效：${value}`)
            }
        }
    }

    for (const email of formData.value.contacts) {
        if (email && !validateEmail(email)) {
            errors.push(`联系邮箱格式无效：${email}`)
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
            toast.add({
                severity: 'error',
                summary: '表单验证失败',
                detail: validationErrors.join('；'),
                life: 5000,
            })
            return
        }

        const payload = {
            id: isEditing.value ? props.application.id : undefined,
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
            ? `/api/admin/oauth/applications/${props.application.id}`
            : '/api/admin/oauth/applications'
        const method = isEditing.value ? 'PUT' : 'POST'

        const response: any = await $fetch(url, {
            method,
            body: payload,
        })

        if (response.success) {
            toast.add({
                severity: 'success',
                summary: isEditing.value ? '更新成功' : '创建成功',
                detail: isEditing.value ? '应用信息已更新' : '应用已成功创建',
                life: 3000,
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
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: isEditing.value ? '更新失败' : '创建失败',
            detail: error.message || '操作失败',
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.create-form {
    padding: 1rem 0;

    .form-group {
        margin-bottom: 1.5rem;

        label {
            display: block;
            font-weight: 600;
            color: #4a5568;
            margin-bottom: 0.5rem;

            .required {
                color: #e53e3e;
                margin-left: 0.25rem;
            }
        }

        .helper-text {
            display: block;
            color: #718096;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }

        .error-text {
            display: block;
            color: #e53e3e;
            font-size: 0.875rem;
            margin-top: 0.25rem;
        }
    }
}
</style>
