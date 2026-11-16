<template>
    <div class="admin-registration">
        <header class="admin-registration__header">
            <div>
                <h1 class="admin-registration__title">
                    {{ t('admin.registration.title') }}
                </h1>
                <p class="admin-registration__subtitle">
                    {{ t('admin.registration.subtitle') }}
                </p>
            </div>
            <CaomeiButton
                variant="secondary"
                :loading="loading"
                @click="loadRules"
            >
                {{ t('admin.registration.refresh') }}
            </CaomeiButton>
        </header>

        <p class="admin-registration__hint">
            {{ t('admin.registration.hint') }}
        </p>

        <section class="admin-registration__form">
            <CaomeiSelect
                v-model="draft.type"
                :options="typeOptions"
                option-label="label"
                option-value="value"
                :label="t('admin.registration.type')"
            />
            <CaomeiSelect
                v-model="draft.mode"
                :options="modeOptions"
                option-label="label"
                option-value="value"
                :label="t('admin.registration.mode')"
            />
            <CaomeiInput
                v-model="draft.value"
                :label="t('admin.registration.value')"
                :placeholder="t('admin.registration.valuePlaceholder')"
            />
            <CaomeiInput
                v-model="draft.note"
                :label="t('admin.registration.note')"
                :placeholder="t('admin.registration.notePlaceholder')"
            />
            <CaomeiButton :loading="saving" @click="createRule">
                {{ t('admin.registration.add') }}
            </CaomeiButton>
        </section>

        <div class="admin-registration__table-wrapper">
            <table class="admin-registration__table">
                <thead>
                    <tr>
                        <th>{{ t('admin.registration.type') }}</th>
                        <th>{{ t('admin.registration.mode') }}</th>
                        <th>{{ t('admin.registration.value') }}</th>
                        <th>{{ t('admin.registration.note') }}</th>
                        <th>{{ t('admin.registration.enabled') }}</th>
                        <th>{{ t('admin.registration.actions') }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="rule in rules" :key="rule.id">
                        <td>{{ typeLabel(rule.type) }}</td>
                        <td>{{ modeLabel(rule.mode) }}</td>
                        <td><code>{{ rule.value }}</code></td>
                        <td>{{ rule.note || '-' }}</td>
                        <td>
                            <input
                                type="checkbox"
                                :checked="rule.enabled"
                                @change="toggleRule(rule, ($event.target as HTMLInputElement).checked)"
                            >
                        </td>
                        <td>
                            <CaomeiButton
                                variant="secondary"
                                tone="danger"
                                size="sm"
                                @click="removeRule(rule)"
                            >
                                {{ t('admin.registration.delete') }}
                            </CaomeiButton>
                        </td>
                    </tr>
                    <tr v-if="!rules.length">
                        <td colspan="6" class="admin-registration__empty">
                            {{ t('admin.registration.empty') }}
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useToast } from 'caomei-ui'
import { getApiErrorMessage } from '@/utils/shared/api-error'
import { usePageMeta } from '@/composables/utils/use-page-meta'

interface RegistrationRuleRow {
    id: string
    type: 'email-domain' | 'phone-country'
    mode: 'allow' | 'deny'
    value: string
    enabled: boolean
    note: string | null
}

definePageMeta({ layout: 'admin' })
usePageMeta('admin.registration.title', 'admin.registration.subtitle')

const { t } = useI18n()
const toast = useToast()

const rules = ref<RegistrationRuleRow[]>([])
const loading = ref(false)
const saving = ref(false)
const draft = reactive({ type: 'email-domain' as RegistrationRuleRow['type'], mode: 'deny' as RegistrationRuleRow['mode'], value: '', note: '' })

const typeOptions = computed(() => [
    { label: t('admin.registration.typeOptions.email'), value: 'email-domain' },
    { label: t('admin.registration.typeOptions.phone'), value: 'phone-country' },
])
const modeOptions = computed(() => [
    { label: t('admin.registration.modeOptions.allow'), value: 'allow' },
    { label: t('admin.registration.modeOptions.deny'), value: 'deny' },
])

const typeLabel = (type: RegistrationRuleRow['type']) => type === 'phone-country'
    ? t('admin.registration.typeOptions.phone')
    : t('admin.registration.typeOptions.email')
const modeLabel = (mode: RegistrationRuleRow['mode']) => mode === 'allow'
    ? t('admin.registration.modeOptions.allow')
    : t('admin.registration.modeOptions.deny')

const loadRules = async () => {
    try {
        loading.value = true
        const { data } = await $fetch<{ success: boolean, data: { rules: RegistrationRuleRow[] } }>('/api/admin/registration/rules')
        rules.value = data.rules
    } catch (error: unknown) {
        toast.danger({ title: t('admin.registration.failed'), description: getApiErrorMessage(error, t('admin.registration.failed')), duration: 3000 })
    } finally {
        loading.value = false
    }
}

const createRule = async () => {
    if (!draft.value.trim()) {
        return
    }
    try {
        saving.value = true
        await $fetch('/api/admin/registration/rules', {
            method: 'POST',
            body: { type: draft.type, mode: draft.mode, value: draft.value, note: draft.note || null },
        })
        draft.value = ''
        draft.note = ''
        toast.success({ title: t('admin.registration.saved'), duration: 3000 })
        await loadRules()
    } catch (error: unknown) {
        toast.danger({ title: t('admin.registration.failed'), description: getApiErrorMessage(error, t('admin.registration.failed')), duration: 3000 })
    } finally {
        saving.value = false
    }
}

const toggleRule = async (rule: RegistrationRuleRow, enabled: boolean) => {
    try {
        await $fetch(`/api/admin/registration/rules/${rule.id}`, { method: 'PUT', body: { enabled } })
        toast.success({ title: t('admin.registration.saved'), duration: 3000 })
        await loadRules()
    } catch (error: unknown) {
        toast.danger({ title: t('admin.registration.failed'), description: getApiErrorMessage(error, t('admin.registration.failed')), duration: 3000 })
    }
}

const removeRule = async (rule: RegistrationRuleRow) => {
    try {
        await $fetch(`/api/admin/registration/rules/${rule.id}`, { method: 'DELETE' })
        toast.success({ title: t('admin.registration.deleted'), duration: 3000 })
        await loadRules()
    } catch (error: unknown) {
        toast.danger({ title: t('admin.registration.failed'), description: getApiErrorMessage(error, t('admin.registration.failed')), duration: 3000 })
    }
}

onMounted(loadRules)
</script>

<style lang="scss" scoped>
.admin-registration {
    padding: 1.5rem;

    &__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
    }

    &__title {
        margin: 0;
        font-size: 1.5rem;
    }

    &__subtitle,
    &__hint {
        margin: 0.25rem 0 0;
        color: var(--text-muted, #6b7280);
        font-size: 0.875rem;
    }

    &__form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1rem;
        align-items: end;
        margin: 1.5rem 0;
    }

    &__table-wrapper {
        overflow-x: auto;
        border: 1px solid var(--admin-border, #e5e7eb);
        border-radius: 0.5rem;
    }

    &__table {
        width: 100%;
        border-collapse: collapse;
        font-size: 0.875rem;

        th,
        td {
            padding: 0.625rem 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--admin-border, #e5e7eb);
        }

        th {
            font-weight: 600;
            background: var(--admin-surface-muted, #f9fafb);
        }
    }

    &__empty {
        text-align: center;
        color: var(--text-muted, #6b7280);
    }
}
</style>
