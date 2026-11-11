<template>
    <BaseDialogV2
        :visible="visible"
        title="用户会话"
        size="lg"
        :breakpoints="{'1920px': '860px'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="user-sessions">
            <div class="user-sessions__header">
                <h4 class="user-sessions__title">
                    {{ user.name || user.email }} 的活跃会话
                </h4>
                <CaomeiButton
                    variant="secondary"
                    tone="danger"
                    size="sm"
                    :loading="revokeAllLoading"
                    @click="revokeAllUserSessions"
                >
                    撤销所有会话
                </CaomeiButton>
            </div>

            <CaomeiDataTable
                class="user-sessions__table"
                :data="userSessions"
                :columns="columns"
                row-key="token"
                :loading="sessionsLoading"
            >
                <template #cell-token="{row}">
                    <code class="user-sessions__session-id">{{ row.token.substring(0, 16) }}...</code>
                </template>

                <template #cell-userAgent="{row}">
                    <div class="user-sessions__device">
                        <div>{{ parseUserAgent(row.userAgent || '').browser }}</div>
                        <small>{{ parseUserAgent(row.userAgent || '').os }}</small>
                    </div>
                </template>

                <template #cell-actions="{row}">
                    <CaomeiButton
                        variant="secondary"
                        tone="danger"
                        size="sm"
                        :loading="revokingSession === row.token"
                        @click="revokeUserSession(row.token)"
                    >
                        撤销
                    </CaomeiButton>
                </template>

                <template #empty>
                    <div class="user-sessions__empty">
                        该用户当前没有活跃会话
                    </div>
                </template>
            </CaomeiDataTable>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DataTableColumn } from 'caomei-ui'
import { useConfirm, useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { parseUserAgent } from '@/utils/shared/useragent'
import { formatDateTime } from '@/utils/shared/date'
import type { AdminUserProfile, AdminUserSession } from '@/types/admin'

const props = defineProps<{
    visible: boolean
    user: AdminUserProfile | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const toast = useToast()
const confirm = useConfirm()

const sessionsLoading = ref(false)
const revokeAllLoading = ref(false)
const revokingSession = ref('')
const userSessions = ref<AdminUserSession[]>([])

const columns: DataTableColumn<AdminUserSession>[] = [
    { key: 'token', header: '会话ID', width: '170px' },
    { key: 'userAgent', header: '设备信息', width: '160px' },
    {
        key: 'createdAt',
        header: '创建时间',
        width: '180px',
        accessor: (row) => formatDateTime(row.createdAt),
    },
    {
        key: 'expiresAt',
        header: '到期时间',
        width: '180px',
        accessor: (row) => formatDateTime(row.expiresAt),
    },
    { key: 'actions', header: '操作', width: '100px', align: 'right' },
]

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

const loadUserSessions = async () => {
    if (!props.user) return

    try {
        sessionsLoading.value = true
        const response = await authClient.admin.listUserSessions({
            userId: props.user.id,
        })
        userSessions.value = (response.data?.sessions || []) as AdminUserSession[]
    } catch (error: unknown) {
        console.error('加载用户会话失败:', error)
        toast.danger({
            title: '加载失败',
            description: errorMessage(error, '加载用户会话失败'),
            duration: 3000,
        })
    } finally {
        sessionsLoading.value = false
    }
}

watch(() => props.visible, (newValue) => {
    if (newValue && props.user) {
        loadUserSessions()
    }
})

const revokeUserSession = async (sessionToken: string) => {
    try {
        revokingSession.value = sessionToken

        const response = await authClient.admin.revokeUserSession({
            sessionToken,
        })

        if (response.data) {
            toast.success({
                title: '撤销成功',
                description: '会话已撤销',
                duration: 3000,
            })
            loadUserSessions()
        }
    } catch (error: unknown) {
        console.error('撤销会话失败:', error)
        toast.danger({
            title: '撤销失败',
            description: errorMessage(error, '撤销会话失败'),
            duration: 3000,
        })
    } finally {
        revokingSession.value = ''
    }
}

const revokeAllUserSessions = async () => {
    const targetUser = props.user
    if (!targetUser) return

    const confirmed = await confirm.open({
        title: '确认撤销',
        description: `确定要撤销 ${targetUser.name || targetUser.email} 的所有会话吗？`,
        tone: 'danger',
    })
    if (!confirmed) {
        return
    }

    try {
        revokeAllLoading.value = true

        const response = await authClient.admin.revokeUserSessions({
            userId: targetUser.id,
        })

        if (response.data) {
            toast.success({
                title: '撤销成功',
                description: '所有会话已撤销',
                duration: 3000,
            })
            emit('update:visible', false)
        }
    } catch (error: unknown) {
        console.error('撤销所有会话失败:', error)
        toast.danger({
            title: '撤销失败',
            description: errorMessage(error, '撤销所有会话失败'),
            duration: 3000,
        })
    } finally {
        revokeAllLoading.value = false
    }
}
</script>

<style lang="scss" scoped>
.user-sessions {
    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--admin-border);
    }

    &__title {
        margin: 0;
        color: $primary;
        font-size: 1rem;
    }

    /* 表格表面改用 Admin 语义 token，暗色下与弹窗保持一致 */
    &__table {
        --caomei-color-text: var(--admin-text);
        --caomei-data-table-head-bg: var(--admin-surface-muted);
        --caomei-data-table-border: var(--admin-border);
    }

    &__session-id {
        background: var(--admin-surface-muted);
        white-space: nowrap;
        border-radius: 4px;
        padding: 0.25rem 0.5rem;
        font-family: 'Courier New', monospace;
        font-size: 0.8rem;
    }

    &__device {
        div {
            font-weight: 500;
        }

        small {
            color: var(--admin-muted);
        }
    }

    &__empty {
        padding: 2rem;
        color: var(--admin-muted);
    }
}
</style>
