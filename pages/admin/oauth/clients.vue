# coding=utf-8
<template>
    <div class="admin-clients">
        <div class="clients-container">
            <div class="clients-header">
                <div class="header-content">
                    <h1 class="clients-title">
                        应用管理
                    </h1>
                    <p class="clients-subtitle">
                        管理您的 OAuth 2.0 应用，支持 RFC7591 动态客户端注册
                    </p>
                </div>
                <div class="header-actions">
                    <Button
                        label="创建应用"
                        icon="mdi mdi-plus"
                        @click="resetForm(); showCreateDialog = true"
                    />
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="clients-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="搜索应用（名称、描述、Client ID）"
                                @input="debouncedSearch"
                            />
                        </IconField>
                    </div>
                    <div class="filter-controls">
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            @click="handleRefreshApplications"
                        />
                    </div>
                </div>
            </div>

            <!-- 应用列表 -->
            <div class="clients-list">
                <DataTable
                    :key="applications.length"
                    :value="filteredApplications"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                    paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
                    :rows-per-page-options="[10, 25, 50]"
                    sortable
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                应用列表 ({{ filteredApplications.length }})
                            </div>
                        </div>
                    </template>
                    <Column field="name" header="应用名称">
                        <template #body="{data}">
                            <div class="application-info">
                                <img
                                    v-if="data.logoUri"
                                    :src="data.logoUri"
                                    :alt="data.name"
                                    class="application-logo"
                                >
                                <div class="application-details">
                                    <span class="application-name">{{ data.name }}</span>
                                    <small
                                        v-if="data.description"
                                        class="application-description"
                                    >{{ data.description }}</small>
                                </div>
                            </div>
                        </template>
                    </Column>
                    <Column field="clientId" header="Client ID">
                        <template #body="{data}">
                            <code class="client-id">{{ data.clientId }}</code>
                        </template>
                    </Column>
                    <Column field="scope" header="授权范围">
                        <template #body="{data}">
                            <div class="scope-tags">
                                <Tag
                                    v-for="scope in (data.scope || '').split(' ').filter((s: string) => s)"
                                    :key="scope"
                                    :value="scope"
                                    severity="secondary"
                                    class="scope-tag"
                                />
                            </div>
                        </template>
                    </Column>
                    <Column field="createdAt" header="创建时间">
                        <template #body="{data}">
                            {{ new Date(data.createdAt).toLocaleString() }}
                        </template>
                    </Column>
                    <Column header="操作">
                        <template #body="{data}">
                            <Button
                                icon="mdi mdi-pencil"
                                class="p-button-text"
                                @click="editApplication(data)"
                            />
                            <Button
                                icon="mdi mdi-delete"
                                class="p-button-danger p-button-text"
                                @click="deleteApplication(data)"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- 创建应用对话框 -->
        <Dialog
            v-model:visible="showCreateDialog"
            :header="editing ? '编辑应用' : '创建应用'"
            :modal="true"
            class="create-dialog"
        >
            <div class="form-header">
                <p class="form-description">
                    请填写应用的基本信息。带有 <span class="required">*</span> 的字段为必填项。
                </p>
            </div>
            <form @submit.prevent="submitApplication">
                <div class="form-group">
                    <label for="name">
                        应用名称 <span class="required">*</span>
                    </label>
                    <InputText
                        id="name"
                        v-model="formData.client_name"
                        required
                        class="w-full"
                        :invalid="!formData.client_name.trim()"
                    />
                    <small v-if="!formData.client_name.trim()" class="error-text">
                        应用名称为必填项
                    </small>
                </div>
                <div class="form-group">
                    <label for="description">应用简介</label>
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
                    <Chips
                        id="redirectURLs"
                        v-model="formData.redirect_uris"
                        separator=","
                        class="w-full"
                        :invalid="formData.redirect_uris.length === 0"
                        placeholder="https://example.com/callback"
                    />
                    <small v-if="formData.redirect_uris.length === 0" class="error-text">
                        至少需要一个重定向URL
                    </small>
                    <small v-else class="helper-text">多个URL请用逗号分隔或按回车添加</small>
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
                    <Chips
                        id="contacts"
                        v-model="formData.contacts"
                        separator=","
                        class="w-full"
                        placeholder="admin@example.com"
                    />
                    <small class="helper-text">应用管理员的联系邮箱</small>
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
                    <small class="helper-text">客户端向令牌端点进行身份验证的方法</small>
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
                            {label: '隐式模式', value: 'implicit'},
                            {label: '密码模式', value: 'password'},
                            {label: '客户端模式', value: 'client_credentials'},
                            {label: '刷新令牌', value: 'refresh_token'}
                        ]"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        display="chip"
                        :invalid="formData.grant_types.length === 0"
                    />
                    <small v-if="formData.grant_types.length === 0" class="error-text">
                        至少需要选择一种授权类型
                    </small>
                    <small v-else class="helper-text">应用支持的OAuth2授权模式</small>
                </div>
                <div class="form-group">
                    <label for="response_types">
                        响应类型 <span class="required">*</span>
                    </label>
                    <MultiSelect
                        id="response_types"
                        v-model="formData.response_types"
                        :options="[
                            {label: '授权码', value: 'code'},
                            {label: '访问令牌', value: 'token'}
                        ]"
                        option-label="label"
                        option-value="value"
                        class="w-full"
                        display="chip"
                        :invalid="formData.response_types.length === 0"
                    />
                    <small v-if="formData.response_types.length === 0" class="error-text">
                        至少需要选择一种响应类型
                    </small>
                    <small v-else class="helper-text">授权端点支持的响应类型</small>
                </div>
                <div class="form-group">
                    <label for="tos_uri">服务条款链接</label>
                    <InputText
                        id="tos_uri"
                        v-model="formData.tos_uri"
                        placeholder="https://example.com/terms"
                        class="w-full"
                    />
                    <small class="helper-text">应用服务条款页面的URL</small>
                </div>
                <div class="form-group">
                    <label for="policy_uri">隐私政策链接</label>
                    <InputText
                        id="policy_uri"
                        v-model="formData.policy_uri"
                        placeholder="https://example.com/privacy"
                        class="w-full"
                    />
                    <small class="helper-text">应用隐私政策页面的URL</small>
                </div>
                <div class="form-group">
                    <label for="software_id">软件ID</label>
                    <InputText
                        id="software_id"
                        v-model="formData.software_id"
                        placeholder="my-application"
                        class="w-full"
                    />
                    <small class="helper-text">应用的唯一软件标识符</small>
                </div>
                <div class="form-group">
                    <label for="software_version">软件版本</label>
                    <InputText
                        id="software_version"
                        v-model="formData.software_version"
                        placeholder="1.0.0"
                        class="w-full"
                    />
                    <small class="helper-text">当前应用的版本号</small>
                </div>
            </form>
            <template #footer>
                <Button
                    label="取消"
                    class="p-button-text"
                    @click="showCreateDialog = false; resetForm()"
                />
                <Button
                    :label="editing ? '保存' : '创建'"
                    :loading="submitting"
                    @click="submitApplication"
                />
            </template>
        </Dialog>

        <!-- 确认删除对话框 -->
        <Dialog
            v-model:visible="showDeleteDialog"
            header="确认删除"
            :modal="true"
            class="delete-dialog"
        >
            <p>确定要删除应用 "{{ selectedApp?.name }}" 吗？此操作无法撤销。</p>
            <template #footer>
                <Button
                    label="取消"
                    class="p-button-text"
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

        <!-- 显示应用密钥对话框 -->
        <Dialog
            v-model:visible="showSecretDialog"
            header="应用创建成功"
            :modal="true"
            :closable="false"
            class="secret-dialog"
        >
            <div class="secret-content">
                <div class="success-icon">
                    <i class="mdi mdi-check-circle" />
                </div>
                <p class="success-message">
                    应用 "{{ createdApplication?.client_name }}" 已成功创建！
                </p>
                <div class="credentials">
                    <div class="credential-item">
                        <label>Client ID</label>
                        <div class="credential-value">
                            <code>{{ createdApplication?.client_id }}</code>
                            <Button
                                icon="mdi mdi-content-copy"
                                class="p-button-sm p-button-text"
                                @click="copyToClipboard(createdApplication?.client_id)"
                            />
                        </div>
                    </div>
                    <div class="credential-item">
                        <label>Client Secret</label>
                        <div class="credential-value">
                            <code>{{ createdApplication?.client_secret }}</code>
                            <Button
                                icon="mdi mdi-content-copy"
                                class="p-button-sm p-button-text"
                                @click="copyToClipboard(createdApplication?.client_secret)"
                            />
                        </div>
                    </div>
                </div>
                <div class="warning">
                    <i class="mdi mdi-alert" />
                    <span>请务必保存这些凭据，关闭此对话框后将无法再次查看 Client Secret。</span>
                </div>
            </div>
            <template #footer>
                <Button label="我已保存" @click="showSecretDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { debounce } from 'lodash-es'
import { authClient } from '@/lib/auth-client'

definePageMeta({
    title: '应用管理 - 草梅 Auth',
    layout: 'admin',
})

const toast = useToast()

// 对话框状态
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showSecretDialog = ref(false)
const editing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const selectedApp = ref<any>(null)
const createdApplication = ref<any>(null)

// 新增搜索和筛选相关变量
const searchQuery = ref('')

// 计算属性：过滤后的应用列表
const filteredApplications = computed(() => {
    if (!searchQuery.value) {
        return applications.value
    }

    const query = searchQuery.value.toLowerCase()
    return applications.value.filter((app: any) => app.name?.toLowerCase().includes(query)
        || app.description?.toLowerCase().includes(query)
        || app.clientId?.toLowerCase().includes(query))
})

// 防抖搜索
const debouncedSearch = debounce(() => {
    // 搜索逻辑已通过计算属性实现
}, 300)

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
    grant_types: ['authorization_code'] as ('authorization_code' | 'implicit' | 'password' | 'client_credentials' | 'refresh_token' | 'urn:ietf:params:oauth:grant-type:jwt-bearer' | 'urn:ietf:params:oauth:grant-type:saml2-bearer')[],
    response_types: ['code'] as ('code' | 'token')[],
    software_id: '',
    software_version: '',
})

// 使用 useFetch 进行 SSR 优化的数据获取
const { data: applicationsResponse, pending: loading, refresh: refreshApplications } = await useFetch('/api/oauth/applications', {
    default: () => ({ success: false, data: [] }),
    transform: (response: any) => response,
})

// 响应式的应用列表
const applications = computed(() => (applicationsResponse.value?.success ? applicationsResponse.value.data : []))

// 刷新应用列表的处理函数
const handleRefreshApplications = () => {
    searchQuery.value = ''
    refreshApplications()
}

function editApplication(app: any) {
    editing.value = true
    selectedApp.value = app
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
        grant_types: app.grantTypes ? app.grantTypes.split(',') as ('authorization_code' | 'implicit' | 'password' | 'client_credentials' | 'refresh_token' | 'urn:ietf:params:oauth:grant-type:jwt-bearer' | 'urn:ietf:params:oauth:grant-type:saml2-bearer')[] : ['authorization_code'],
        response_types: app.responseTypes ? app.responseTypes.split(',') as ('code' | 'token')[] : ['code'],
        software_id: app.softwareId || '',
        software_version: app.softwareVersion || '',
    }
    showCreateDialog.value = true
}

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
    }
    editing.value = false
    selectedApp.value = null
}

function validateForm() {
    const errors = []

    if (!formData.value.client_name.trim()) {
        errors.push('应用名称不能为空')
    }

    if (formData.value.redirect_uris.length === 0) {
        errors.push('至少需要一个重定向URL')
    }

    // 验证重定向URL格式
    for (const uri of formData.value.redirect_uris) {
        try {
            new URL(uri)
        } catch {
            errors.push(`重定向URL格式无效：${uri}`)
        }
    }

    if (!formData.value.scope.trim()) {
        errors.push('授权范围不能为空')
    }

    if (formData.value.grant_types.length === 0) {
        errors.push('至少需要选择一种授权类型')
    }

    if (formData.value.response_types.length === 0) {
        errors.push('至少需要选择一种响应类型')
    }

    // 验证URL字段格式
    const urlFields = [
        { field: 'client_uri', name: '应用主页' },
        { field: 'logo_uri', name: '应用Logo' },
        { field: 'tos_uri', name: '服务条款链接' },
        { field: 'policy_uri', name: '隐私政策链接' },
    ]

    for (const { field, name } of urlFields) {
        const value = formData.value[field as keyof typeof formData.value] as string
        if (value && value.trim()) {
            try {
                new URL(value)
            } catch {
                errors.push(`${name}格式无效：${value}`)
            }
        }
    }

    // 验证邮箱格式
    for (const email of formData.value.contacts) {
        if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            errors.push(`联系邮箱格式无效：${email}`)
        }
    }

    return errors
}

async function submitApplication() {
    try {
        submitting.value = true

        // 表单验证
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

        const redirectUris = formData.value.redirect_uris
        const payload = {
            id: editing.value ? selectedApp.value.id : undefined,
            client_name: formData.value.client_name,
            description: formData.value.description,
            redirect_uris: redirectUris,
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
        }

        let data
        let error

        if (editing.value) {
            // 编辑现有应用
            const response = await $fetch('/api/oauth/applications', {
                method: 'PUT',
                body: payload,
            })
            data = response.data
            if (!response.success) {
                error = {
                    message: response.message || '更新应用失败',
                }
            }
        } else {
            // 创建新应用 - 使用自定义接口而不是 better-auth 接口
            const response = await $fetch('/api/oauth/applications', {
                method: 'POST',
                body: payload,
            })
            data = response.data
            if (!response.success) {
                error = {
                    message: response.message || '创建应用失败',
                }
            }
        }

        if (error) {
            throw new Error(error.message)
        }

        if (!editing.value && data) {
            createdApplication.value = data
            showSecretDialog.value = true
        }

        toast.add({
            severity: 'success',
            summary: '成功',
            detail: editing.value ? '应用更新成功' : '应用创建成功',
            life: 3000,
        })

        showCreateDialog.value = false
        resetForm()
        await refreshApplications()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '操作失败',
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}

function deleteApplication(app: any) {
    selectedApp.value = app
    showDeleteDialog.value = true
}

async function confirmDelete() {
    try {
        deleting.value = true

        const response = await $fetch(`/api/oauth/applications/${selectedApp.value.id}`, {
            method: 'DELETE',
        })

        if (!response.success) {
            throw new Error(response.message || '删除失败')
        }

        toast.add({
            severity: 'success',
            summary: '成功',
            detail: '应用删除成功',
            life: 3000,
        })

        showDeleteDialog.value = false
        await refreshApplications()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '删除失败',
            life: 3000,
        })
    } finally {
        deleting.value = false
    }
}

async function copyToClipboard(text: string) {
    try {
        await navigator.clipboard.writeText(text)
        toast.add({
            severity: 'success',
            summary: '已复制',
            detail: '内容已复制到剪贴板',
            life: 2000,
        })
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: '复制失败',
            detail: '无法复制到剪贴板',
            life: 2000,
        })
    }
}

function goProfile() {
    navigateTo('/profile')
}

// 移除 onMounted，因为使用 useFetch 已在 SSR 时获取数据

</script>

<style lang="scss" scoped>
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.admin-clients {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem;
}

.clients-container {
    max-width: 1400px;
    margin: 0 auto;
}

.clients-header {
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
    .clients-title {
        font-size: 2rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 0.5rem 0;
    }

    .clients-subtitle {
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

.clients-filters {
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
            min-width: unset;
        }
    }

    .filter-controls {
        display: flex;
        gap: 1rem;

        @media (max-width: 768px) {
            flex-wrap: wrap;
        }
    }
}

.clients-list {
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
            font-size: 1.2rem;
            font-weight: 600;
            color: $primary;
        }
    }

    :deep(.p-datatable) {
        .p-datatable-header {
            padding: 0;
            border: none;
        }

        .p-datatable-thead>tr>th {
            background: #f8fafc;
            color: $secondary;
            font-weight: 600;
            border-bottom: 2px solid #e2e8f0;
            padding: 1rem;
        }

        .p-datatable-tbody>tr>td {
            padding: 1rem;
            border-bottom: 1px solid #f1f5f9;
        }

        .p-datatable-tbody>tr:hover {
            background: #f8fafc;
        }
    }

    .application-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;

        .application-logo {
            width: 32px;
            height: 32px;
            border-radius: 4px;
            object-fit: cover;
            flex-shrink: 0;
        }

        .application-details {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;

            .application-name {
                font-weight: 600;
                color: $secondary;
            }

            .application-description {
                color: $secondary-light;
                font-size: 0.875rem;
            }
        }
    }

    .client-id {
        font-family: 'Courier New', monospace;
        background: #f1f5f9;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
    }

    .scope-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;

        .scope-tag {
            font-size: 0.75rem;
        }
    }
}

// 响应式优化
@media (max-width: 768px) {
    .admin-clients {
        padding: 1rem;
    }

    :deep(.p-datatable-wrapper) {
        overflow-x: auto;
    }
}

.create-dialog {
    width: 90vw;
    max-width: 800px;

    .form-group {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: $secondary;

            .required {
                color: $primary;
                margin-left: 0.25rem;
            }
        }

        .helper-text {
            display: block;
            margin-top: 0.25rem;
            color: $secondary-light;
            font-size: 0.875rem;
        }

        .error-text {
            display: block;
            margin-top: 0.25rem;
            color: $primary;
            font-size: 0.875rem;
            font-weight: 500;
        }
    }

    form {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;

        .form-group:first-child,
        .form-group:nth-child(2),
        .form-group:nth-child(3) {
            grid-column: 1 / -1;
        }
    }

    @media (max-width: 768px) {
        width: 95vw;

        form {
            grid-template-columns: 1fr;

            .form-group {
                grid-column: 1;
            }
        }
    }
}

.delete-dialog {
    .p-button-danger {
        background: $primary;
        border-color: $primary;

        &:hover {
            background: $primary-dark;
            border-color: $primary-dark;
        }
    }
}

.secret-dialog {
    width: 90vw;
    max-width: 600px;

    .secret-content {
        text-align: center;

        .success-icon {
            font-size: 3rem;
            color: #22c55e;
            margin-bottom: 1rem;
        }

        .success-message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: $secondary;
        }

        .credentials {
            background: #f8fafc;
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            text-align: left;

            .credential-item {
                margin-bottom: 1rem;

                &:last-child {
                    margin-bottom: 0;
                }

                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: $secondary;
                }

                .credential-value {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;

                    code {
                        flex: 1;
                        padding: 0.5rem;
                        background: white;
                        border: 1px solid #e2e8f0;
                        border-radius: 0.25rem;
                        font-family: 'Courier New', monospace;
                        font-size: 0.875rem;
                        word-break: break-all;
                    }
                }
            }
        }

        .warning {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 0.5rem;
            padding: 1rem;
            color: #92400e;

            i {
                font-size: 1.25rem;
                color: #f59e0b;
            }
        }
    }
}

.secret-dialog {
    width: 90vw;
    max-width: 600px;

    .secret-content {
        text-align: center;

        .success-icon {
            font-size: 3rem;
            color: var(--green-500);
            margin-bottom: 1rem;
        }

        .success-message {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            color: var(--text-color);
        }

        .credentials {
            background: var(--surface-100);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin-bottom: 1.5rem;
            text-align: left;

            .credential-item {
                margin-bottom: 1rem;

                &:last-child {
                    margin-bottom: 0;
                }

                label {
                    display: block;
                    font-weight: 500;
                    color: var(--text-color);
                    margin-bottom: 0.5rem;
                }

                .credential-value {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;

                    code {
                        flex: 1;
                        background: var(--surface-0);
                        border: 1px solid var(--surface-200);
                        border-radius: 0.25rem;
                        padding: 0.5rem;
                        font-family: 'Courier New', monospace;
                        font-size: 0.875rem;
                        word-break: break-all;
                    }
                }
            }
        }

        .warning {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--yellow-50);
            border: 1px solid var(--yellow-200);
            border-radius: 0.5rem;
            padding: 1rem;
            color: var(--yellow-800);

            i {
                font-size: 1.25rem;
                color: var(--yellow-600);
            }
        }
    }
}
</style>
