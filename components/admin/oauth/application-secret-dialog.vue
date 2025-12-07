<template>
    <BaseDialog
        v-model:visible="visible"
        title="应用创建成功"
        :show-footer="false"
        class="secret-dialog"
    >
        <div class="secret-content">
            <div class="success-icon">
                <i class="mdi mdi-check-circle" />
            </div>
            <p class="success-message">
                应用 "{{ application?.client_name }}" 已成功创建！
            </p>
            <div class="credentials">
                <div class="credential-item">
                    <label>Client ID</label>
                    <div class="credential-value">
                        <code>{{ application?.client_id }}</code>
                        <Button
                            icon="mdi mdi-content-copy"
                            class="p-button-sm p-button-text"
                            @click="copyToClipboard(application?.client_id)"
                        />
                    </div>
                </div>
                <div class="credential-item">
                    <label>Client Secret</label>
                    <div class="credential-value">
                        <code>{{ application?.client_secret }}</code>
                        <Button
                            icon="mdi mdi-content-copy"
                            class="p-button-sm p-button-text"
                            @click="copyToClipboard(application?.client_secret)"
                        />
                    </div>
                </div>
            </div>
            <div class="warning">
                <i class="mdi mdi-alert" />
                <span>请务必保存这些凭据，关闭此对话框后将无法再次查看 Client Secret。</span>
            </div>
            <div class="dialog-footer" style="justify-content: center; margin-top: 1rem;">
                <Button label="我已保存" @click="visible = false" />
            </div>
        </div>
    </BaseDialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'

const props = defineProps<{
    visible: boolean
    application: any
}>()

const emit = defineEmits(['update:visible'])

const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value),
})

const toast = useToast()

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
</script>

<style lang="scss" scoped>
.secret-content {
    text-align: center;
    padding: 1rem;

    .success-icon {
        font-size: 4rem;
        color: #48bb78;
        margin-bottom: 1rem;
    }

    .success-message {
        font-size: 1.2rem;
        font-weight: 600;
        color: #2d3748;
        margin-bottom: 2rem;
    }

    .credentials {
        background: #f7fafc;
        border-radius: 8px;
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
                font-size: 0.875rem;
                color: #718096;
                margin-bottom: 0.5rem;
            }

            .credential-value {
                display: flex;
                align-items: center;
                background: white;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                padding: 0.5rem;

                code {
                    flex: 1;
                    font-family: monospace;
                    color: #2d3748;
                    word-break: break-all;
                }
            }
        }
    }

    .warning {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #fffaf0;
        border: 1px solid #fbd38d;
        color: #c05621;
        padding: 1rem;
        border-radius: 6px;
        font-size: 0.875rem;
        text-align: left;

        i {
            font-size: 1.2rem;
        }
    }
}
</style>
