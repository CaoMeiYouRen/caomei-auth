<template>
    <div class="admin-sso">
        <div class="sso-container">
            <!-- 页面头部 -->
            <div class="sso-header">
                <div class="header-content">
                    <h1 class="sso-title">
                        SSO 提供商管理
                    </h1>
                    <p class="sso-subtitle">
                        管理单点登录（SSO）提供商，支持 OIDC 和 SAML 协议
                    </p>
                    <span class="text-muted">
                        <strong>注意：</strong>当前 SSO 实现基于 Better Auth SSO 插件，支持标准 OIDC/OAuth2 和 SAML 2.0 协议。
                        请确保提供商端配置正确的回调 URL 和授权范围。
                    </span>
                </div>
                <div class="header-actions">
                    <Button
                        label="创建提供商"
                        icon="mdi mdi-plus"
                        @click="showCreateDialog = true; resetForm()"
                    />
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="sso-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="搜索提供商名称、域名或 Provider ID..."
                                @input="debouncedSearch"
                            />
                        </IconField>
                    </div>
                    <div class="filter-controls">
                        <Dropdown
                            v-model="typeFilter"
                            :options="typeOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选类型"
                            show-clear
                        />
                        <Dropdown
                            v-model="statusFilter"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选状态"
                            show-clear
                        />
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            :loading="loading"
                            @click="handleRefreshProviders"
                        />
                    </div>
                </div>
            </div>

            <!-- SSO 提供商列表 -->
            <div class="sso-list">
                <DataTable
                    :key="providers.length"
                    :value="filteredProviders"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                    paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
                    :rows-per-page-options="[10, 25, 50]"
                    sortable
                    empty-message="暂无 SSO 提供商"
                    responsive-layout="scroll"
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                SSO 提供商列表 ({{ filteredProviders.length }})
                            </div>
                        </div>
                    </template>
                    <Column field="name" header="提供商信息">
                        <template #body="{data}">
                            <div class="provider-info">
                                <div class="provider-details">
                                    <span class="provider-name">{{ data.name || data.providerId }}</span>
                                    <small
                                        v-if="data.description"
                                        class="provider-description"
                                    >{{ data.description }}</small>
                                    <div class="provider-meta">
                                        <small class="provider-domain">
                                            <i class="mdi mdi-domain" />
                                            {{ data.domain }}
                                        </small>
                                        <small class="provider-issuer">
                                            <i class="mdi mdi-link" />
                                            {{ data.issuer }}
                                        </small>
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column field="type" header="协议类型">
                        <template #body="{data}">
                            <Badge
                                :value="data.type?.toUpperCase() || 'OIDC'"
                                :severity="data.type === 'saml' ? 'warning' : 'info'"
                            />
                        </template>
                    </Column>

                    <Column
                        field="enabled"
                        header="状态"
                        sortable
                    >
                        <template #body="{data}">
                            <Tag
                                :value="data.enabled ? '启用' : '禁用'"
                                :severity="data.enabled ? 'success' : 'danger'"
                            />
                        </template>
                    </Column>

                    <Column
                        field="createdAt"
                        header="创建时间"
                        sortable
                    >
                        <template #body="{data}">
                            <div class="date-info">
                                <div>{{ formatDateLocale(data.createdAt) }}</div>
                                <small class="text-muted">{{ formatRelativeTime(data.createdAt) }}</small>
                            </div>
                        </template>
                    </Column>

                    <Column header="操作">
                        <template #body="{data}">
                            <div class="action-buttons">
                                <Button
                                    v-tooltip="'查看详情'"
                                    icon="mdi mdi-eye"
                                    size="small"
                                    severity="info"
                                    :loading="viewLoading"
                                    @click="viewProvider(data)"
                                />
                                <Button
                                    v-tooltip="'编辑'"
                                    icon="mdi mdi-pencil"
                                    size="small"
                                    severity="warning"
                                    :loading="editLoading"
                                    @click="editProvider(data)"
                                />
                                <Button
                                    :icon="data.enabled ? 'mdi mdi-pause' : 'mdi mdi-play'"
                                    size="small"
                                    :severity="data.enabled ? 'warning' : 'success'"
                                    :v-tooltip="data.enabled ? '禁用' : '启用'"
                                    :loading="toggling"
                                    @click="toggleProviderStatus(data)"
                                />
                                <Button
                                    v-tooltip="'删除'"
                                    icon="mdi mdi-delete"
                                    size="small"
                                    severity="danger"
                                    @click="deleteProvider(data)"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- 创建/编辑 SSO 提供商对话框 -->
        <Dialog
            v-model:visible="showCreateDialog"
            :header="editing ? '编辑 SSO 提供商' : '添加 SSO 提供商'"
            class="create-dialog"
            modal
        >
            <div class="form-header">
                <p>{{ editing ? '修改 SSO 提供商配置' : '配置新的 SSO 提供商，支持 OIDC 和 SAML 协议' }}</p>
            </div>

            <form @submit.prevent="submitProvider">
                <!-- 基本信息 -->
                <div class="form-section">
                    <h4>基本信息</h4>

                    <div class="form-group">
                        <label for="providerType">协议类型 *</label>
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
                            :disabled="editing"
                        />
                    </div>

                    <div class="form-group">
                        <label for="providerId">Provider ID *</label>
                        <InputText
                            id="providerId"
                            v-model="formData.providerId"
                            placeholder="例如：company-sso、google-workspace"
                            :disabled="editing"
                        />
                        <small class="text-muted">
                            唯一标识符，用于生成回调 URL。编辑时不可修改。
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="name">显示名称</label>
                        <InputText
                            id="name"
                            v-model="formData.name"
                            placeholder="例如：公司 SSO、Google Workspace"
                        />
                    </div>

                    <div class="form-group">
                        <label for="description">描述</label>
                        <Textarea
                            id="description"
                            v-model="formData.description"
                            placeholder="SSO 提供商的详细描述"
                            rows="3"
                        />
                    </div>

                    <div class="form-group">
                        <label for="issuer">发行者 URL *</label>
                        <InputText
                            id="issuer"
                            v-model="formData.issuer"
                            placeholder="例如：https://accounts.google.com、https://company.okta.com"
                        />
                    </div>

                    <div class="form-group">
                        <label for="domain">域名 *</label>
                        <InputText
                            id="domain"
                            v-model="formData.domain"
                            placeholder="例如：company.com、example.org"
                        />
                        <small class="text-muted">
                            用于域名匹配，用户邮箱域名与此匹配时会使用此 SSO 提供商
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="organizationId">关联组织 ID</label>
                        <InputText
                            id="organizationId"
                            v-model="formData.organizationId"
                            placeholder="可选：关联到特定组织"
                        />
                    </div>

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
                <div v-if="formData.type === 'oidc'" class="form-section">
                    <h4>OIDC 配置</h4>

                    <div class="form-group">
                        <label for="clientId">Client ID *</label>
                        <InputText
                            id="clientId"
                            v-model="oidcFormData.clientId"
                            placeholder="在 OIDC 提供商处注册的客户端 ID"
                        />
                    </div>

                    <div class="form-group">
                        <label for="clientSecret">Client Secret *</label>
                        <Password
                            id="clientSecret"
                            v-model="oidcFormData.clientSecret"
                            placeholder="客户端密钥"
                            :feedback="false"
                            toggle-mask
                        />
                    </div>

                    <div class="form-group">
                        <label for="discoveryEndpoint">Discovery Endpoint</label>
                        <InputText
                            id="discoveryEndpoint"
                            v-model="oidcFormData.discoveryEndpoint"
                            placeholder="例如：https://accounts.google.com/.well-known/openid-configuration"
                        />
                        <small class="text-muted">
                            如果提供此 URL，其他端点将自动发现
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="authorizationEndpoint">Authorization Endpoint</label>
                        <InputText
                            id="authorizationEndpoint"
                            v-model="oidcFormData.authorizationEndpoint"
                            placeholder="授权端点 URL"
                        />
                    </div>

                    <div class="form-group">
                        <label for="tokenEndpoint">Token Endpoint</label>
                        <InputText
                            id="tokenEndpoint"
                            v-model="oidcFormData.tokenEndpoint"
                            placeholder="令牌端点 URL"
                        />
                    </div>

                    <div class="form-group">
                        <label for="userInfoEndpoint">UserInfo Endpoint</label>
                        <InputText
                            id="userInfoEndpoint"
                            v-model="oidcFormData.userInfoEndpoint"
                            placeholder="用户信息端点 URL"
                        />
                    </div>

                    <div class="form-group">
                        <label for="jwksEndpoint">JWKS Endpoint</label>
                        <InputText
                            id="jwksEndpoint"
                            v-model="oidcFormData.jwksEndpoint"
                            placeholder="JSON Web Key Set 端点 URL"
                        />
                    </div>

                    <div class="form-group">
                        <label for="scopes">作用域</label>
                        <InputText
                            id="scopes"
                            v-model="scopesInput"
                            placeholder="例如：openid profile email"
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
                                v-model="oidcFormData.pkce"
                                binary
                            />
                            <label for="pkce">启用 PKCE</label>
                        </div>
                    </div>
                </div>

                <!-- SAML 配置 -->
                <div v-if="formData.type === 'saml'" class="form-section">
                    <h4>SAML 配置</h4>

                    <div class="form-group">
                        <label for="entryPoint">入口点 URL *</label>
                        <InputText
                            id="entryPoint"
                            v-model="samlFormData.entryPoint"
                            placeholder="SAML IdP 的 SSO 入口点 URL"
                        />
                    </div>

                    <div class="form-group">
                        <label for="certificate">X.509 证书 *</label>
                        <Textarea
                            id="certificate"
                            v-model="samlFormData.certificate"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;...&#10;-----END CERTIFICATE-----"
                            rows="8"
                        />
                        <small class="text-muted">
                            IdP 的 X.509 证书，用于验证 SAML 响应签名
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="signingKey">签名私钥</label>
                        <Textarea
                            id="signingKey"
                            v-model="samlFormData.signingKey"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                            rows="8"
                        />
                        <small class="text-muted">
                            可选：用于签名 SAML 请求的私钥
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="attributeConsumingServiceIndex">属性消费服务索引</label>
                        <InputNumber
                            id="attributeConsumingServiceIndex"
                            v-model="samlFormData.attributeConsumingServiceIndex"
                            placeholder="0"
                        />
                    </div>
                </div>

                <!-- 属性映射 -->
                <div class="form-section">
                    <h4>属性映射</h4>
                    <p class="text-muted">
                        配置如何将 SSO 提供商的属性映射到本地用户字段
                    </p>

                    <div class="form-group">
                        <label for="mappingId">用户 ID 字段</label>
                        <InputText
                            id="mappingId"
                            v-model="mappingFormData.id"
                            :placeholder="formData.type === 'saml' ? 'nameID' : 'sub'"
                        />
                    </div>

                    <div class="form-group">
                        <label for="mappingEmail">邮箱字段</label>
                        <InputText
                            id="mappingEmail"
                            v-model="mappingFormData.email"
                            placeholder="email"
                        />
                    </div>

                    <div class="form-group">
                        <label for="mappingName">姓名字段</label>
                        <InputText
                            id="mappingName"
                            v-model="mappingFormData.name"
                            :placeholder="formData.type === 'saml' ? 'displayName' : 'name'"
                        />
                    </div>

                    <div v-if="formData.type === 'saml'" class="form-group">
                        <label for="mappingFirstName">名字字段</label>
                        <InputText
                            id="mappingFirstName"
                            v-model="mappingFormData.firstName"
                            placeholder="givenName"
                        />
                    </div>

                    <div v-if="formData.type === 'saml'" class="form-group">
                        <label for="mappingLastName">姓氏字段</label>
                        <InputText
                            id="mappingLastName"
                            v-model="mappingFormData.lastName"
                            placeholder="surname"
                        />
                    </div>

                    <div class="form-group">
                        <label for="mappingEmailVerified">邮箱验证字段</label>
                        <InputText
                            id="mappingEmailVerified"
                            v-model="mappingFormData.emailVerified"
                            placeholder="email_verified"
                        />
                    </div>

                    <div class="form-group">
                        <label for="mappingImage">头像字段</label>
                        <InputText
                            id="mappingImage"
                            v-model="mappingFormData.image"
                            placeholder="picture"
                        />
                    </div>
                </div>

                <div class="form-actions">
                    <Button
                        type="button"
                        label="取消"
                        severity="secondary"
                        @click="showCreateDialog = false; resetForm()"
                    />
                    <Button
                        type="submit"
                        :label="editing ? '更新' : '创建'"
                        :loading="submitting"
                    />
                </div>
            </form>
        </Dialog>

        <!-- 查看提供商详情对话框 -->
        <Dialog
            v-model:visible="showViewDialog"
            header="SSO 提供商详情"
            class="view-dialog"
            modal
        >
            <div v-if="selectedProvider" class="view-content">
                <div class="detail-section">
                    <h4>基本信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">Provider ID:</span>
                            <code>{{ selectedProvider.providerId }}</code>
                        </div>
                        <div class="detail-item">
                            <span class="label">协议类型:</span>
                            <Badge
                                :value="selectedProvider.type?.toUpperCase() || 'OIDC'"
                                :severity="selectedProvider.type === 'saml' ? 'warning' : 'info'"
                            />
                        </div>
                        <div class="detail-item">
                            <span class="label">显示名称:</span>
                            <span>{{ selectedProvider.name || selectedProvider.providerId }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">域名:</span>
                            <span>{{ selectedProvider.domain }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">发行者:</span>
                            <span>{{ selectedProvider.issuer }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">状态:</span>
                            <Tag
                                :value="selectedProvider.enabled ? '启用' : '禁用'"
                                :severity="selectedProvider.enabled ? 'success' : 'danger'"
                            />
                        </div>
                        <div v-if="selectedProvider.organizationId" class="detail-item">
                            <span class="label">关联组织:</span>
                            <span>{{ selectedProvider.organizationId }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="selectedProvider.description" class="detail-section">
                    <h4>描述</h4>
                    <p>{{ selectedProvider.description }}</p>
                </div>

                <div class="detail-section">
                    <h4>回调 URL</h4>
                    <div class="callback-urls">
                        <div class="url-item">
                            <span class="label">{{ selectedProvider.type === 'saml' ? 'SAML 回调:' : 'OIDC 回调:' }}</span>
                            <div class="url-copy">
                                <code>{{ getCallbackUrl(selectedProvider) }}</code>
                                <Button
                                    v-tooltip="'复制'"
                                    icon="mdi mdi-content-copy"
                                    size="small"
                                    severity="secondary"
                                    @click="copyToClipboard(getCallbackUrl(selectedProvider))"
                                />
                            </div>
                        </div>
                        <div v-if="selectedProvider.type === 'saml'" class="url-item">
                            <span class="label">SP 元数据:</span>
                            <div class="url-copy">
                                <code>{{ getMetadataUrl(selectedProvider) }}</code>
                                <Button
                                    v-tooltip="'复制'"
                                    icon="mdi mdi-content-copy"
                                    size="small"
                                    severity="secondary"
                                    @click="copyToClipboard(getMetadataUrl(selectedProvider))"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h4>时间信息</h4>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <span class="label">创建时间:</span>
                            <span>{{ formatDateLocale(selectedProvider.createdAt) }}</span>
                        </div>
                        <div class="detail-item">
                            <span class="label">更新时间:</span>
                            <span>{{ formatDateLocale(selectedProvider.updatedAt) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </Dialog>

        <!-- 确认删除对话框 -->
        <Dialog
            v-model:visible="showDeleteDialog"
            header="确认删除"
            class="delete-dialog"
            modal
        >
            <div v-if="selectedProvider">
                <p>确定要删除 SSO 提供商 <strong>{{ selectedProvider.name || selectedProvider.providerId }}</strong> 吗？</p>
                <p class="text-danger">
                    此操作不可撤销，删除后用户将无法通过此提供商进行 SSO 登录。
                </p>
            </div>

            <template #footer>
                <Button
                    label="取消"
                    severity="secondary"
                    @click="showDeleteDialog = false"
                />
                <Button
                    label="删除"
                    severity="danger"
                    :loading="deleting"
                    @click="confirmDelete"
                />
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { debounce } from 'lodash-es'
import { validateUrl } from '@/utils/validate'
import { formatDateLocale } from '@/utils/date'

definePageMeta({
    title: 'SSO 提供商管理 - 草梅 Auth',
    layout: 'admin',
})

// 设置页面 SEO
useHead({
    title: 'SSO 提供商管理',
    meta: [
        {
            name: 'description',
            content: '管理单点登录（SSO）提供商，支持 OIDC 和 SAML 协议的配置和管理',
        },
        {
            name: 'keywords',
            content: 'SSO,单点登录,OIDC,SAML,身份验证,提供商管理',
        },
    ],
})

const toast = useToast()

// 对话框状态
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showViewDialog = ref(false)
const editing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const toggling = ref(false)
const viewLoading = ref(false)
const editLoading = ref(false)
const selectedProvider = ref<any>(null)

// 搜索和筛选
const searchQuery = ref('')
const typeFilter = ref('')
const statusFilter = ref('')

// 筛选选项
const typeOptions = [
    { label: 'OIDC/OAuth2', value: 'oidc' },
    { label: 'SAML 2.0', value: 'saml' },
]

const statusOptions = [
    { label: '启用', value: true },
    { label: '禁用', value: false },
]

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

// 作用域输入框
const scopesInput = ref('openid profile email')

// 更新作用域
function updateScopes() {
    oidcFormData.value.scopes = scopesInput.value
        .split(' ')
        .map((s) => s.trim())
        .filter((s) => s)
}

// 从配置获取基础 URL
const config = useRuntimeConfig().public
const authBaseUrl = computed(() => {
    if (config.authBaseUrl) {
        return config.authBaseUrl
    }
    if (import.meta.client && window.location) {
        return `${window.location.protocol}//${window.location.host}`
    }
    return 'https://example.com'
})

// 生成回调 URL
function getCallbackUrl(provider: any) {
    if (provider.type === 'saml') {
        return `${authBaseUrl.value}/api/auth/sso/saml2/callback/${provider.providerId}`
    }
    return `${authBaseUrl.value}/api/auth/sso/callback/${provider.providerId}`
}

// 生成元数据 URL（仅 SAML）
function getMetadataUrl(provider: any) {
    return `${authBaseUrl.value}/api/auth/sso/saml2/sp/metadata?providerId=${provider.providerId}`
}

// 使用 useFetch 进行 SSR 优化的数据获取
const { data: providersResponse, pending: loading, refresh: refreshProviders, error: fetchError } = await useFetch('/api/admin/sso/providers', {
    default: () => ({ success: false, data: [] }),
    server: true, // 确保在服务端执行
    key: 'sso-providers', // 缓存键
    transform: (response: any) => response,
    onResponseError({ response }) {
        console.error('[SSO Providers] Fetch error:', response.status, response.statusText)
    },
})

// 响应式的提供商列表
const providers = computed(() => (providersResponse.value?.success ? providersResponse.value.data : []))

// 监听获取错误
watch(fetchError, (error) => {
    if (error) {
        console.error('[SSO Providers] Data fetch error:', error)
        toast.add({
            severity: 'error',
            summary: '数据加载失败',
            detail: '无法获取SSO提供商列表，请刷新页面重试',
            life: 5000,
        })
    }
}, { immediate: true })

// 计算属性：过滤后的提供商列表
const filteredProviders = computed(() => {
    let result = [...providers.value]

    // 搜索过滤
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        result = result.filter((provider: any) => provider.name?.toLowerCase().includes(query) ||
            provider.providerId?.toLowerCase().includes(query) ||
            provider.domain?.toLowerCase().includes(query) ||
            provider.issuer?.toLowerCase().includes(query),
        )
    }

    // 类型过滤
    if (typeFilter.value) {
        result = result.filter((provider: any) => provider.type === typeFilter.value)
    }

    // 状态过滤
    if (statusFilter.value !== '' && statusFilter.value !== null) {
        result = result.filter((provider: any) => provider.enabled === statusFilter.value)
    }

    return result
})

// 防抖搜索
const debouncedSearch = debounce(() => {
    // 搜索逻辑已通过计算属性实现
}, 300)

// 刷新提供商列表的处理函数
const handleRefreshProviders = async () => {
    try {
        searchQuery.value = ''
        typeFilter.value = ''
        statusFilter.value = ''
        await refreshProviders()

        toast.add({
            severity: 'success',
            summary: '刷新成功',
            detail: 'SSO提供商列表已刷新',
            life: 2000,
        })
    } catch (error: any) {
        console.error('刷新提供商列表失败:', error)
        toast.add({
            severity: 'error',
            summary: '刷新失败',
            detail: '无法刷新提供商列表，请检查网络连接',
            life: 3000,
        })
    }
}

// 重置表单
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

    scopesInput.value = 'openid profile email'
    editing.value = false
    selectedProvider.value = null
}

// 编辑提供商
async function editProvider(provider: any) {
    try {
        editLoading.value = true
        editing.value = true
        selectedProvider.value = provider

        // 从API获取最新的提供商数据
        const response = await $fetch(`/api/admin/sso/providers/${provider.id}`)

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

                scopesInput.value = oidcFormData.value.scopes.join(' ')

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

        showCreateDialog.value = true
    } catch (error: any) {
        console.error('获取提供商编辑数据失败:', error)
        toast.add({
            severity: 'error',
            summary: '获取数据失败',
            detail: error.message || '无法获取提供商数据进行编辑',
            life: 3000,
        })
    } finally {
        editLoading.value = false
    }
}

// 表单验证
function validateForm() {
    const errors = []

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
            updateScopes() // 确保作用域是最新的

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

        let response
        if (editing.value) {
            // 更新提供商 - 使用 PUT 方法
            response = await $fetch(`/api/admin/sso/providers/${selectedProvider.value.id}`, {
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
            summary: editing.value ? '更新成功' : '创建成功',
            detail: `SSO 提供商 ${formData.value.name || formData.value.providerId} ${editing.value ? '更新' : '创建'}成功`,
            life: 3000,
        })

        showCreateDialog.value = false
        resetForm()
        await refreshProviders()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: editing.value ? '更新失败' : '创建失败',
            detail: error.message || '请检查网络连接或联系管理员',
            life: 5000,
        })
    } finally {
        submitting.value = false
    }
}

// 查看提供商详情
async function viewProvider(provider: any) {
    try {
        viewLoading.value = true
        selectedProvider.value = null

        // 使用新的API获取详细信息
        const response = await $fetch(`/api/admin/sso/providers/${provider.id}`)

        if (response?.success) {
            selectedProvider.value = response.data
            showViewDialog.value = true
        } else {
            throw new Error('获取提供商详情失败')
        }
    } catch (error: any) {
        console.error('获取提供商详情失败:', error)
        toast.add({
            severity: 'error',
            summary: '获取详情失败',
            detail: error.message || '无法获取提供商详细信息',
            life: 3000,
        })
    } finally {
        viewLoading.value = false
    }
}

// 删除提供商
function deleteProvider(provider: any) {
    selectedProvider.value = provider
    showDeleteDialog.value = true
}

// 确认删除
async function confirmDelete() {
    if (!selectedProvider.value) {
        return
    }

    try {
        deleting.value = true

        const response = await $fetch(`/api/admin/sso/providers/${selectedProvider.value.id}`, {
            method: 'DELETE',
        })

        if (!response.success) {
            throw new Error(response.message || '删除失败')
        }

        toast.add({
            severity: 'success',
            summary: '删除成功',
            detail: `SSO 提供商 ${selectedProvider.value.name || selectedProvider.value.providerId} 已删除`,
            life: 3000,
        })

        showDeleteDialog.value = false
        selectedProvider.value = null
        await refreshProviders()
    } catch (error: any) {
        console.error('删除 SSO 提供商失败:', error)
        toast.add({
            severity: 'error',
            summary: '删除失败',
            detail: error.message || '请检查网络连接或联系管理员',
            life: 5000,
        })
    } finally {
        deleting.value = false
    }
}

// 切换提供商状态
async function toggleProviderStatus(provider: any) {
    if (!provider) {
        return
    }

    try {
        toggling.value = true

        const response = await $fetch(`/api/admin/sso/providers/${provider.id}`, {
            method: 'PUT',
            body: { enabled: !provider.enabled },
        })

        if (!response.success) {
            throw new Error(response.message || '状态更新失败')
        }

        toast.add({
            severity: 'success',
            summary: '状态更新成功',
            detail: `SSO 提供商已${!provider.enabled ? '启用' : '禁用'}`,
            life: 3000,
        })

        await refreshProviders()
    } catch (error: any) {
        console.error('切换提供商状态失败:', error)
        toast.add({
            severity: 'error',
            summary: '状态更新失败',
            detail: error.message || '请检查网络连接或联系管理员',
            life: 3000,
        })
    } finally {
        toggling.value = false
    }
}

// 复制到剪贴板
async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({
            severity: 'success',
            summary: '复制成功',
            detail: '已复制到剪贴板',
            life: 2000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '复制失败',
            detail: '无法访问剪贴板',
            life: 2000,
        })
    }
}

// 格式化相对时间
function formatRelativeTime(date: string | Date) {
    if (!date) {
return ''
}
    const now = new Date()
    const target = new Date(date)
    const diff = now.getTime() - target.getTime()

    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) {
return '刚刚'
}
    if (minutes < 60) {
return `${minutes}分钟前`
}
    if (hours < 24) {
return `${hours}小时前`
}
    if (days < 30) {
return `${days}天前`
}
    return ''
}
</script>

<style lang="scss" scoped>
@use "sass:color";
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.admin-sso {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem;
}

.sso-container {
    max-width: 1400px;
    margin: 0 auto;
}

.sso-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 2rem;
    background: white;
    padding: 2rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }
}

.header-content {
    .sso-title {
        font-size: 2rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 0.5rem 0;
    }

    .sso-subtitle {
        color: $secondary-light;
        margin: 0;
        font-size: 1.1rem;
    }
}

.header-actions {
    display: flex;
    gap: 1rem;

    @media (max-width: 768px) {
        width: 100%;

        :deep(.p-button) {
            flex: 1;
        }
    }
}

.sso-filters {
    background: white;
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    margin-bottom: 1.5rem;

    .filter-row {
        display: flex;
        gap: 1rem;
        align-items: center;

        @media (max-width: 768px) {
            flex-direction: column;
            align-items: stretch;
        }
    }

    .search-wrapper {
        flex: 1;
        min-width: 300px;

        @media (max-width: 768px) {
            min-width: auto;
        }
    }

    .filter-controls {
        display: flex;
        gap: 1rem;

        @media (max-width: 768px) {
            flex-direction: column;
        }
    }
}

.sso-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e2e8f0;

        .table-title {
            font-size: 1.25rem;
            font-weight: 600;
            color: $secondary;
            margin: 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }

    :deep(.p-datatable) {
        .p-datatable-header {
            display: none;
        }

        .p-datatable-thead>tr>th {
            background: $background;
            border-bottom: 2px solid #e2e8f0;
            color: $secondary;
            font-weight: 600;
            padding: 1rem;
        }

        .p-datatable-tbody>tr>td {
            padding: 1rem;
            border-bottom: 1px solid #e2e8f0;
        }

        .p-datatable-tbody>tr:hover {
            background: $background;
        }
    }

    .provider-id {
        display: flex;
        align-items: center;
        gap: 0.5rem;

        code {
            background: $background;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
        }
    }

    .provider-info {
        .provider-name {
            font-weight: 600;
            color: $secondary;
            margin-bottom: 0.25rem;
        }

        .provider-domain,
        .provider-issuer {
            display: flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            color: $secondary-light;
            margin-bottom: 0.125rem;

            i {
                width: 16px;
            }
        }
    }

    .date-info {
        small {
            display: block;
            color: $secondary-light;
        }
    }

    .action-buttons {
        display: flex;
        gap: 0.5rem;

        :deep(.p-button) {
            width: 32px;
            height: 32px;
        }
    }
}

// 响应式优化
@media (max-width: 768px) {
    .admin-sso {
        padding: 1rem;
    }

    :deep(.p-datatable-wrapper) {
        overflow-x: auto;
    }
}

.create-dialog {
    width: 90vw;
    max-width: 900px;

    .form-header {
        margin-bottom: 2rem;

        p {
            color: $secondary-light;
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
            color: $primary;
            margin: 0 0 1rem 0;
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
            color: $secondary;
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

    @media (max-width: 768px) {
        width: 95vw;

        .form-actions {
            flex-direction: column;

            :deep(.p-button) {
                width: 100%;
            }
        }
    }
}

.view-dialog {
    width: 90vw;
    max-width: 800px;

    .view-content {
        .detail-section {
            margin-bottom: 2rem;
            padding-bottom: 1.5rem;
            border-bottom: 1px solid #e2e8f0;

            &:last-child {
                border-bottom: none;
                margin-bottom: 0;
                padding-bottom: 0;
            }

            h4 {
                color: $primary;
                margin: 0 0 1rem 0;
                font-size: 1.125rem;
                font-weight: 600;
            }
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
        }

        .detail-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .label {
                font-weight: 500;
                color: $secondary-light;
                font-size: 0.875rem;
            }

            code {
                background: $background;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-size: 0.875rem;
                word-break: break-all;
            }
        }

        .callback-urls {
            .url-item {
                margin-bottom: 1rem;

                .label {
                    display: block;
                    font-weight: 500;
                    color: $secondary-light;
                    font-size: 0.875rem;
                    margin-bottom: 0.5rem;
                }

                .url-copy {
                    display: flex;
                    gap: 0.5rem;
                    align-items: flex-start;

                    code {
                        flex: 1;
                        background: $background;
                        padding: 0.75rem;
                        border-radius: 4px;
                        font-size: 0.875rem;
                        word-break: break-all;
                        line-height: 1.4;
                    }
                }
            }
        }
    }

    @media (max-width: 768px) {
        width: 95vw;

        .detail-grid {
            grid-template-columns: 1fr;
        }

        .url-copy {
            flex-direction: column;
            gap: 0.5rem;
        }
    }
}

.delete-dialog {
    .text-danger {
        color: $error;
        font-weight: 500;
    }

    :deep(.p-button-danger) {
        background: $error;
        border-color: $error;

        &:hover {
            background: color.scale($error, $lightness: -10%);
            border-color: color.scale($error, $lightness: -10%);
        }
    }
}

.text-muted {
    color: $secondary-light;
    font-size: 0.875rem;
    margin-top: 0.5rem;
}
</style>
