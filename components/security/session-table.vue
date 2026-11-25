<template>
    <div class="security-section">
        <h3 class="section-title">
            {{ t('security.sessions.title') }}
        </h3>
        <p class="section-desc">
            {{ t('security.sessions.desc') }}
        </p>
        <ul class="security-device-list">
            <li class="device-list-header">
                <span>{{ t('security.sessions.columns.token') }}</span>
                <span>{{ t('security.sessions.columns.browser') }}</span>
                <span>{{ t('security.sessions.columns.os') }}</span>
                <span>{{ t('security.sessions.columns.ip') }}</span>
                <span>{{ t('security.sessions.columns.createdAt') }}</span>
                <span>{{ t('security.sessions.columns.expiresAt') }}</span>
                <span class="device-action-col" />
            </li>
            <li
                v-for="session in sessionList"
                :key="session.id"
                class="device-list-row"
            >
                <BaseTooltip
                    v-if="userSession?.session?.id === session.id"
                    :content="t('security.sessions.currentTip', {id: session.id})"
                >
                    <span :data-label="t('security.sessions.columns.token')">{{ t('security.sessions.current') }}</span>
                </BaseTooltip>
                <BaseTooltip
                    v-else
                    :content="t('security.sessions.tokenTip', {id: session.id})"
                >
                    <span
                        data-visual-mask
                        :data-label="t('security.sessions.columns.token')"
                    >{{ session.id }}</span>
                </BaseTooltip>
                <span :data-label="t('security.sessions.columns.browser')">{{ session.browser }}</span>
                <span :data-label="t('security.sessions.columns.os')">{{ session.os }}</span>
                <span
                    data-visual-mask
                    :data-label="t('security.sessions.columns.ip')"
                >{{ session.ipAddress }}</span>
                <span
                    data-visual-mask
                    :data-label="t('security.sessions.columns.createdAt')"
                >{{ session.createdAt }}</span>
                <span
                    data-visual-mask
                    :data-label="t('security.sessions.columns.expiresAt')"
                >{{ session.expiresAt }}</span>
                <span class="device-action-col">
                    <BaseTooltip :content="userSession?.session?.id === session.id ? t('security.sessions.cannotRevokeTip') : t('security.sessions.revokeTip')">
                        <CaomeiButton
                            variant="secondary"
                            class="btn"
                            :disabled="userSession?.session?.id === session.id"
                            @click="$emit('revokeSession', session.token)"
                        >
                            <template #icon>
                                <i class="mdi mdi-close" />
                            </template>
                            {{ t('security.sessions.revoke') }}
                        </CaomeiButton>
                    </BaseTooltip>
                </span>
            </li>
        </ul>
        <div class="security-actions">
            <BaseTooltip :content="t('security.sessions.revokeOthersTip')">
                <CaomeiButton
                    class="btn"
                    @click="$emit('revokeOtherSessions')"
                >
                    <template #icon>
                        <i class="mdi mdi-logout-variant" />
                    </template>
                    {{ t('security.sessions.revokeOthers') }}
                </CaomeiButton>
            </BaseTooltip>
            <BaseTooltip :content="t('security.sessions.revokeAllTip')">
                <CaomeiButton
                    class="btn"
                    @click="$emit('revokeAllSessions')"
                >
                    <template #icon>
                        <i class="mdi mdi-logout-variant" />
                    </template>
                    {{ t('security.sessions.revokeAll') }}
                </CaomeiButton>
            </BaseTooltip>
        </div>

        <!-- 撤销单个会话确认对话框 -->
        <BaseDialogV2
            :visible="showRevokeSessionConfirm"
            :title="t('security.sessions.confirmRevokeTitle')"
            @update:visible="$emit('update:showRevokeSessionConfirm', $event)"
        >
            <p>{{ t('security.sessions.confirmRevoke') }}</p>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showRevokeSessionConfirm', false)"
                >
                    {{ t('security.sessions.cancel') }}
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmRevokeSession')">
                    {{ t('security.sessions.confirm') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>
        <!-- 撤销其他会话确认对话框 -->
        <BaseDialogV2
            :visible="showRevokeOtherSessionsConfirm"
            :title="t('security.sessions.confirmRevokeOthersTitle')"
            @update:visible="$emit('update:showRevokeOtherSessionsConfirm', $event)"
        >
            <p>{{ t('security.sessions.confirmRevokeOthers') }}</p>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showRevokeOtherSessionsConfirm', false)"
                >
                    {{ t('security.sessions.cancel') }}
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmRevokeOtherSessions')">
                    {{ t('security.sessions.confirm') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>
        <!-- 撤销所有会话确认对话框 -->
        <BaseDialogV2
            :visible="showRevokeAllSessionsConfirm"
            :title="t('security.sessions.confirmRevokeAllTitle')"
            @update:visible="$emit('update:showRevokeAllSessionsConfirm', $event)"
        >
            <p>{{ t('security.sessions.confirmRevokeAll') }}</p>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="$emit('update:showRevokeAllSessionsConfirm', false)"
                >
                    {{ t('security.sessions.cancel') }}
                </CaomeiButton>
                <CaomeiButton @click="$emit('confirmRevokeAllSessions')">
                    {{ t('security.sessions.confirm') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

defineProps<{
    userSession: any
    sessionList: any[]
    showRevokeSessionConfirm: boolean
    showRevokeOtherSessionsConfirm: boolean
    showRevokeAllSessionsConfirm: boolean
}>()

defineEmits<{
    (e: 'revokeSession', token: string): void
    (e: 'revokeOtherSessions'): void
    (e: 'revokeAllSessions'): void
    (e: 'confirmRevokeSession'): void
    (e: 'confirmRevokeOtherSessions'): void
    (e: 'confirmRevokeAllSessions'): void
    (e: 'update:showRevokeSessionConfirm', value: boolean): void
    (e: 'update:showRevokeOtherSessionsConfirm', value: boolean): void
    (e: 'update:showRevokeAllSessionsConfirm', value: boolean): void
}>()
</script>

<style scoped lang="scss">
.section-title {
    font-size: 1.18rem;
    color: $primary-dark;
    font-weight: 600;
    margin-bottom: 0.7rem;
}

.section-desc {
    color: $secondary-light;
    font-size: 1rem;
    margin-bottom: 1rem;
}

.security-section {
    margin-bottom: 2rem;
}

.security-device-list {
    padding-left: 0;
    width: 100%;

    .device-list-header,
    .device-list-row {
        display: flex;
        align-items: center;
        gap: 1.2rem;
        padding: 0.3rem 0;
        font-size: 1rem;
    }

    .device-list-header {
        font-weight: 600;
        color: $secondary;
        border-bottom: 1px solid $secondary-bg;
        margin-bottom: 0.3rem;

        span {
            flex: 1;
        }

        .device-action-col {
            flex: 0 0 100px;
        }
    }

    .device-list-row {
        span {
            flex: 1;
            word-break: break-all;
        }

        .device-action-col {
            flex: 0 0 100px;
            display: flex;
            justify-content: flex-end;
        }
    }
}

.security-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1rem;
    justify-content: flex-end;

    :deep(.btn) {
        max-width: 180px;
    }
}

/* 移动端：会话表改为卡片式，保留设备 / 掩码 / 时间 / 操作四类信息，桌面表格不变 */
@media (width <= 768px) {
    .security-device-list {
        .device-list-header {
            display: none;
        }

        .device-list-row {
            display: grid;
            grid-template-columns: minmax(0, 1fr);
            gap: 0.35rem;
            margin-bottom: 0.75rem;
            padding: 0.9rem 1rem;
            border: 1px solid $secondary-bg;
            border-radius: 10px;

            span {
                flex: none;
                word-break: normal;
                overflow-wrap: anywhere;
            }

            span[data-label]::before {
                content: attr(data-label);
                margin-inline-end: 0.35rem;
                color: $secondary-light;
                font-weight: 500;
            }

            .device-action-col {
                justify-content: flex-start;

                :deep(.btn) {
                    width: auto;
                }
            }
        }
    }
}

// 暗色模式支持
@include dark-mode {
    .section-title {
        color: #{$primary-light} !important;
    }

    .section-desc {
        color: #{$dark-secondary-light} !important;
    }

    .security-device-list {
        .device-list-header {
            color: #{$dark-secondary} !important;
            border-color: #{$dark-border-color} !important;
        }

        .device-list-row {
            border-color: #{$dark-border-color} !important;

            span {
                color: #{$dark-secondary-light} !important;
            }

            span[data-label]::before {
                color: #{$dark-secondary-light} !important;
            }
        }
    }
}
</style>
