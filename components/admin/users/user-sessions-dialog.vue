<template>
    <BaseDialogV2
        :visible="visible"
        :title="t('admin.users.sessions.title')"
        size="lg"
        :breakpoints="{'1920px': '860px'}"
        @update:visible="$emit('update:visible', $event)"
    >
        <div v-if="user" class="user-sessions">
            <div class="user-sessions__header">
                <h4 class="user-sessions__title">
                    {{ t('admin.users.sessions.activeSessions', {name: user.name || user.email}) }}
                </h4>
                <CaomeiButton
                    variant="secondary"
                    tone="danger"
                    size="sm"
                    :loading="revokeAllLoading"
                    @click="revokeAllUserSessions"
                >
                    {{ t('admin.users.sessions.revokeAll') }}
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
                        {{ t('admin.users.sessions.revoke') }}
                    </CaomeiButton>
                </template>

                <template #empty>
                    <div class="user-sessions__empty">
                        {{ t('admin.users.sessions.empty') }}
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
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = defineProps<{
    visible: boolean
    user: AdminUserProfile | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const { t } = useI18n()
const toast = useToast()
const confirm = useConfirm()

const sessionsLoading = ref(false)
const revokeAllLoading = ref(false)
const revokingSession = ref('')
const userSessions = ref<AdminUserSession[]>([])

const columns: DataTableColumn<AdminUserSession>[] = [
    { key: 'token', header: t('admin.users.sessions.columns.token'), width: '170px' },
    { key: 'userAgent', header: t('admin.users.sessions.columns.device'), width: '160px' },
    {
        key: 'createdAt',
        header: t('admin.users.sessions.columns.createdAt'),
        width: '180px',
        accessor: (row) => formatDateTime(row.createdAt),
    },
    {
        key: 'expiresAt',
        header: t('admin.users.sessions.columns.expiresAt'),
        width: '180px',
        accessor: (row) => formatDateTime(row.expiresAt),
    },
    { key: 'actions', header: t('admin.users.sessions.columns.actions'), width: '100px', align: 'right' },
]

const loadUserSessions = async () => {
    if (!props.user) return

    try {
        sessionsLoading.value = true
        const response = await authClient.admin.listUserSessions({
            userId: props.user.id,
        })
        userSessions.value = (response.data?.sessions || []) as AdminUserSession[]
    } catch (error: unknown) {
        console.error('Failed to load user sessions:', error)
        toast.danger({
            title: t('admin.users.sessions.loadFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.sessions.loadFailed')),
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
                title: t('admin.users.sessions.revokeSuccessTitle'),
                description: t('admin.users.sessions.revokeSuccess'),
                duration: 3000,
            })
            loadUserSessions()
        }
    } catch (error: unknown) {
        console.error('Failed to revoke session:', error)
        toast.danger({
            title: t('admin.users.sessions.revokeFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.sessions.revokeFailed')),
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
        title: t('admin.users.sessions.confirmTitle'),
        description: t('admin.users.sessions.confirmDescription', { name: targetUser.name || targetUser.email }),
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
                title: t('admin.users.sessions.revokeAllSuccessTitle'),
                description: t('admin.users.sessions.revokeAllSuccess'),
                duration: 3000,
            })
            emit('update:visible', false)
        }
    } catch (error: unknown) {
        console.error('Failed to revoke all sessions:', error)
        toast.danger({
            title: t('admin.users.sessions.revokeAllFailedTitle'),
            description: getApiErrorMessage(error, t('admin.users.sessions.revokeAllFailed')),
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
