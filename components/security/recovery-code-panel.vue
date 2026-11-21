<template>
    <div class="recovery-codes security-section">
        <h3 class="section-title">
            {{ t('security.recoveryCodes.title') }}
        </h3>
        <p class="section-desc">
            {{ t('security.recoveryCodes.desc') }}
        </p>

        <CaomeiMessage :tone="remaining > 0 ? 'success' : 'warning'">
            <span v-if="remaining > 0">{{ t('security.recoveryCodes.remaining', {count: remaining}) }}</span>
            <span v-else>{{ t('security.recoveryCodes.empty') }}</span>
        </CaomeiMessage>

        <div class="security-actions">
            <CaomeiButton
                class="btn"
                variant="secondary"
                :disabled="loading"
                @click="openGenerateDialog"
            >
                <template #icon>
                    <i class="mdi mdi-key-plus" />
                </template>
                {{ remaining > 0 ? t('security.recoveryCodes.regenerate') : t('security.recoveryCodes.generate') }}
            </CaomeiButton>
        </div>

        <BaseDialogV2
            :visible="showGenerateDialog"
            :title="t('security.recoveryCodes.regenerate')"
            @update:visible="showGenerateDialog = $event"
        >
            <p class="mb-3">
                {{ t('security.recoveryCodes.regenerateTip') }}
            </p>
            <template v-if="twoFactorEnabled">
                <CaomeiFormItem :label="t('security.recoveryCodes.factorLabel')">
                    <CaomeiSelect
                        v-model="factor"
                        :options="factorOptions"
                    />
                </CaomeiFormItem>
                <CaomeiFormItem :label="t('security.recoveryCodes.codeLabel')">
                    <CaomeiInput
                        id="recovery-code-factor-code"
                        v-model="factorCode"
                        autocomplete="one-time-code"
                    />
                </CaomeiFormItem>
            </template>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="showGenerateDialog = false"
                >
                    {{ t('security.recoveryCodes.cancel') }}
                </CaomeiButton>
                <CaomeiButton
                    class="btn btn-primary"
                    :disabled="submitting || (twoFactorEnabled && (!factorCode || !factor))"
                    @click="generate"
                >
                    {{ t('security.recoveryCodes.confirm') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>

        <BaseDialogV2
            :visible="showCodesDialog"
            :title="t('security.recoveryCodes.titleNew')"
            @update:visible="closeCodesDialog"
            @hide="closeCodesDialog"
        >
            <p class="mb-3">
                {{ t('security.recoveryCodes.hint') }}
            </p>
            <div class="recovery-codes__list">
                <code
                    v-for="code in newCodes"
                    :key="code"
                    class="recovery-codes__item"
                >{{ code }}</code>
            </div>
            <template #footer>
                <CaomeiButton
                    variant="secondary"
                    @click="copyCodes"
                >
                    <template #icon>
                        <i class="mdi mdi-content-copy" />
                    </template>
                    {{ t('security.recoveryCodes.copy') }}
                </CaomeiButton>
                <CaomeiButton
                    variant="secondary"
                    @click="downloadCodes"
                >
                    <template #icon>
                        <i class="mdi mdi-download" />
                    </template>
                    {{ t('security.recoveryCodes.download') }}
                </CaomeiButton>
                <CaomeiButton
                    class="btn btn-primary"
                    @click="closeCodesDialog"
                >
                    {{ t('security.recoveryCodes.done') }}
                </CaomeiButton>
            </template>
        </BaseDialogV2>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useToast } from 'caomei-ui'
import BaseDialogV2 from '@/components/base/base-dialog-v2.vue'
import { getApiErrorMessage } from '@/utils/shared/api-error'
import { useI18nText } from '@/composables/utils/use-i18n-text'

export interface RecoveryCodeStatus {
    remaining: number
    total: number
    codes: Array<{ id: string, createdAt: string, usedAt: string | null }>
}

export interface RecoveryCodeApi {
    status: () => Promise<RecoveryCodeStatus>
    regenerate: (payload: { factor?: string, code?: string }) => Promise<{ recoveryCodes: string[], remaining: number }>
}

interface ApiEnvelope<T> { status: boolean, data: T }

function createDefaultApi(): RecoveryCodeApi {
    return {
        status: async () => (await $fetch<ApiEnvelope<RecoveryCodeStatus>>('/api/security/recovery-codes')).data,
        regenerate: async (payload) => (await $fetch<ApiEnvelope<{ recoveryCodes: string[], remaining: number }>>(
            '/api/security/recovery-codes/regenerate',
            { method: 'POST', body: payload },
        )).data,
    }
}

const props = withDefaults(defineProps<{
    twoFactorEnabled?: boolean
    api?: RecoveryCodeApi
}>(), {
    twoFactorEnabled: false,
    api: undefined,
})

const t = useI18nText()
const toast = useToast()
const api = props.api ?? createDefaultApi()

const loading = ref(false)
const submitting = ref(false)
const remaining = ref(0)
const showGenerateDialog = ref(false)
const showCodesDialog = ref(false)
const newCodes = ref<string[]>([])
const factor = ref<'totp' | 'backup-code'>('totp')
const factorCode = ref('')

const factorOptions = computed(() => [
    { label: t('security.recoveryCodes.factorTotp'), value: 'totp' },
    { label: t('security.recoveryCodes.factorBackup'), value: 'backup-code' },
])

async function loadStatus(): Promise<void> {
    loading.value = true
    try {
        const data = await api.status()
        remaining.value = Number(data.remaining) || 0
    } catch (error) {
        toast.danger({ title: t('security.recoveryCodes.loadFailed'), description: getApiErrorMessage(error, t('security.recoveryCodes.loadFailed')) })
    } finally {
        loading.value = false
    }
}

function openGenerateDialog(): void {
    factorCode.value = ''
    showGenerateDialog.value = true
}

async function generate(): Promise<void> {
    submitting.value = true
    try {
        const data = await api.regenerate({
            ...(props.twoFactorEnabled ? { factor: factor.value, code: factorCode.value.trim() } : {}),
        })
        newCodes.value = data.recoveryCodes
        remaining.value = Number(data.remaining) || data.recoveryCodes.length
        showGenerateDialog.value = false
        showCodesDialog.value = true
        factorCode.value = ''
    } catch (error) {
        toast.danger({ title: t('security.recoveryCodes.generateFailed'), description: getApiErrorMessage(error, t('security.recoveryCodes.generateFailed')) })
    } finally {
        submitting.value = false
    }
}

function closeCodesDialog(): void {
    showCodesDialog.value = false
    /* 一次性展示：关闭即清除内存中的明文 */
    newCodes.value = []
}

async function copyCodes(): Promise<void> {
    try {
        await navigator.clipboard.writeText(newCodes.value.join('\n'))
        toast.success({ title: t('security.recoveryCodes.copied') })
    } catch (error) {
        toast.danger({ title: t('security.recoveryCodes.generateFailed'), description: getApiErrorMessage(error, t('security.recoveryCodes.generateFailed')) })
    }
}

function downloadCodes(): void {
    const blob = new Blob([`${newCodes.value.join('\n')}\n`], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'recovery-codes.txt'
    link.click()
    URL.revokeObjectURL(url)
    toast.success({ title: t('security.recoveryCodes.downloaded') })
}

onMounted(loadStatus)
</script>

<style scoped lang="scss">
.recovery-codes {
    &__list {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.5rem;
        padding: 1rem;
        background: $background;
        border: 1px solid $border-color;
        border-radius: 8px;
    }

    &__item {
        padding: 0.5rem;
        background: $background-light;
        border: 1px solid $border-color;
        border-radius: 4px;
        text-align: center;
        font-weight: 600;
        letter-spacing: 1px;
        font-family: 'Courier New', monospace;
    }
}

@include dark-mode {
    .recovery-codes {
        &__list {
            background: #{$dark-background} !important;
            border-color: #{$dark-border-color} !important;
        }

        &__item {
            background: #{$dark-background-light} !important;
            border-color: #{$dark-border-color} !important;
            color: #{$dark-secondary} !important;
        }
    }
}
</style>
