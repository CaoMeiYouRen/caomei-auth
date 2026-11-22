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

            <div class="user-sessions__trusted">
                <div class="user-sessions__header">
                    <h4 class="user-sessions__title">
                        {{ t('admin.users.sessions.trustedDevices.title') }}
                    </h4>
                </div>
                <p v-if="trustedLoading && !trustedDevices.length" class="user-sessions__hint">
                    {{ t('admin.users.sessions.trustedDevices.loading') }}
                </p>
                <div
                    v-else-if="trustedError"
                    class="user-sessions__trusted-error"
                    role="alert"
                >
                    <span>{{ t('admin.users.sessions.trustedDevices.loadFailed') }}</span>
                    <CaomeiButton
                        variant="secondary"
                        size="sm"
                        @click="loadTrustedDevices"
                    >
                        {{ t('admin.users.sessions.trustedDevices.retry') }}
                    </CaomeiButton>
                </div>
                <p v-else-if="!trustedDevices.length" class="user-sessions__hint">
                    {{ t('admin.users.sessions.trustedDevices.empty') }}
                </p>
                <ul v-else class="user-sessions__trusted-list">
                    <li
                        v-for="device in trustedDevices"
                        :key="device.id"
                        class="user-sessions__trusted-item"
                    >
                        <div>
                            <div>{{ formatDevice(device.userAgent || '') || t('admin.users.sessions.trustedDevices.unknownDevice') }}</div>
                            <small>{{ device.ip || '—' }} · {{ formatDateTimeShort(device.lastUsedAt) }}</small>
                        </div>
                        <CaomeiTag
                            v-if="device.expired"
                            tone="danger"
                            variant="soft"
                        >
                            {{ t('admin.users.sessions.trustedDevices.expired') }}
                        </CaomeiTag>
                        <CaomeiButton
                            variant="secondary"
                            tone="danger"
                            size="sm"
                            @click="revokeTrusted(device)"
                        >
                            {{ t('admin.users.sessions.trustedDevices.revoke') }}
                        </CaomeiButton>
                    </li>
                </ul>
            </div>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { DataTableColumn } from 'caomei-ui'
import { useConfirm, useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { parseUserAgent } from '@/utils/shared/useragent'
import { formatDevice } from '@/utils/web/device'
import type { AdminUserProfile, AdminUserSession } from '@/types/admin'
import { getApiErrorMessage, throwIfAuthError } from '@/utils/shared/api-error'
import { useLocaleDate } from '@/composables/use-locale-date'

const props = defineProps<{
    visible: boolean
    user: AdminUserProfile | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const { t } = useI18n()
const { formatDateTimeShort } = useLocaleDate()
const toast = useToast()
const confirm = useConfirm()

const sessionsLoading = ref(false)
const revokeAllLoading = ref(false)
const revokingSession = ref('')
const trustedDevices = ref<Array<{ id: string, userAgent: string | null, ip: string | null, lastUsedAt: string, expiresAt: string, expired: boolean }>>([])
const trustedLoading = ref(false)
const trustedError = ref(false)

const loadTrustedDevices = async () => {
    const targetUser = props.user
    if (!targetUser) return
    try {
        trustedLoading.value = true
        trustedError.value = false
        const response = await $fetch<{ data: { devices: typeof trustedDevices.value } }>(`/api/admin/users/${encodeURIComponent(targetUser.id)}/trusted-devices`)
        trustedDevices.value = response.data.devices
    } catch (error) {
        console.error('Failed to load trusted devices:', error)
        trustedError.value = true
        trustedDevices.value = []
    } finally {
        trustedLoading.value = false
    }
}

const revokeTrusted = async (device: { id: string }) => {
    const targetUser = props.user
    if (!targetUser) return
    const confirmed = await confirm.open({
        title: t('admin.users.sessions.trustedDevices.confirmTitle'),
        description: t('admin.users.sessions.trustedDevices.confirmDescription'),
        tone: 'danger',
    })
    if (!confirmed) return
    try {
        await $fetch(`/api/admin/users/${encodeURIComponent(targetUser.id)}/trusted-devices/${encodeURIComponent(device.id)}`, { method: 'DELETE' })
        toast.success({ title: t('admin.users.sessions.trustedDevices.revokeSuccess'), duration: 3000 })
        await loadTrustedDevices()
    } catch (error) {
        toast.danger({
            title: t('admin.users.sessions.trustedDevices.revokeFailed'),
            description: getApiErrorMessage(error, t('admin.users.sessions.trustedDevices.revokeFailed')),
            duration: 3000,
        })
    }
}
const userSessions = ref<AdminUserSession[]>([])

const columns: DataTableColumn<AdminUserSession>[] = [
    { key: 'token', header: t('admin.users.sessions.columns.token'), width: '170px' },
    { key: 'userAgent', header: t('admin.users.sessions.columns.device'), width: '160px' },
    {
        key: 'createdAt',
        header: t('admin.users.sessions.columns.createdAt'),
        width: '180px',
        accessor: (row) => formatDateTimeShort(row.createdAt),
    },
    {
        key: 'expiresAt',
        header: t('admin.users.sessions.columns.expiresAt'),
        width: '180px',
        accessor: (row) => formatDateTimeShort(row.expiresAt),
    },
    { key: 'actions', header: t('admin.users.sessions.columns.actions'), width: '100px', align: 'right' },
]

const loadUserSessions = async () => {
    if (!props.user) return

    try {
        sessionsLoading.value = true
        /* 失败时不能保留上一个用户的会话列表 */
        userSessions.value = []
        const response = await authClient.admin.listUserSessions({
            userId: props.user.id,
        })
        throwIfAuthError(response, t('admin.users.sessions.loadFailed'))
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
        loadTrustedDevices()
    }
})

const revokeUserSession = async (sessionToken: string) => {
    try {
        revokingSession.value = sessionToken

        const response = await authClient.admin.revokeUserSession({
            sessionToken,
        })

        throwIfAuthError(response, t('admin.users.sessions.revokeFailed'))

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

        await $fetch(`/api/admin/users/${encodeURIComponent(targetUser.id)}/revoke-sessions`, { method: 'POST' })

        toast.success({
            title: t('admin.users.sessions.revokeAllSuccessTitle'),
            description: t('admin.users.sessions.revokeAllSuccess'),
            duration: 3000,
        })
        emit('update:visible', false)
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

.user-sessions__trusted {
    margin-top: 1.5rem;
    border-top: 1px solid var(--admin-border);
    padding-top: 1rem;
}

.user-sessions__hint {
    color: var(--admin-muted);
}

.user-sessions__trusted-error {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
}

.user-sessions__trusted-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0;
    margin: 0;
    list-style: none;
}

.user-sessions__trusted-item {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--admin-border);
    border-radius: 8px;
}
</style>
