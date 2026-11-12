<template>
    <BaseDialogV2
        :visible="visible"
        title="应用创建成功"
        size="md"
        @update:visible="visible = $event"
    >
        <div class="secret-content">
            <div class="secret-content__icon">
                <i
                    class="mdi mdi-check-circle"
                    aria-hidden="true"
                />
            </div>
            <p class="secret-content__message">
                应用 "{{ application?.client_name }}" 已成功创建！
            </p>
            <div class="secret-content__credentials">
                <div class="credential-item">
                    <span class="credential-item__label">Client ID</span>
                    <div class="credential-item__value">
                        <code>{{ application?.client_id }}</code>
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            label="复制 Client ID"
                            @click="copyToClipboard(application?.client_id)"
                        >
                            <template #icon>
                                <i
                                    class="mdi mdi-content-copy"
                                    aria-hidden="true"
                                />
                            </template>
                        </CaomeiButton>
                    </div>
                </div>
                <div class="credential-item">
                    <span class="credential-item__label">Client Secret</span>
                    <div class="credential-item__value">
                        <code>{{ application?.client_secret }}</code>
                        <CaomeiButton
                            icon-only
                            variant="ghost"
                            label="复制 Client Secret"
                            @click="copyToClipboard(application?.client_secret)"
                        >
                            <template #icon>
                                <i
                                    class="mdi mdi-content-copy"
                                    aria-hidden="true"
                                />
                            </template>
                        </CaomeiButton>
                    </div>
                </div>
            </div>
            <CaomeiAlert
                tone="warning"
                class="secret-content__warning"
            >
                <i
                    class="mdi mdi-alert"
                    aria-hidden="true"
                />
                请务必保存这些凭据，关闭此对话框后将无法再次查看 Client Secret。
            </CaomeiAlert>

            <div class="secret-content__footer">
                <CaomeiButton @click="visible = false">
                    我已保存
                </CaomeiButton>
            </div>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'caomei-ui'
import type { AdminOAuthClientCredentials } from '@/types/admin'

const props = defineProps<{
    visible: boolean
    application: AdminOAuthClientCredentials | null
}>()

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void
}>()

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const toast = useToast()

async function copyToClipboard(text?: string) {
    if (!text) {
        return
    }
    try {
        await navigator.clipboard.writeText(text)
        toast.success({
            title: '已复制',
            description: '内容已复制到剪贴板',
            duration: 2000,
        })
    } catch {
        toast.danger({
            title: '复制失败',
            description: '无法复制到剪贴板',
            duration: 2000,
        })
    }
}
</script>

<style lang="scss" scoped>
.secret-content {
    padding: 1rem;
    text-align: center;

    &__icon {
        margin-bottom: 1rem;
        font-size: 4rem;
        color: var(--caomei-color-success);
    }

    &__message {
        margin-bottom: 2rem;
        font-size: 1.2rem;
        font-weight: 600;
        color: var(--admin-text);
    }

    &__credentials {
        margin-bottom: 1.5rem;
        padding: 1.5rem;
        border: 1px solid var(--admin-border);
        border-radius: 8px;
        background: var(--admin-surface-muted);
        text-align: left;
    }

    &__warning {
        text-align: left;
    }

    &__footer {
        display: flex;
        justify-content: center;
        margin-top: 1rem;
    }
}

.credential-item {
    margin-bottom: 1rem;

    &:last-child {
        margin-bottom: 0;
    }

    &__label {
        display: block;
        margin-bottom: 0.5rem;
        font-size: 0.875rem;
        color: var(--admin-muted);
    }

    &__value {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem;
        border: 1px solid var(--admin-border);
        border-radius: 6px;
        background: var(--admin-surface);

        code {
            flex: 1;
            font-family: monospace;
            color: var(--admin-text);
            word-break: break-all;
        }
    }
}
</style>
