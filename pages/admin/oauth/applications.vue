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
                    <span class="text-muted">
                        <strong>注意：</strong>当前 OIDC 实现基于 Better Auth，仅支持标准 OpenID Connect 核心功能。
                        不支持隐式流程、密码流程、客户端流程等非标准模式。
                    </span>
                </div>
                <div class="header-actions">
                    <Button
                        label="API 文档"
                        icon="mdi mdi-book-open-variant"
                        severity="secondary"
                        outlined
                        @click="showApiDocsDialog = true"
                    />
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
                    <Column field="disabled" header="状态">
                        <template #body="{data}">
                            <Tag
                                :value="data.disabled ? '已禁用' : '已启用'"
                                :severity="data.disabled ? 'danger' : 'success'"
                            />
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
                                v-tooltip.top="'查看详情'"
                                icon="mdi mdi-eye"
                                class="p-button-text"
                                @click="viewApplication(data)"
                            />
                            <Button
                                v-tooltip.top="'编辑'"
                                icon="mdi mdi-pencil"
                                class="p-button-text"
                                @click="editApplication(data)"
                            />
                            <Button
                                v-tooltip.top="data.disabled ? '启用应用' : '禁用应用'"
                                :icon="data.disabled ? 'mdi mdi-play' : 'mdi mdi-pause'"
                                :class="data.disabled ? 'p-button-success p-button-text' : 'p-button-warning p-button-text'"
                                @click="toggleApplicationStatus(data)"
                            />
                            <Button
                                v-tooltip.top="'删除'"
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
                <div class="oidc-notice">
                    <i class="mdi mdi-information" />
                    <span>
                        <strong>OIDC 兼容性说明：</strong>
                        当前 OIDC 提供者基于 Better Auth 实现，仅支持标准 OpenID Connect 核心功能。
                        不支持的功能已标记为"不支持"，建议使用推荐的标准配置。
                    </span>
                </div>
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
                        option-disabled="disabled"
                        class="w-full"
                        display="chip"
                        :invalid="formData.grant_types.length === 0"
                    />
                    <small v-if="formData.grant_types.length === 0" class="error-text">
                        至少需要选择一种授权类型
                    </small>
                    <small v-else class="helper-text">应用支持的OAuth2授权模式（仅支持OIDC标准模式）</small>
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
                            {label: '访问令牌 (不支持)', value: 'token', disabled: true}
                        ]"
                        option-label="label"
                        option-value="value"
                        option-disabled="disabled"
                        class="w-full"
                        display="chip"
                        :invalid="formData.response_types.length === 0"
                    />
                    <small v-if="formData.response_types.length === 0" class="error-text">
                        至少需要选择一种响应类型
                    </small>
                    <small v-else class="helper-text">授权端点支持的响应类型（仅支持授权码流程）</small>
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
                <div v-if="editing" class="form-group">
                    <label for="disabled">应用状态</label>
                    <div class="align-items-center flex gap-2">
                        <ToggleButton
                            id="disabled"
                            v-model="formData.disabled"
                            on-label="已禁用"
                            off-label="已启用"
                            on-icon="mdi mdi-pause"
                            off-icon="mdi mdi-play"
                            :class="formData.disabled ? 'p-button-danger' : 'p-button-success'"
                        />
                        <span class="text-muted">
                            {{ formData.disabled ? '应用当前已禁用，无法进行OAuth授权' : '应用当前已启用，可正常使用' }}
                        </span>
                    </div>
                    <small class="helper-text">禁用应用后，该应用将无法进行OAuth授权流程</small>
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

        <!-- 查看应用详情对话框 -->
        <Dialog
            v-model:visible="showViewDialog"
            header="应用详情"
            :modal="true"
            class="view-dialog"
        >
            <div v-if="selectedApp" class="view-content">
                <div class="app-basic-info">
                    <div class="app-header">
                        <img
                            v-if="selectedApp.logoUri"
                            :src="selectedApp.logoUri"
                            :alt="selectedApp.name"
                            class="app-logo"
                        >
                        <div class="app-details">
                            <h3 class="app-name">
                                {{ selectedApp.name }}
                            </h3>
                            <p v-if="selectedApp.description" class="app-description">
                                {{ selectedApp.description }}
                            </p>
                            <div class="app-status">
                                <Tag
                                    :value="selectedApp.disabled ? '已禁用' : '已启用'"
                                    :severity="selectedApp.disabled ? 'danger' : 'success'"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="app-info-grid">
                    <div class="info-group">
                        <h4>基本信息</h4>
                        <div class="info-item">
                            <label>Client ID</label>
                            <div class="value-with-copy">
                                <code class="client-id">{{ selectedApp.clientId }}</code>
                                <Button
                                    icon="mdi mdi-content-copy"
                                    class="p-button-sm p-button-text"
                                    @click="copyToClipboard(selectedApp.clientId)"
                                />
                            </div>
                        </div>
                        <div v-if="selectedApp.clientUri" class="info-item">
                            <label>应用主页</label>
                            <a
                                :href="selectedApp.clientUri"
                                target="_blank"
                                class="info-link"
                            >
                                {{ selectedApp.clientUri }}
                                <i class="mdi mdi-open-in-new" />
                            </a>
                        </div>
                        <div class="info-item">
                            <label>创建时间</label>
                            <span>{{ new Date(selectedApp.createdAt).toLocaleString() }}</span>
                        </div>
                        <div class="info-item">
                            <label>更新时间</label>
                            <span>{{ new Date(selectedApp.updatedAt).toLocaleString() }}</span>
                        </div>
                    </div>

                    <div class="info-group">
                        <h4>OAuth 配置</h4>
                        <div class="info-item">
                            <label>授权范围</label>
                            <div class="scope-tags">
                                <Tag
                                    v-for="scope in (selectedApp.scope || '').split(' ').filter((s: string) => s)"
                                    :key="scope"
                                    :value="scope"
                                    severity="secondary"
                                    class="scope-tag"
                                />
                            </div>
                        </div>
                        <div class="info-item">
                            <label>重定向 URLs</label>
                            <div class="url-list">
                                <div
                                    v-for="(url, index) in (selectedApp.redirectURLs || '').split(',')"
                                    :key="index"
                                    class="url-item"
                                >
                                    <code>{{ url.trim() }}</code>
                                </div>
                            </div>
                        </div>
                        <div class="info-item">
                            <label>认证方式</label>
                            <span>{{ selectedApp.tokenEndpointAuthMethod || 'client_secret_basic' }}</span>
                        </div>
                        <div class="info-item">
                            <label>授权类型</label>
                            <div class="tag-list">
                                <Tag
                                    v-for="type in (selectedApp.grantTypes || 'authorization_code').split(',')"
                                    :key="type"
                                    :value="type.trim()"
                                    severity="info"
                                />
                            </div>
                        </div>
                        <div class="info-item">
                            <label>响应类型</label>
                            <div class="tag-list">
                                <Tag
                                    v-for="type in (selectedApp.responseTypes || 'code').split(',')"
                                    :key="type"
                                    :value="type.trim()"
                                    severity="info"
                                />
                            </div>
                        </div>
                    </div>

                    <div v-if="selectedApp.contacts || selectedApp.tosUri || selectedApp.policyUri" class="info-group">
                        <h4>联系方式与政策</h4>
                        <div v-if="selectedApp.contacts" class="info-item">
                            <label>联系邮箱</label>
                            <div class="contact-list">
                                <a
                                    v-for="(email, index) in (selectedApp.contacts || '').split(',')"
                                    :key="index"
                                    :href="`mailto:${email.trim()}`"
                                    class="contact-email"
                                >
                                    {{ email.trim() }}
                                </a>
                            </div>
                        </div>
                        <div v-if="selectedApp.tosUri" class="info-item">
                            <label>服务条款</label>
                            <a
                                :href="selectedApp.tosUri"
                                target="_blank"
                                class="info-link"
                            >
                                {{ selectedApp.tosUri }}
                                <i class="mdi mdi-open-in-new" />
                            </a>
                        </div>
                        <div v-if="selectedApp.policyUri" class="info-item">
                            <label>隐私政策</label>
                            <a
                                :href="selectedApp.policyUri"
                                target="_blank"
                                class="info-link"
                            >
                                {{ selectedApp.policyUri }}
                                <i class="mdi mdi-open-in-new" />
                            </a>
                        </div>
                    </div>

                    <div v-if="selectedApp.softwareId || selectedApp.softwareVersion" class="info-group">
                        <h4>软件信息</h4>
                        <div v-if="selectedApp.softwareId" class="info-item">
                            <label>软件ID</label>
                            <span>{{ selectedApp.softwareId }}</span>
                        </div>
                        <div v-if="selectedApp.softwareVersion" class="info-item">
                            <label>软件版本</label>
                            <span>{{ selectedApp.softwareVersion }}</span>
                        </div>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button
                    label="编辑"
                    icon="mdi mdi-pencil"
                    @click="showViewDialog = false; editApplication(selectedApp)"
                />
                <Button
                    label="关闭"
                    class="p-button-text"
                    @click="showViewDialog = false"
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

        <!-- API 文档对话框 -->
        <Dialog
            v-model:visible="showApiDocsDialog"
            header="OIDC API 端点文档"
            :modal="true"
            class="api-docs-dialog"
        >
            <div class="api-docs-content">
                <Accordion :value="['0', '1', '2']" multiple>
                    <AccordionPanel value="0">
                        <AccordionHeader>
                            <i class="mdi mdi-api" />
                            <span>OpenID Connect Discovery</span>
                        </AccordionHeader>
                        <AccordionContent>
                            <p class="section-description">
                                OpenID Connect 配置端点，包含所有支持的端点和功能信息。
                            </p>
                            <div class="endpoint-group">
                                <div class="endpoint-item">
                                    <label>Discovery 端点</label>
                                    <div class="endpoint-url">
                                        <code>{{ authBaseUrl }}/api/auth/.well-known/openid-configuration</code>
                                        <Button
                                            icon="mdi mdi-content-copy"
                                            class="p-button-sm p-button-text"
                                            @click="copyToClipboard(`${authBaseUrl}/api/auth/.well-known/openid-configuration`)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="1">
                        <AccordionHeader>
                            <i class="mdi mdi-cloud-outline" />
                            <span>主要 OAuth 2.0 / OIDC 端点</span>
                        </AccordionHeader>
                        <AccordionContent>
                            <p class="section-description">
                                以下是平台提供的主要 OAuth 2.0 和 OpenID Connect 端点。
                            </p>
                            <div class="endpoint-group">
                                <div class="endpoint-item">
                                    <label>授权端点</label>
                                    <div class="endpoint-url">
                                        <code>{{ authBaseUrl }}/api/auth/oauth2/authorize</code>
                                        <Button
                                            icon="mdi mdi-content-copy"
                                            class="p-button-sm p-button-text"
                                            @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/authorize`)"
                                        />
                                    </div>
                                </div>
                                <div class="endpoint-item">
                                    <label>令牌端点</label>
                                    <div class="endpoint-url">
                                        <code>{{ authBaseUrl }}/api/auth/oauth2/token</code>
                                        <Button
                                            icon="mdi mdi-content-copy"
                                            class="p-button-sm p-button-text"
                                            @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/token`)"
                                        />
                                    </div>
                                </div>
                                <div class="endpoint-item">
                                    <label>用户信息端点</label>
                                    <div class="endpoint-url">
                                        <code>{{ authBaseUrl }}/api/auth/oauth2/userinfo</code>
                                        <Button
                                            icon="mdi mdi-content-copy"
                                            class="p-button-sm p-button-text"
                                            @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/userinfo`)"
                                        />
                                    </div>
                                </div>
                                <div class="endpoint-item">
                                    <label>JWKS 端点</label>
                                    <div class="endpoint-url">
                                        <code>{{ authBaseUrl }}/api/auth/jwks</code>
                                        <Button
                                            icon="mdi mdi-content-copy"
                                            class="p-button-sm p-button-text"
                                            @click="copyToClipboard(`${authBaseUrl}/api/auth/jwks`)"
                                        />
                                    </div>
                                </div>
                                <div class="endpoint-item">
                                    <label>动态客户端注册端点</label>
                                    <div class="endpoint-url">
                                        <code>{{ authBaseUrl }}/api/auth/oauth2/register</code>
                                        <Button
                                            icon="mdi mdi-content-copy"
                                            class="p-button-sm p-button-text"
                                            @click="copyToClipboard(`${authBaseUrl}/api/auth/oauth2/register`)"
                                        />
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>

                    <AccordionPanel value="2">
                        <AccordionHeader>
                            <i class="mdi mdi-code-json" />
                            <span>Discovery 配置示例</span>
                        </AccordionHeader>
                        <AccordionContent>
                            <p class="section-description">
                                以下是 OpenID Connect Discovery 端点返回的配置示例。
                            </p>
                            <div class="config-example">
                                <pre><code>{{ JSON.stringify(oidcConfig, null, 2) }}</code></pre>
                                <Button
                                    icon="mdi mdi-content-copy"
                                    class="copy-config-btn p-button-sm p-button-text"
                                    @click="copyToClipboard(JSON.stringify(oidcConfig, null, 2))"
                                />
                            </div>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>

                <div class="notice-section section">
                    <h3>
                        <i class="mdi mdi-information-outline" />
                        注意事项
                    </h3>
                    <div class="notice">
                        <ul>
                            <li>当前 OIDC 实现基于 Better Auth，仅支持标准 OpenID Connect 核心功能</li>
                            <li>支持授权码流程（Authorization Code Flow）和刷新令牌</li>
                            <li>不支持隐式流程、密码流程、客户端流程等非标准模式</li>
                            <li>所有端点都要求使用 HTTPS</li>
                        </ul>
                    </div>
                </div>
            </div>
            <template #footer>
                <Button label="关闭" @click="showApiDocsDialog = false" />
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { debounce } from 'lodash-es'
import { authClient } from '@/lib/auth-client'
import { validateEmail, validateUrl } from '@/utils/validate'

definePageMeta({
    title: '应用管理 - 草梅 Auth',
    layout: 'admin',
})

const toast = useToast()

// 对话框状态
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showSecretDialog = ref(false)
const showViewDialog = ref(false)
const showApiDocsDialog = ref(false)
const editing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const toggling = ref(false)
const selectedApp = ref<any>(null)
const createdApplication = ref<any>(null)

// 新增搜索和筛选相关变量
const searchQuery = ref('')

// 新增输入框变量
const redirectUrlsInput = ref('')
const contactsInput = ref('')

// 从配置获取基础 URL
const config = useRuntimeConfig().public
const authBaseUrl = computed(() => {
    // 从 Nuxt 运行时配置获取基础URL
    if (config.authBaseUrl) {
        return config.authBaseUrl
    }
    // 如果没有配置，则使用当前域名
    if (import.meta.client && window.location) {
        return `${window.location.protocol}//${window.location.host}`
    }
    return 'https://example.com' // 默认值
})

// OIDC 配置
const oidcConfig = computed(() => ({
    issuer: authBaseUrl.value,
    authorization_endpoint: `${authBaseUrl.value}/api/auth/oauth2/authorize`,
    token_endpoint: `${authBaseUrl.value}/api/auth/oauth2/token`,
    userinfo_endpoint: `${authBaseUrl.value}/api/auth/oauth2/userinfo`,
    jwks_uri: `${authBaseUrl.value}/api/auth/jwks`,
    registration_endpoint: `${authBaseUrl.value}/api/auth/oauth2/register`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    subject_types_supported: ['public'],
    id_token_signing_alg_values_supported: ['RS256'],
    scopes_supported: ['openid', 'profile', 'email'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post', 'none'],
    claims_supported: ['sub', 'name', 'email', 'email_verified', 'preferred_username', 'picture'],
}))

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

// 处理重定向URL输入框
function updateRedirectUris() {
    const urls = redirectUrlsInput.value
        .split(',')
        .map((url) => url.trim())
        .filter((url) => url)
    formData.value.redirect_uris = urls
}

// 处理联系邮箱输入框
function updateContacts() {
    const emails = contactsInput.value
        .split(',')
        .map((email) => email.trim())
        .filter((email) => email)
    formData.value.contacts = emails
}

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

// 使用 useFetch 进行 SSR 优化的数据获取
const { data: applicationsResponse, pending: loading, refresh: refreshApplications } = await useFetch('/api/admin/oauth/applications', {
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
        grant_types: app.grantTypes ? app.grantTypes.split(',').filter((type: string) => ['authorization_code', 'refresh_token'].includes(type)) as ('authorization_code' | 'refresh_token')[] : ['authorization_code'],
        response_types: app.responseTypes ? app.responseTypes.split(',').filter((type: string) => type === 'code') as ('code')[] : ['code'],
        software_id: app.softwareId || '',
        software_version: app.softwareVersion || '',
        disabled: app.disabled || false,
    }
    // 同步更新输入框的值
    redirectUrlsInput.value = formData.value.redirect_uris.join(',')
    contactsInput.value = formData.value.contacts.join(',')
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
        disabled: false,
    }
    // 重置输入框的值
    redirectUrlsInput.value = ''
    contactsInput.value = ''
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

    // 验证只支持的授权类型
    const supportedGrantTypes = ['authorization_code', 'refresh_token']
    const unsupportedGrants = formData.value.grant_types.filter((type) => !supportedGrantTypes.includes(type))
    if (unsupportedGrants.length > 0) {
        errors.push(`不支持的授权类型：${unsupportedGrants.join(', ')}`)
    }

    if (formData.value.response_types.length === 0) {
        errors.push('至少需要选择一种响应类型')
    }

    // 验证只支持的响应类型
    const supportedResponseTypes = ['code']
    const unsupportedResponses = formData.value.response_types.filter((type) => !supportedResponseTypes.includes(type))
    if (unsupportedResponses.length > 0) {
        errors.push(`不支持的响应类型：${unsupportedResponses.join(', ')}`)
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
            if (!validateUrl(value)) {
                errors.push(`${name}格式无效：${value}`)
            }
        }
    }

    // 验证邮箱格式
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

        // 先更新数组值
        updateRedirectUris()
        updateContacts()

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

        const payload = {
            id: editing.value ? selectedApp.value.id : undefined,
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

        let data
        let error

        if (editing.value) {
            // 编辑现有应用
            const response = await $fetch(`/api/admin/oauth/applications/${selectedApp.value.id}`, {
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
            const response = await $fetch('/api/admin/oauth/applications', {
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

        const response = await $fetch(`/api/admin/oauth/applications/${selectedApp.value.id}`, {
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

function viewApplication(app: any) {
    selectedApp.value = app
    showViewDialog.value = true
}

async function toggleApplicationStatus(app: any) {
    try {
        toggling.value = true

        await $fetch(`/api/admin/oauth/applications/${app.id}`, {
            method: 'PUT',
            body: {
                disabled: !app.disabled,
            },
        })

        toast.add({
            severity: 'success',
            summary: '成功',
            detail: `应用已${app.disabled ? '启用' : '禁用'}`,
            life: 3000,
        })

        await refreshApplications()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '操作失败',
            life: 3000,
        })
    } finally {
        toggling.value = false
    }
}

function goProfile() {
    navigateTo('/profile')
}

// 移除 onMounted，因为使用 useFetch 已在 SSR 时获取数据

</script>

<style lang="scss" scoped>

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
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);

    @media (width <= 768px) {
        flex-direction: column;
        gap: 1.5rem;
    }
}

.header-content {
    .clients-title {
        font-size: 2rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 0.5rem;
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

    @media (width <= 768px) {
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
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    margin-bottom: 1.5rem;

    .filter-row {
        display: flex;
        gap: 1rem;
        align-items: center;

        @media (width <= 768px) {
            flex-direction: column;
            align-items: stretch;
        }
    }

    .search-wrapper {
        flex: 1;
        min-width: 300px;

        @media (width <= 768px) {
            min-width: unset;
        }
    }

    .filter-controls {
        display: flex;
        gap: 1rem;

        @media (width <= 768px) {
            flex-wrap: wrap;
        }
    }
}

.clients-list {
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
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
@media (width <= 768px) {
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

    .form-header {
        .oidc-notice {
            display: flex;
            align-items: flex-start;
            gap: 0.75rem;
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 0.5rem;
            padding: 1rem;
            margin-top: 1rem;
            color: #856404;

            i {
                color: #f39c12;
                font-size: 1.25rem;
                margin-top: 0.1rem;
                flex-shrink: 0;
            }

            span {
                font-size: 0.9rem;
                line-height: 1.4;
            }

            strong {
                font-weight: 600;
            }
        }
    }

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
        gap: 0 1.5rem;

        // 重要的或较长的字段占用整行
        .form-group:nth-child(1),  // 应用名称
        .form-group:nth-child(2),  // 应用简介
        .form-group:nth-child(3),  // 重定向 URL
        .form-group:nth-child(6),  // 授权范围
        .form-group:nth-child(9),  // 认证方式
        .form-group:nth-child(10), // 授权类型
        .form-group:nth-child(11)  // 响应类型
        {
            grid-column: 1 / -1;
        }

        // 确保PrimeVue组件占满容器宽度
        .form-group {
            :deep(.p-inputtext),
            :deep(.p-dropdown),
            :deep(.p-multiselect),
            :deep(.p-textarea) {
                width: 100% !important;
                box-sizing: border-box;
            }
        }

        // 其他字段使用两列布局：
        // 应用主页、应用Logo
        // 联系邮箱
        // 服务条款链接、隐私政策链接
        // 软件ID、软件版本
    }

    @media (width <= 768px) {
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

.text-muted {
    color: $secondary-light;
    font-size: 0.875rem;
    margin-top: 0.5rem;
}

.api-docs-dialog {
    width: 90vw;
    max-width: 900px;

    .api-docs-content {
        // PrimeVue Accordion 样式覆盖
        :deep(.p-accordion) {
            .p-accordion-header {
                .p-accordion-header-link {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    margin-bottom: 0.5rem;
                    padding: 1rem 1.5rem;
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    color: $primary;
                    font-weight: 600;
                    text-decoration: none;
                    transition: all 0.2s ease;

                    &:hover {
                        background: #f1f5f9;
                        border-color: $primary;
                    }

                    &:focus {
                        box-shadow: 0 0 0 2px rgba($primary, 0.2);
                    }

                    i {
                        font-size: 1.25rem;
                        color: $primary;
                    }

                    span {
                        font-size: 1.1rem;
                    }
                }

                &.p-accordion-header-active {
                    .p-accordion-header-link {
                        background: white;
                        border-color: $primary;
                        margin-bottom: 0;
                        border-bottom-left-radius: 0;
                        border-bottom-right-radius: 0;
                    }
                }
            }

            .p-accordion-content {
                border: 1px solid $primary;
                border-top: none;
                border-radius: 0 0 0.5rem 0.5rem;
                margin-bottom: 1rem;

                .p-accordion-content-content {
                    padding: 1.5rem;
                    background: white;
                }
            }
        }

        .section {
            margin-bottom: 2rem;

            &:last-child {
                margin-bottom: 0;
            }

            h3 {
                margin: 0 0 1rem;
                color: $primary;
                font-size: 1.2rem;
                font-weight: 600;
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    font-size: 1.25rem;
                }
            }

            .section-description {
                color: $secondary-light;
                margin: 0 0 1.5rem;
                line-height: 1.5;
            }
        }

        .endpoint-group {
            display: flex;
            flex-direction: column;
            gap: 1rem;

            .endpoint-item {
                label {
                    display: block;
                    margin-bottom: 0.5rem;
                    font-weight: 600;
                    color: $secondary;
                    font-size: 0.9rem;
                }

                .endpoint-url {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 0.5rem;
                    padding: 0.75rem;

                    code {
                        flex: 1;
                        font-family: 'Courier New', monospace;
                        font-size: 0.875rem;
                        color: $secondary;
                        background: transparent;
                        border: none;
                        word-break: break-all;
                    }

                    .p-button {
                        flex-shrink: 0;
                        color: $secondary-light;

                        &:hover {
                            color: $primary;
                        }
                    }
                }
            }
        }

        .config-example {
            position: relative;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 0.5rem;
            padding: 1rem;
            overflow-x: auto;

            pre {
                margin: 0;
                font-family: 'Courier New', monospace;
                font-size: 0.875rem;
                line-height: 1.4;
                color: $secondary;

                code {
                    background: transparent;
                    padding: 0;
                    border: none;
                }
            }

            .copy-config-btn {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
                color: $secondary-light;

                &:hover {
                    color: $primary;
                }
            }
        }

        .notice {
            background: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 0.5rem;
            padding: 1rem;

            ul {
                margin: 0;
                padding-left: 1.5rem;
                color: $secondary;

                li {
                    margin-bottom: 0.5rem;
                    line-height: 1.5;

                    &:last-child {
                        margin-bottom: 0;
                    }
                }
            }
        }
    }

    @media (width <= 768px) {
        width: 95vw;

        .api-docs-content {
            .endpoint-group {
                .endpoint-item {
                    .endpoint-url {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 0.75rem;

                        code {
                            text-align: center;
                        }
                    }
                }
            }

            .config-example {
                .copy-config-btn {
                    position: static;
                    margin-top: 1rem;
                    width: 100%;
                }
            }
        }
    }
}

.view-dialog {
    width: 90vw;
    max-width: 900px;

    .view-content {
        .app-basic-info {
            margin-bottom: 2rem;

            .app-header {
                display: flex;
                align-items: flex-start;
                gap: 1rem;

                .app-logo {
                    width: 64px;
                    height: 64px;
                    border-radius: 8px;
                    object-fit: cover;
                    flex-shrink: 0;
                }

                .app-details {
                    flex: 1;

                    .app-name {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: $primary;
                        margin: 0 0 0.5rem;
                    }

                    .app-description {
                        color: $secondary-light;
                        margin: 0 0 1rem;
                        line-height: 1.5;
                    }

                    .app-status {
                        margin-top: 1rem;
                    }
                }
            }
        }

        .app-info-grid {
            display: grid;
            gap: 2rem;

            .info-group {
                background: #f8fafc;
                border-radius: 8px;
                padding: 1.5rem;

                h4 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    color: $primary;
                    margin: 0 0 1rem;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #e2e8f0;
                }

                .info-item {
                    margin-bottom: 1rem;

                    &:last-child {
                        margin-bottom: 0;
                    }

                    label {
                        display: block;
                        font-weight: 600;
                        color: $secondary;
                        margin-bottom: 0.5rem;
                        font-size: 0.875rem;
                    }

                    .value-with-copy {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;

                        .client-id {
                            font-family: 'Courier New', monospace;
                            background: white;
                            padding: 0.5rem;
                            border-radius: 0.25rem;
                            font-size: 0.875rem;
                            border: 1px solid #e2e8f0;
                        }
                    }

                    .info-link {
                        color: $primary;
                        text-decoration: none;

                        &:hover {
                            text-decoration: underline;
                        }

                        i {
                            margin-left: 0.25rem;
                            font-size: 0.875rem;
                        }
                    }

                    .scope-tags, .tag-list {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 0.25rem;

                        .scope-tag {
                            font-size: 0.75rem;
                        }
                    }

                    .url-list {
                        .url-item {
                            margin-bottom: 0.5rem;

                            &:last-child {
                                margin-bottom: 0;
                            }

                            code {
                                background: white;
                                padding: 0.5rem;
                                border-radius: 0.25rem;
                                font-size: 0.875rem;
                                border: 1px solid #e2e8f0;
                                display: block;
                                word-break: break-all;
                            }
                        }
                    }

                    .contact-list {
                        .contact-email {
                            display: inline-block;
                            color: $primary;
                            text-decoration: none;
                            margin-right: 1rem;
                            margin-bottom: 0.5rem;

                            &:hover {
                                text-decoration: underline;
                            }
                        }
                    }
                }
            }
        }
    }

    @media (width <= 768px) {
        width: 95vw;

        .view-content {
            .app-basic-info {
                .app-header {
                    flex-direction: column;
                    text-align: center;

                    .app-logo {
                        align-self: center;
                    }
                }
            }

            .app-info-grid {
                gap: 1rem;

                .info-group {
                    padding: 1rem;
                }
            }
        }
    }
}
</style>
