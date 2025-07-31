# coding=utf-8
<template>
    <div class="admin-users">
        <div class="users-container">
            <div class="users-header">
                <div class="header-content">
                    <h1 class="users-title">
                        用户管理
                    </h1>
                    <p class="users-subtitle">
                        管理系统中的所有用户，包括查看详情、编辑资料、角色设置等
                    </p>
                </div>
                <div class="header-actions">
                    <Button
                        label="创建用户"
                        icon="mdi mdi-plus"
                        @click="resetCreateForm(); showCreateDialog = true"
                    />
                </div>
            </div>

            <!-- 搜索和筛选 -->
            <div class="users-filters">
                <div class="filter-row">
                    <div class="search-wrapper">
                        <IconField icon-position="left">
                            <InputIcon class="mdi mdi-magnify" />
                            <InputText
                                v-model="searchQuery"
                                placeholder="搜索用户（邮箱、用户名、姓名）"
                                @input="debouncedSearch"
                            />
                        </IconField>
                    </div>
                    <div class="filter-controls">
                        <Select
                            v-model="selectedRole"
                            :options="roleOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选角色"
                            show-clear
                            @change="loadUsers"
                        />
                        <Select
                            v-model="selectedStatus"
                            :options="statusOptions"
                            option-label="label"
                            option-value="value"
                            placeholder="筛选状态"
                            show-clear
                            @change="loadUsers"
                        />
                        <Button
                            icon="mdi mdi-refresh"
                            severity="secondary"
                            outlined
                            @click="refreshUsers"
                        />
                    </div>
                </div>
            </div>

            <!-- 用户列表 -->
            <div class="users-list">
                <DataTable
                    v-model:selection="selectedUsers"
                    :value="users"
                    :loading="loading"
                    :paginator="true"
                    :rows="pageSize"
                    :total-records="totalUsers"
                    :lazy="true"
                    paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
                    current-page-report-template="{first} 到 {last} 共 {totalRecords} 条"
                    :rows-per-page-options="[10, 25, 50]"
                    sortable
                    selection-mode="multiple"
                    :meta-key-selection="false"
                    @page="onPageChange"
                    @sort="onSort"
                >
                    <template #header>
                        <div class="table-header">
                            <div class="table-title">
                                用户列表 ({{ totalUsers }})
                            </div>
                            <div v-if="selectedUsers.length > 0" class="table-actions">
                                <Button
                                    label="批量操作"
                                    icon="mdi mdi-menu-down"
                                    severity="secondary"
                                    @click="toggleBatchMenu"
                                />
                                <Menu
                                    ref="batchMenu"
                                    :model="batchMenuItems"
                                    popup
                                />
                            </div>
                        </div>
                    </template>

                    <Column selection-mode="multiple" header-style="width: 3rem" />

                    <Column
                        field="name"
                        header="用户信息"
                        sortable
                    >
                        <template #body="{data}">
                            <div class="user-info">
                                <img
                                    v-if="data.image"
                                    :src="data.image"
                                    :alt="data.name || '用户头像'"
                                    class="user-avatar"
                                >
                                <div v-else class="user-avatar-placeholder">
                                    <i class="mdi mdi-account" />
                                </div>
                                <div class="user-details">
                                    <div class="user-name">
                                        {{ data.name || '未设置昵称' }}
                                        <div class="verification-tags">
                                            <Tag
                                                v-if="data.emailVerified"
                                                value="邮箱已验证"
                                                severity="success"
                                                size="small"
                                            />
                                            <Tag
                                                v-if="data.phoneNumberVerified"
                                                value="手机已验证"
                                                severity="success"
                                                size="small"
                                            />
                                            <Tag
                                                v-if="!data.emailVerified && !data.phoneNumberVerified"
                                                value="未验证"
                                                severity="warning"
                                                size="small"
                                            />
                                        </div>
                                    </div>
                                    <div class="user-email">
                                        {{ data.email }}
                                    </div>
                                    <div v-if="data.username" class="user-username">
                                        @{{ data.username }}
                                    </div>
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column
                        field="role"
                        header="角色"
                        sortable
                    >
                        <template #body="{data}">
                            <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
                        </template>
                    </Column>

                    <Column
                        field="banned"
                        header="状态"
                        sortable
                    >
                        <template #body="{data}">
                            <div class="user-status">
                                <Tag
                                    v-if="data.banned"
                                    value="已禁用"
                                    severity="danger"
                                />
                                <Tag
                                    v-else
                                    value="正常"
                                    severity="success"
                                />
                                <div v-if="data.banned && data.banReason" class="ban-reason">
                                    原因：{{ data.banReason }}
                                </div>
                                <div v-if="data.banned && data.banExpires" class="ban-expires">
                                    到期：{{ formatDate(data.banExpires ) }}
                                </div>
                            </div>
                        </template>
                    </Column>

                    <Column
                        field="createdAt"
                        header="注册时间"
                        sortable
                    >
                        <template #body="{data}">
                            {{ formatDate(data.createdAt) }}
                        </template>
                    </Column>

                    <Column header="操作" header-style="width: 14rem">
                        <template #body="{data}">
                            <div class="action-buttons">
                                <!-- 查看详情 - 所有用户都可以查看 -->
                                <Button
                                    v-tooltip="'查看详情'"
                                    icon="mdi mdi-eye"
                                    severity="info"
                                    outlined
                                    size="small"
                                    @click="viewUser(data)"
                                />

                                <!-- 同步管理员角色 - 所有用户都可以同步 -->
                                <Button
                                    v-tooltip="'同步管理员角色'"
                                    icon="mdi mdi-sync"
                                    severity="secondary"
                                    outlined
                                    size="small"
                                    @click="syncUserAdminRole(data)"
                                />

                                <!-- 禁用/解禁按钮 -->
                                <template v-if="data.role === 'admin'">
                                    <!-- 管理员不可禁用 -->
                                    <Button
                                        v-tooltip="'管理员不可禁用'"
                                        icon="mdi mdi-block-helper"
                                        severity="warning"
                                        outlined
                                        size="small"
                                        disabled
                                    />
                                </template>
                                <template v-else-if="isCurrentUser(data.id)">
                                    <!-- 不能禁用自己 -->
                                    <Button
                                        v-tooltip="'不能禁用自己'"
                                        icon="mdi mdi-block-helper"
                                        severity="warning"
                                        outlined
                                        size="small"
                                        disabled
                                    />
                                </template>
                                <template v-else>
                                    <!-- 普通用户的禁用/解禁 -->
                                    <Button
                                        v-if="!data.banned"
                                        v-tooltip="'禁用用户'"
                                        icon="mdi mdi-block-helper"
                                        severity="warning"
                                        outlined
                                        size="small"
                                        @click="banUser(data)"
                                    />
                                    <Button
                                        v-else
                                        v-tooltip="'解禁用户'"
                                        icon="mdi mdi-check-circle"
                                        severity="success"
                                        outlined
                                        size="small"
                                        @click="unbanUser(data)"
                                    />
                                </template>

                                <!-- 删除按钮 -->
                                <template v-if="data.role === 'admin'">
                                    <!-- 管理员不可删除 -->
                                    <Button
                                        v-tooltip="'管理员不可删除'"
                                        icon="mdi mdi-delete"
                                        severity="danger"
                                        outlined
                                        size="small"
                                        disabled
                                    />
                                </template>
                                <template v-else-if="isCurrentUser(data.id)">
                                    <!-- 不能删除自己 -->
                                    <Button
                                        v-tooltip="'不能删除自己'"
                                        icon="mdi mdi-delete"
                                        severity="danger"
                                        outlined
                                        size="small"
                                        disabled
                                    />
                                </template>
                                <template v-else>
                                    <!-- 普通用户可以删除 -->
                                    <Button
                                        v-tooltip="'删除用户'"
                                        icon="mdi mdi-delete"
                                        severity="danger"
                                        outlined
                                        size="small"
                                        @click="deleteUser(data)"
                                    />
                                </template>
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- 创建用户对话框 -->
        <Dialog
            v-model:visible="showCreateDialog"
            modal
            header="创建用户"
            :style="{width: '500px'}"
        >
            <form class="create-user-form" @submit.prevent="createUser">
                <div class="field">
                    <label for="createName">昵称</label>
                    <InputText
                        id="createName"
                        v-model="createForm.name"
                        placeholder="请输入用户昵称"
                        required
                    />
                </div>

                <div class="field">
                    <label for="createEmail">邮箱</label>
                    <InputText
                        id="createEmail"
                        v-model="createForm.email"
                        type="email"
                        placeholder="请输入邮箱地址"
                        required
                    />
                </div>

                <div class="field">
                    <label for="createUsername">用户名</label>
                    <InputText
                        id="createUsername"
                        v-model="createForm.username"
                        placeholder="请输入用户名（可选）"
                    />
                </div>

                <div class="field">
                    <label for="createPassword">密码</label>
                    <Password
                        id="createPassword"
                        v-model="createForm.password"
                        placeholder="请输入密码"
                        :feedback="false"
                        toggle-mask
                        required
                    />
                </div>

                <div class="field">
                    <label for="createRole">角色</label>
                    <Select
                        id="createRole"
                        v-model="createForm.role"
                        :options="roleOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="选择用户角色"
                    />
                </div>

                <div class="dialog-footer">
                    <Button
                        label="取消"
                        severity="secondary"
                        @click="showCreateDialog = false"
                    />
                    <Button
                        label="创建"
                        type="submit"
                        :loading="createLoading"
                    />
                </div>
            </form>
        </Dialog>

        <!-- 用户详情对话框 -->
        <Dialog
            v-model:visible="showDetailDialog"
            modal
            header="用户详情"
            :style="{width: '600px'}"
        >
            <div v-if="viewingUser" class="user-detail">
                <div class="detail-section">
                    <h3>基本信息</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>ID</label>
                            <span>{{ viewingUser.id }}</span>
                        </div>
                        <div class="detail-item">
                            <label>昵称</label>
                            <span>{{ viewingUser.name || '未设置' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>邮箱</label>
                            <span>{{ viewingUser.email }}</span>
                        </div>
                        <div class="detail-item">
                            <label>手机号</label>
                            <span>{{ viewingUser.phoneNumber ? formatPhoneNumberInternational(viewingUser.phoneNumber) : '未设置' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>用户名</label>
                            <span>{{ viewingUser.username || '未设置' }}</span>
                        </div>
                        <div class="detail-item">
                            <label>角色</label>
                            <Tag
                                :value="getRoleLabel(viewingUser.role)"
                                :severity="getRoleSeverity(viewingUser.role)"
                            />
                        </div>
                        <div class="detail-item">
                            <label>验证状态</label>
                            <div class="verification-status">
                                <Tag
                                    :value="viewingUser.emailVerified ? '邮箱已验证' : '邮箱未验证'"
                                    :severity="viewingUser.emailVerified ? 'success' : 'warning'"
                                    size="small"
                                />
                                <Tag
                                    :value="viewingUser.phoneNumberVerified ? '手机已验证' : '手机未验证'"
                                    :severity="viewingUser.phoneNumberVerified ? 'success' : 'warning'"
                                    size="small"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>账户状态</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>状态</label>
                            <Tag
                                :value="viewingUser.banned ? '已禁用' : '正常'"
                                :severity="viewingUser.banned ? 'danger' : 'success'"
                            />
                        </div>
                        <div v-if="viewingUser.banned" class="detail-item">
                            <label>禁用原因</label>
                            <span>{{ viewingUser.banReason || '未提供原因' }}</span>
                        </div>
                        <div v-if="viewingUser.banned && viewingUser.banExpires" class="detail-item">
                            <label>禁用到期时间</label>
                            <span>{{ formatDate(viewingUser.banExpires) }}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-section">
                    <h3>时间信息</h3>
                    <div class="detail-grid">
                        <div class="detail-item">
                            <label>注册时间</label>
                            <span>{{ formatDate(viewingUser.createdAt) }}</span>
                        </div>
                        <div class="detail-item">
                            <label>更新时间</label>
                            <span>{{ formatDate(viewingUser.updatedAt) }}</span>
                        </div>
                    </div>
                </div>

                <div class="detail-actions">
                    <Button
                        label="查看会话"
                        icon="mdi mdi-account-multiple"
                        severity="info"
                        @click="viewUserSessions(viewingUser)"
                    />
                    <Button
                        label="同步管理员角色"
                        icon="mdi mdi-sync"
                        severity="secondary"
                        @click="syncUserAdminRole(viewingUser)"
                    />
                    <Button
                        v-if="!viewingUser.role?.includes('admin')"
                        label="设为管理员"
                        icon="mdi mdi-shield-account"
                        severity="help"
                        @click="setUserAsAdmin(viewingUser)"
                    />
                    <Button
                        v-else-if="viewingUser.role?.includes('admin') && !isCurrentUser(viewingUser.id)"
                        label="移除管理员"
                        icon="mdi mdi-shield-remove"
                        severity="danger"
                        @click="removeUserAdminRole(viewingUser)"
                    />
                    <Button
                        v-else-if="viewingUser.role?.includes('admin') && isCurrentUser(viewingUser.id)"
                        label="不能移除自己的管理员权限"
                        icon="mdi mdi-shield-remove"
                        severity="danger"
                        disabled
                    />
                    <Button
                        v-if="!viewingUser.banned && viewingUser.role !== 'admin' && !isCurrentUser(viewingUser.id)"
                        label="禁用用户"
                        icon="mdi mdi-block-helper"
                        severity="warning"
                        @click="banUser(viewingUser); showDetailDialog = false"
                    />
                    <Button
                        v-else-if="viewingUser.banned && viewingUser.role !== 'admin' && !isCurrentUser(viewingUser.id)"
                        label="解禁用户"
                        icon="mdi mdi-check-circle"
                        severity="success"
                        @click="unbanUser(viewingUser); showDetailDialog = false"
                    />
                    <Button
                        v-else-if="isCurrentUser(viewingUser.id)"
                        label="不能操作自己的账户"
                        icon="mdi mdi-account-alert"
                        severity="warning"
                        disabled
                    />
                    <Button
                        v-if="viewingUser.role === 'admin' && !viewingUser.banned"
                        label="管理员不可禁用"
                        icon="mdi mdi-block-helper"
                        severity="warning"
                        disabled
                    />
                </div>
            </div>
        </Dialog>

        <!-- 禁用用户确认对话框 -->
        <Dialog
            v-model:visible="showBanDialog"
            modal
            header="禁用用户"
            :style="{width: '400px'}"
        >
            <div v-if="banningUser" class="ban-form">
                <p>确定要禁用用户 <strong>{{ banningUser.name || banningUser.email }}</strong> 吗？</p>

                <div class="field">
                    <label for="banReason">禁用原因</label>
                    <Textarea
                        id="banReason"
                        v-model="banForm.reason"
                        placeholder="请输入禁用原因"
                        rows="3"
                    />
                </div>

                <div class="field">
                    <label for="banDuration">禁用时长</label>
                    <Select
                        id="banDuration"
                        v-model="banForm.duration"
                        :options="banDurationOptions"
                        option-label="label"
                        option-value="value"
                        placeholder="选择禁用时长"
                    />
                </div>

                <div class="dialog-footer">
                    <Button
                        label="取消"
                        severity="secondary"
                        @click="showBanDialog = false"
                    />
                    <Button
                        label="确认禁用"
                        severity="danger"
                        :loading="banLoading"
                        @click="confirmBanUser"
                    />
                </div>
            </div>
        </Dialog>

        <!-- 用户会话对话框 -->
        <Dialog
            v-model:visible="showSessionsDialog"
            modal
            header="用户会话"
            :style="{width: '700px'}"
        >
            <div v-if="sessionUser" class="user-sessions">
                <div class="sessions-header">
                    <h4>{{ sessionUser.name || sessionUser.email }} 的活跃会话</h4>
                    <Button
                        label="撤销所有会话"
                        severity="danger"
                        outlined
                        size="small"
                        :loading="revokeAllLoading"
                        @click="revokeAllUserSessions"
                    />
                </div>

                <DataTable :value="userSessions" :loading="sessionsLoading">
                    <Column field="id" header="会话ID">
                        <template #body="{data}">
                            <code class="session-id">{{ data.token.substring(0, 16) }}...</code>
                        </template>
                    </Column>

                    <Column field="userAgent" header="设备信息">
                        <template #body="{data}">
                            <div class="device-info">
                                <div>{{ parseUserAgent(data.userAgent).browser }}</div>
                                <small>{{ parseUserAgent(data.userAgent).os }}</small>
                            </div>
                        </template>
                    </Column>

                    <Column field="createdAt" header="创建时间">
                        <template #body="{data}">
                            {{ formatDate(data.createdAt) }}
                        </template>
                    </Column>

                    <Column field="expiresAt" header="到期时间">
                        <template #body="{data}">
                            {{ formatDate(data.expiresAt) }}
                        </template>
                    </Column>

                    <Column header="操作">
                        <template #body="{data}">
                            <Button
                                label="撤销"
                                severity="danger"
                                outlined
                                size="small"
                                :loading="revokingSession === data.token"
                                @click="revokeUserSession(data.token)"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </Dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import { debounce } from 'lodash-es'
import { authClient } from '@/lib/auth-client'
import { parseUserAgent } from '@/utils/useragent'
import { formatPhoneNumberInternational } from '@/utils/phone'
import { syncAdminRole, addAdminRole, removeAdminRole } from '@/utils/admin-role-client'

// 页面元数据
definePageMeta({
    title: '用户管理 - 草梅 Auth',
    layout: 'admin',
})

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// 获取当前用户会话
const { data: currentSession } = await authClient.useSession(useFetch)

// 响应式数据
const loading = ref(false)
const users = ref<any[]>([])
const totalUsers = ref(0)
const pageSize = ref(10)
const currentPage = ref(0)
const searchQuery = ref('')
const selectedRole = ref(null)
const selectedStatus = ref(null)
const selectedUsers = ref<any[]>([])

// 对话框显示状态
const showCreateDialog = ref(false)
const showDetailDialog = ref(false)
const showBanDialog = ref(false)
const showSessionsDialog = ref(false)

// 表单数据
const createForm = ref({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'user',
})

const banForm = ref({
    reason: '',
    duration: null,
})

// 操作状态
const createLoading = ref(false)
const banLoading = ref(false)
const sessionsLoading = ref(false)
const revokeAllLoading = ref(false)
const revokingSession = ref('')

// 当前操作的用户
const viewingUser = ref<any>(null)
const banningUser = ref<any>(null)
const sessionUser = ref<any>(null)
const userSessions = ref<any[]>([])

// 选项数据
const roleOptions = [
    { label: '用户', value: 'user' },
    { label: '管理员', value: 'admin' },
]

const statusOptions = [
    { label: '正常', value: 'active' },
    { label: '已禁用', value: 'banned' },
]

const banDurationOptions = [
    { label: '永久', value: null },
    { label: '1小时', value: 3600 },
    { label: '1天', value: 86400 },
    { label: '7天', value: 604800 },
    { label: '30天', value: 2592000 },
]

// 批量操作菜单
const batchMenu = ref()
const batchMenuItems = [
    {
        label: '禁用选中用户',
        icon: 'mdi mdi-block-helper',
        command: () => batchBanUsers(),
    },
    {
        label: '解禁选中用户',
        icon: 'mdi mdi-check-circle',
        command: () => batchUnbanUsers(),
    },
    {
        label: '删除选中用户',
        icon: 'mdi mdi-delete',
        command: () => batchDeleteUsers(),
    },
]

// 计算属性
const debouncedSearch = debounce(() => {
    loadUsers()
}, 500)

// 工具函数
const formatDate = (date: string | number) => new Date(date).toLocaleString('zh-CN')

const isCurrentUser = (userId: string) => currentSession.value?.user?.id === userId

const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
        user: '用户',
        admin: '管理员',
    }
    return roleMap[role] || role
}

const getRoleSeverity = (role: string) => {
    const severityMap: Record<string, string> = {
        user: 'info',
        admin: 'danger',
    }
    return severityMap[role] || 'secondary'
}

// 页面方法
const goProfile = () => {
    router.push('/profile')
}

const refreshUsers = () => {
    searchQuery.value = ''
    selectedRole.value = null
    selectedStatus.value = null
    loadUsers()
}

const resetCreateForm = () => {
    createForm.value = {
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'user',
    }
}

// API 调用方法
const loadUsers = async () => {
    try {
        loading.value = true

        const query: any = {
            limit: pageSize.value,
            offset: currentPage.value * pageSize.value,
        }

        // 添加搜索条件
        if (searchQuery.value) {
            query.searchField = 'email'
            query.searchOperator = 'contains'
            query.searchValue = searchQuery.value
        }

        // 添加角色筛选
        if (selectedRole.value) {
            query.filterField = 'role'
            query.filterOperator = 'eq'
            query.filterValue = selectedRole.value
        }

        // 添加状态筛选
        if (selectedStatus.value) {
            query.filterField = 'banned'
            query.filterOperator = 'eq'
            query.filterValue = selectedStatus.value === 'banned'
        }

        const response = await authClient.admin.listUsers({ query })

        users.value = response.data?.users || []
        totalUsers.value = response.data?.total || 0

    } catch (error: any) {
        console.error('加载用户列表失败:', error)
        toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: error.message || '加载用户列表失败',
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

const createUser = async () => {
    try {
        createLoading.value = true

        const response = await authClient.admin.createUser({
            name: createForm.value.name,
            email: createForm.value.email,
            password: createForm.value.password,
            role: createForm.value.role as 'admin' | 'user',
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '创建成功',
                detail: '用户创建成功',
                life: 3000,
            })
            showCreateDialog.value = false
            resetCreateForm()
            loadUsers()
        }
    } catch (error: any) {
        console.error('创建用户失败:', error)
        toast.add({
            severity: 'error',
            summary: '创建失败',
            detail: error.message || '创建用户失败',
            life: 3000,
        })
    } finally {
        createLoading.value = false
    }
}

const viewUser = (user: any) => {
    viewingUser.value = user
    showDetailDialog.value = true
}

const banUser = (user: any) => {
    // 防止禁用自己
    if (isCurrentUser(user.id)) {
        toast.add({
            severity: 'warn',
            summary: '操作不允许',
            detail: '不能禁用自己的账户',
            life: 3000,
        })
        return
    }

    banningUser.value = user
    banForm.value = {
        reason: '',
        duration: null,
    }
    showBanDialog.value = true
}

const confirmBanUser = async () => {
    if (!banningUser.value) {
        return
    }

    try {
        banLoading.value = true

        const response = await authClient.admin.banUser({
            userId: banningUser.value.id,
            banReason: banForm.value.reason || undefined,
            banExpiresIn: banForm.value.duration || undefined,
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '禁用成功',
                detail: '用户已被禁用',
                life: 3000,
            })
            showBanDialog.value = false
            loadUsers()
        }
    } catch (error: any) {
        console.error('禁用用户失败:', error)
        toast.add({
            severity: 'error',
            summary: '禁用失败',
            detail: error.message || '禁用用户失败',
            life: 3000,
        })
    } finally {
        banLoading.value = false
    }
}

const unbanUser = async (user: any) => {
    try {
        const response = await authClient.admin.unbanUser({
            userId: user.id,
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '解禁成功',
                detail: '用户已解除禁用',
                life: 3000,
            })
            loadUsers()
        }
    } catch (error: any) {
        console.error('解禁用户失败:', error)
        toast.add({
            severity: 'error',
            summary: '解禁失败',
            detail: error.message || '解禁用户失败',
            life: 3000,
        })
    }
}

// 同步用户管理员角色
const syncUserAdminRole = async (user: any) => {
    try {
        loading.value = true
        const result = await syncAdminRole(user.id)

        if (result.success) {
            toast.add({
                severity: 'success',
                summary: '同步成功',
                detail: result.message,
                life: 3000,
            })
            // 重新加载用户列表以更新显示
            await loadUsers()
        } else {
            toast.add({
                severity: 'warning',
                summary: '同步完成',
                detail: result.message,
                life: 3000,
            })
        }
    } catch (error: any) {
        console.error('同步管理员角色失败:', error)
        toast.add({
            severity: 'error',
            summary: '同步失败',
            detail: error.message || '同步管理员角色失败',
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

// 设置用户为管理员
const setUserAsAdmin = async (user: any) => {
    confirm.require({
        message: `确定要将用户 ${user.name || user.email} 设置为管理员吗？`,
        header: '确认设置管理员',
        icon: 'mdi mdi-shield-account',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-success',
        accept: async () => {
            try {
                loading.value = true
                const result = await addAdminRole(user.id)

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: '设置成功',
                        detail: result.message,
                        life: 3000,
                    })
                    await loadUsers()
                    showDetailDialog.value = false
                } else {
                    toast.add({
                        severity: 'warning',
                        summary: '设置失败',
                        detail: result.message,
                        life: 3000,
                    })
                }
            } catch (error: any) {
                console.error('设置管理员角色失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '设置失败',
                    detail: error.message || '设置管理员角色失败',
                    life: 3000,
                })
            } finally {
                loading.value = false
            }
        },
    })
}

// 移除用户管理员角色
const removeUserAdminRole = async (user: any) => {
    // 防止管理员移除自己的权限
    if (isCurrentUser(user.id)) {
        toast.add({
            severity: 'warn',
            summary: '操作不允许',
            detail: '不能移除自己的管理员权限',
            life: 3000,
        })
        return
    }

    confirm.require({
        message: `确定要移除用户 ${user.name || user.email} 的管理员角色吗？`,
        header: '确认移除管理员角色',
        icon: 'mdi mdi-shield-remove',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                loading.value = true
                const result = await removeAdminRole(user.id)

                if (result.success) {
                    toast.add({
                        severity: 'success',
                        summary: '移除成功',
                        detail: result.message,
                        life: 3000,
                    })
                    await loadUsers()
                    showDetailDialog.value = false
                } else {
                    toast.add({
                        severity: 'warning',
                        summary: '移除失败',
                        detail: result.message,
                        life: 3000,
                    })
                }
            } catch (error: any) {
                console.error('移除管理员角色失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '移除失败',
                    detail: error.message || '移除管理员角色失败',
                    life: 3000,
                })
            } finally {
                loading.value = false
            }
        },
    })
}

const deleteUser = async (user: any) => {
    // 防止删除自己
    if (isCurrentUser(user.id)) {
        toast.add({
            severity: 'warn',
            summary: '操作不允许',
            detail: '不能删除自己的账户',
            life: 3000,
        })
        return
    }

    confirm.require({
        message: `确定要删除用户 ${user.name || user.email} 吗？此操作不可恢复！`,
        header: '确认删除',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                const response = await authClient.admin.removeUser({
                    userId: user.id,
                })

                if (response.data) {
                    toast.add({
                        severity: 'success',
                        summary: '删除成功',
                        detail: '用户已被删除',
                        life: 3000,
                    })
                    loadUsers()
                }
            } catch (error: any) {
                console.error('删除用户失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '删除失败',
                    detail: error.message || '删除用户失败',
                    life: 3000,
                })
            }
        },
    })
}

const viewUserSessions = async (user: any) => {
    sessionUser.value = user
    showSessionsDialog.value = true

    try {
        sessionsLoading.value = true

        const response = await authClient.admin.listUserSessions({
            userId: user.id,
        })

        userSessions.value = response.data?.sessions || []
    } catch (error: any) {
        console.error('加载用户会话失败:', error)
        toast.add({
            severity: 'error',
            summary: '加载失败',
            detail: error.message || '加载用户会话失败',
            life: 3000,
        })
    } finally {
        sessionsLoading.value = false
    }
}

const revokeUserSession = async (sessionToken: string) => {
    try {
        revokingSession.value = sessionToken

        const response = await authClient.admin.revokeUserSession({
            sessionToken,
        })

        if (response.data) {
            toast.add({
                severity: 'success',
                summary: '撤销成功',
                detail: '会话已撤销',
                life: 3000,
            })

            // 重新加载会话列表
            if (sessionUser.value) {
                viewUserSessions(sessionUser.value)
            }
        }
    } catch (error: any) {
        console.error('撤销会话失败:', error)
        toast.add({
            severity: 'error',
            summary: '撤销失败',
            detail: error.message || '撤销会话失败',
            life: 3000,
        })
    } finally {
        revokingSession.value = ''
    }
}

const revokeAllUserSessions = async () => {
    if (!sessionUser.value) {
        return
    }

    confirm.require({
        message: `确定要撤销 ${sessionUser.value.name || sessionUser.value.email} 的所有会话吗？`,
        header: '确认撤销',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                revokeAllLoading.value = true

                const response = await authClient.admin.revokeUserSessions({
                    userId: sessionUser.value.id,
                })

                if (response.data) {
                    toast.add({
                        severity: 'success',
                        summary: '撤销成功',
                        detail: '所有会话已撤销',
                        life: 3000,
                    })

                    showSessionsDialog.value = false
                }
            } catch (error: any) {
                console.error('撤销所有会话失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '撤销失败',
                    detail: error.message || '撤销所有会话失败',
                    life: 3000,
                })
            } finally {
                revokeAllLoading.value = false
            }
        },
    })
}

// 分页处理
const onPageChange = (event: any) => {
    currentPage.value = event.page
    pageSize.value = event.rows
    loadUsers()
}

const onSort = (event: any) => {
    // TODO: 实现排序逻辑
    console.log('排序:', event)
}

// 批量操作
const toggleBatchMenu = (event: any) => {
    batchMenu.value.toggle(event)
}

const batchBanUsers = async () => {
    if (selectedUsers.value.length === 0) {
        return
    }

    confirm.require({
        message: `确定要禁用选中的 ${selectedUsers.value.length} 个用户吗？`,
        header: '确认批量禁用',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                for (const user of selectedUsers.value) {
                    await authClient.admin.banUser({
                        userId: user.id,
                        banReason: '批量禁用操作',
                    })
                }

                toast.add({
                    severity: 'success',
                    summary: '禁用成功',
                    detail: `已禁用 ${selectedUsers.value.length} 个用户`,
                    life: 3000,
                })

                selectedUsers.value = []
                loadUsers()
            } catch (error: any) {
                console.error('批量禁用失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '批量禁用失败',
                    detail: error.message || '批量禁用用户失败',
                    life: 3000,
                })
            }
        },
    })
}

const batchUnbanUsers = async () => {
    if (selectedUsers.value.length === 0) {
        return
    }

    confirm.require({
        message: `确定要解禁选中的 ${selectedUsers.value.length} 个用户吗？`,
        header: '确认批量解禁',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-success',
        accept: async () => {
            try {
                for (const user of selectedUsers.value) {
                    await authClient.admin.unbanUser({
                        userId: user.id,
                    })
                }

                toast.add({
                    severity: 'success',
                    summary: '解禁成功',
                    detail: `已解禁 ${selectedUsers.value.length} 个用户`,
                    life: 3000,
                })

                selectedUsers.value = []
                loadUsers()
            } catch (error: any) {
                console.error('批量解禁失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '批量解禁失败',
                    detail: error.message || '批量解禁用户失败',
                    life: 3000,
                })
            }
        },
    })
}

const batchDeleteUsers = async () => {
    if (selectedUsers.value.length === 0) {
        return
    }

    confirm.require({
        message: `确定要删除选中的 ${selectedUsers.value.length} 个用户吗？此操作不可恢复！`,
        header: '确认批量删除',
        icon: 'mdi mdi-alert',
        rejectClass: 'p-button-secondary p-button-outlined',
        acceptClass: 'p-button-danger',
        accept: async () => {
            try {
                for (const user of selectedUsers.value) {
                    await authClient.admin.removeUser({
                        userId: user.id,
                    })
                }

                toast.add({
                    severity: 'success',
                    summary: '删除成功',
                    detail: `已删除 ${selectedUsers.value.length} 个用户`,
                    life: 3000,
                })

                selectedUsers.value = []
                loadUsers()
            } catch (error: any) {
                console.error('批量删除失败:', error)
                toast.add({
                    severity: 'error',
                    summary: '批量删除失败',
                    detail: error.message || '批量删除用户失败',
                    life: 3000,
                })
            }
        },
    })
}

// 页面初始化
onMounted(() => {
    loadUsers()
})
</script>

<style lang="scss" scoped>
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.admin-users {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 2rem;
}

.users-container {
    max-width: 1400px;
    margin: 0 auto;
}

.users-header {
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
    .users-title {
        font-size: 2rem;
        font-weight: 700;
        color: $primary;
        margin: 0 0 0.5rem 0;
    }

    .users-subtitle {
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

.users-filters {
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

.users-list {
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
}

.user-info {
    display: flex;
    align-items: center;
    gap: 1rem;

    .user-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
    }

    .user-avatar-placeholder {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: $primary-100;
        color: $primary;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
    }

    .user-details {
        .user-name {
            font-weight: 600;
            color: $secondary;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 0.5rem;
        }

        .verification-tags {
            display: flex;
            gap: 0.25rem;
            flex-wrap: wrap;
        }

        .user-email {
            color: $secondary-light;
            font-size: 0.9rem;
        }

        .user-username {
            color: $primary;
            font-size: 0.9rem;
            font-weight: 500;
        }
    }
}

.user-status {

    .ban-reason,
    .ban-expires {
        font-size: 0.8rem;
        color: $secondary-light;
        margin-top: 0.25rem;
    }
}

.action-buttons {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

// 对话框样式
.create-user-form {
    .field {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: $secondary;
        }

        small {
            color: $secondary-light;
            font-size: 0.8rem;
            margin-top: 0.25rem;
            display: block;
        }
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }
}

.ban-form {
    .field {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: $secondary;
        }
    }

    .dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        margin-top: 2rem;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }
}

.user-detail {
    .detail-section {
        margin-bottom: 2rem;

        h3 {
            color: $primary;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }

        .detail-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;

            .detail-item {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;

                label {
                    font-weight: 600;
                    color: $secondary-light;
                    font-size: 0.9rem;
                }

                span {
                    color: $secondary;
                }

                .verification-status {
                    display: flex;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                }
            }
        }
    }

    .detail-actions {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;
        padding-top: 1rem;
        border-top: 1px solid #e2e8f0;
    }
}

.user-sessions {
    .sessions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #e2e8f0;

        h4 {
            margin: 0;
            color: $primary;
        }
    }

    .session-id {
        background: #f1f5f9;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-family: 'Courier New', monospace;
        font-size: 0.8rem;
    }

    .device-info {
        div {
            font-weight: 500;
        }

        small {
            color: $secondary-light;
        }
    }
}

// 响应式优化
@media (max-width: 768px) {
    .admin-users {
        padding: 1rem;
    }

    .action-buttons {
        justify-content: center;
    }

    :deep(.p-datatable-wrapper) {
        overflow-x: auto;
    }
}
</style>
