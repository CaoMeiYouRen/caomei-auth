<template>
    <BaseDialog
        v-model:visible="visible"
        :title="isEditing ? '编辑 SSO 提供商' : '添加 SSO 提供商'"
        width="900px"
        :show-footer="false"
        class="create-dialog"
    >
        <div class="form-header">
            <p>{{ isEditing ? '修改 SSO 提供商配置' : '配置新的 SSO 提供商，支持 OIDC 和 SAML 协议' }}</p>
        </div>

        <form @submit.prevent="submitProvider">
            <!-- 基本信息 -->
            <div class="form-section">
                <h4>基本信息</h4>

                <BaseFormGroup
                    label="协议类型"
                    for="providerType"
                    required
                >
                    <Dropdown
                        id="providerType"
                        v-model="formData.type"
                        :options="[
                            {label: 'OIDC/OAuth2', value: 'oidc'},
                            {label: 'SAML 2.0', value: 'saml'}
                        ]"
                        option-label="label"
                        option-value="value"
                        placeholder="选择协议类型"
                        :disabled="isEditing"
                        class="w-full"
                    />
                </BaseFormGroup>

                <BaseFormGroup
                    label="Provider ID"
                    for="providerId"
                    required
                >
                    <InputText
                        id="providerId"
                        v-model="formData.providerId"
                        placeholder="例如：company-sso、google-workspace"
                        :disabled="isEditing"
                        class="w-full"
                    />
                    <small class="text-muted">
                        唯一标识符，用于生成回调 URL。编辑时不可修改。
                    </small>
                </BaseFormGroup>

                <BaseInput
                    id="name"
                    v-model="formData.name"
                    label="显示名称"
                    placeholder="例如：公司 SSO、Google Workspace"
                />

                <BaseFormGroup label="描述" for="description">
                    <Textarea
                        id="description"
                        v-model="formData.description"
                        placeholder="SSO 提供商的详细描述"
                        rows="3"
                        class="w-full"
                    />
                </BaseFormGroup>

                <BaseInput
                    id="issuer"
                    v-model="formData.issuer"
                    label="发行者 URL"
                    placeholder="例如：https://accounts.google.com、https://company.okta.com"
                    required
                />

                <BaseFormGroup
                    label="域名"
                    for="domain"
                    required
                >
                    <InputText
                        id="domain"
                        v-model="formData.domain"
                        placeholder="例如：company.com、example.org"
                        class="w-full"
                    />
                    <small class="text-muted">
                        用于域名匹配，用户邮箱域名与此匹配时会使用此 SSO 提供商
                    </small>
                </BaseFormGroup>

                <BaseInput
                    id="organizationId"
                    v-model="formData.organizationId"
                    label="关联组织 ID"
                    placeholder="可选：关联到特定组织"
                />

                <div class="form-group">
                    <div class="field-checkbox">
                        <Checkbox
                            id="enabled"
                            v-model="formData.enabled"
                            binary
                        />
                        <label for="enabled">启用此 SSO 提供商</label>
                    </div>
                </div>
            </div>

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

            <div class="form-actions">
                <Button
                    type="button"
                    label="取消"
                    severity="secondary"
                    @click="visible = false"
                />
                <Button
                    type="submit"
                    :label="isEditing ? '更新' : '创建'"
                    :loading="submitting"
                />
            </div>
        </form>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { validateUrl } from '@/utils/shared/validate'
import OidcConfigForm from './oidc-config-form.vue'
import SamlConfigForm from './saml-config-form.vue'
import AttributeMappingForm from './attribute-mapping-form.vue'

const props = defineProps<{
    visible: boolean
    provider?: any
}>()

const emit = defineEmits(['update:visible', 'created', 'updated'])

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const isEditing = computed(() => !!props.provider)
const toast = useToast()
const submitting = ref(false)

// 表单数据
const formData = ref({
    type: 'oidc' as 'oidc' | 'saml',
    providerId: '',
    name: '',
    description: '',
    issuer: '',
    domain: '',
    organizationId: '',
    enabled: true,
})

// OIDC 配置
const oidcFormData = ref({
    clientId: '',
    clientSecret: '',
    discoveryEndpoint: '',
    authorizationEndpoint: '',
    tokenEndpoint: '',
    userInfoEndpoint: '',
    jwksEndpoint: '',
    scopes: ['openid', 'profile', 'email'] as string[],
    pkce: true,
})

// SAML 配置
const samlFormData = ref({
    entryPoint: '',
    certificate: '',
    signingKey: '',
    attributeConsumingServiceIndex: 0,
})

// 属性映射
const mappingFormData = ref({
    id: '',
    email: 'email',
    emailVerified: 'email_verified',
    name: '',
    firstName: '',
    lastName: '',
    image: 'picture',
})

// 监听 provider 变化，初始化表单
watch(() => props.provider, async (provider) => {
    if (provider) {
        try {
            // 从API获取最新的提供商数据
            const response: any = await $fetch(`/api/admin/sso/providers/${provider.id}`)

            if (!response?.success) {
                throw new Error('获取提供商数据失败')
            }

            const latestProvider = response.data

            formData.value = {
                type: latestProvider.type || 'oidc',
                providerId: latestProvider.providerId || '',
                name: latestProvider.name || '',
                description: latestProvider.description || '',
                issuer: latestProvider.issuer || '',
                domain: latestProvider.domain || '',
                organizationId: latestProvider.organizationId || '',
                enabled: latestProvider.enabled !== false,
            }

            // 解析配置
            if (latestProvider.type === 'oidc' && latestProvider.oidcConfig) {
                try {
                    const oidcConfig = typeof latestProvider.oidcConfig === 'string'
                        ? JSON.parse(latestProvider.oidcConfig)
                        : latestProvider.oidcConfig

                    oidcFormData.value = {
                        clientId: oidcConfig.clientId || latestProvider.clientId || '',
                        clientSecret: oidcConfig.clientSecret || latestProvider.clientSecret || '',
                        discoveryEndpoint: oidcConfig.discoveryEndpoint || latestProvider.metadataUrl || '',
                        authorizationEndpoint: oidcConfig.authorizationEndpoint || '',
                        tokenEndpoint: oidcConfig.tokenEndpoint || '',
                        userInfoEndpoint: oidcConfig.userInfoEndpoint || '',
                        jwksEndpoint: oidcConfig.jwksEndpoint || '',
                        scopes: oidcConfig.scopes || latestProvider.scopes?.split(' ') || ['openid', 'profile', 'email'],
                        pkce: oidcConfig.pkce !== false,
                    }

                    // 解析映射配置
                    if (oidcConfig.mapping) {
                        mappingFormData.value = {
                            id: oidcConfig.mapping.id || 'sub',
                            email: oidcConfig.mapping.email || 'email',
                            emailVerified: oidcConfig.mapping.emailVerified || 'email_verified',
                            name: oidcConfig.mapping.name || 'name',
                            firstName: '',
                            lastName: '',
                            image: oidcConfig.mapping.image || 'picture',
                        }
                    }
                } catch (error) {
                    console.error('解析 OIDC 配置失败:', error)
                }
            } else if (latestProvider.type === 'saml' && latestProvider.samlConfig) {
                try {
                    const samlConfig = typeof latestProvider.samlConfig === 'string'
                        ? JSON.parse(latestProvider.samlConfig)
                        : latestProvider.samlConfig

                    samlFormData.value = {
                        entryPoint: samlConfig.entryPoint || '',
                        certificate: samlConfig.certificate || '',
                        signingKey: samlConfig.signingKey || '',
                        attributeConsumingServiceIndex: samlConfig.attributeConsumingServiceIndex || 0,
                    }

                    // 解析映射配置
                    if (samlConfig.mapping) {
                        mappingFormData.value = {
                            id: samlConfig.mapping.id || 'nameID',
                            email: samlConfig.mapping.email || 'email',
                            emailVerified: '',
                            name: samlConfig.mapping.name || 'displayName',
                            firstName: samlConfig.mapping.firstName || 'givenName',
                            lastName: samlConfig.mapping.lastName || 'surname',
                            image: '',
                        }
                    }
                } catch (error) {
                    console.error('解析 SAML 配置失败:', error)
                }
            }
        } catch (error: any) {
            console.error('获取提供商编辑数据失败:', error)
            toast.add({
                severity: 'error',
                summary: '获取数据失败',
                detail: error.message || '无法获取提供商数据进行编辑',
                life: 3000,
            })
        }
    } else {
        resetForm()
    }
}, { immediate: true })

// 监听 visible 变化，关闭时重置表单（如果是创建模式）
watch(visible, (val) => {
    if (!val && !props.provider) {
        resetForm()
    }
})

function resetForm() {
    formData.value = {
        type: 'oidc',
        providerId: '',
        name: '',
        description: '',
        issuer: '',
        domain: '',
        organizationId: '',
        enabled: true,
    }

    oidcFormData.value = {
        clientId: '',
        clientSecret: '',
        discoveryEndpoint: '',
        authorizationEndpoint: '',
        tokenEndpoint: '',
        userInfoEndpoint: '',
        jwksEndpoint: '',
        scopes: ['openid', 'profile', 'email'],
        pkce: true,
    }

    samlFormData.value = {
        entryPoint: '',
        certificate: '',
        signingKey: '',
        attributeConsumingServiceIndex: 0,
    }

    mappingFormData.value = {
        id: '',
        email: 'email',
        emailVerified: 'email_verified',
        name: '',
        firstName: '',
        lastName: '',
        image: 'picture',
    }
}

// 表单验证
function validateForm(): string[] {
    const errors: string[] = []

    // 基本信息验证
    if (!formData.value.providerId.trim()) {
        errors.push('Provider ID 不能为空')
    }

    if (!formData.value.issuer.trim()) {
        errors.push('发行者 URL 不能为空')
    } else if (!validateUrl(formData.value.issuer)) {
        errors.push('发行者 URL 格式无效')
    }

    if (!formData.value.domain.trim()) {
        errors.push('域名不能为空')
    }

    // OIDC 配置验证
    if (formData.value.type === 'oidc') {
        if (!oidcFormData.value.clientId.trim()) {
            errors.push('Client ID 不能为空')
        }
        if (!oidcFormData.value.clientSecret.trim()) {
            errors.push('Client Secret 不能为空')
        }

        // 验证端点 URL
        const endpoints = [
            { field: 'discoveryEndpoint', name: 'Discovery Endpoint' },
            { field: 'authorizationEndpoint', name: 'Authorization Endpoint' },
            { field: 'tokenEndpoint', name: 'Token Endpoint' },
            { field: 'userInfoEndpoint', name: 'UserInfo Endpoint' },
            { field: 'jwksEndpoint', name: 'JWKS Endpoint' },
        ]

        for (const endpoint of endpoints) {
            const value = oidcFormData.value[endpoint.field as keyof typeof oidcFormData.value] as string
            if (value && value.trim() && !validateUrl(value)) {
                errors.push(`${endpoint.name} URL 格式无效`)
            }
        }
    }

    // SAML 配置验证
    if (formData.value.type === 'saml') {
        if (!samlFormData.value.entryPoint.trim()) {
            errors.push('SAML 入口点 URL 不能为空')
        } else if (!validateUrl(samlFormData.value.entryPoint)) {
            errors.push('SAML 入口点 URL 格式无效')
        }

        if (!samlFormData.value.certificate.trim()) {
            errors.push('X.509 证书不能为空')
        }
    }

    return errors
}

// 提交表单
async function submitProvider() {
    try {
        submitting.value = true

        // 表单验证
        const validationErrors = validateForm()
        if (validationErrors.length > 0) {
            toast.add({
                severity: 'error',
                summary: '表单验证失败',
                detail: validationErrors.join('\n'),
                life: 5000,
            })
            return
        }

        // 构建请求数据
        const payload: any = {
            type: formData.value.type,
            providerId: formData.value.providerId,
            name: formData.value.name,
            description: formData.value.description,
            issuer: formData.value.issuer,
            domain: formData.value.domain,
            organizationId: formData.value.organizationId || undefined,
            enabled: formData.value.enabled,
        }

        // 添加协议特定配置
        if (formData.value.type === 'oidc') {
            payload.oidcConfig = {
                clientId: oidcFormData.value.clientId,
                clientSecret: oidcFormData.value.clientSecret,
                discoveryEndpoint: oidcFormData.value.discoveryEndpoint || undefined,
                authorizationEndpoint: oidcFormData.value.authorizationEndpoint || undefined,
                tokenEndpoint: oidcFormData.value.tokenEndpoint || undefined,
                userInfoEndpoint: oidcFormData.value.userInfoEndpoint || undefined,
                jwksEndpoint: oidcFormData.value.jwksEndpoint || undefined,
                scopes: oidcFormData.value.scopes,
                pkce: oidcFormData.value.pkce,
                mapping: {
                    id: mappingFormData.value.id || 'sub',
                    email: mappingFormData.value.email || 'email',
                    emailVerified: mappingFormData.value.emailVerified || 'email_verified',
                    name: mappingFormData.value.name || 'name',
                    image: mappingFormData.value.image || 'picture',
                },
            }
        } else if (formData.value.type === 'saml') {
            payload.samlConfig = {
                entryPoint: samlFormData.value.entryPoint,
                certificate: samlFormData.value.certificate,
                signingKey: samlFormData.value.signingKey || undefined,
                attributeConsumingServiceIndex: samlFormData.value.attributeConsumingServiceIndex,
                mapping: {
                    id: mappingFormData.value.id || 'nameID',
                    email: mappingFormData.value.email || 'email',
                    name: mappingFormData.value.name || 'displayName',
                    firstName: mappingFormData.value.firstName || 'givenName',
                    lastName: mappingFormData.value.lastName || 'surname',
                },
            }
        }

        let response: any
        if (isEditing.value) {
            // 更新提供商 - 使用 PUT 方法
            response = await $fetch(`/api/admin/sso/providers/${props.provider.id}`, {
                method: 'PUT',
                body: payload,
            })
        } else {
            // 创建提供商 - 使用 POST 方法
            response = await $fetch('/api/admin/sso/providers', {
                method: 'POST',
                body: payload,
            })
        }

        if (!response.success) {
            throw new Error(response.message || '操作失败')
        }

        toast.add({
            severity: 'success',
            summary: isEditing.value ? '更新成功' : '创建成功',
            detail: `SSO 提供商 ${formData.value.name || formData.value.providerId} ${isEditing.value ? '更新' : '创建'}成功`,
            life: 3000,
        })

        visible.value = false
        if (isEditing.value) {
            emit('updated')
        } else {
            emit('created', response.data)
        }
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: isEditing.value ? '更新失败' : '创建失败',
            detail: error.message || '请检查网络连接或联系管理员',
            life: 5000,
        })
    } finally {
        submitting.value = false
    }
}
</script>

<style lang="scss" scoped>
.create-dialog {
    .form-header {
        margin-bottom: 2rem;

        p {
            color: #718096;
            margin: 0;
        }
    }

    .form-section {
        margin-bottom: 2rem;
        padding-bottom: 2rem;
        border-bottom: 1px solid #e2e8f0;

        &:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }

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

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 2rem;
        border-top: 1px solid #e2e8f0;
    }

    @media (width <= 768px) {
        .form-actions {
            flex-direction: column;

            :deep(.p-button) {
                width: 100%;
            }
        }
    }
}
</style>
