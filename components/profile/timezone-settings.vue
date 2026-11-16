<template>
    <div class="timezone-settings">
        <div class="timezone-settings__header">
            <h3 class="timezone-settings__title">
                {{ t('profile.timezone.title') }}
            </h3>
            <p class="timezone-settings__description">
                {{ t('profile.timezone.description') }}
            </p>
        </div>
        <div class="timezone-settings__field">
            <CaomeiSelect
                :model-value="selected"
                :options="options"
                option-label="label"
                option-value="value"
                :label="t('profile.timezone.label')"
                :placeholder="t('profile.timezone.placeholder')"
                :loading="saving"
                @update:model-value="onSelect"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { getTimeZoneOptions } from '@/utils/shared/timezone'
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = defineProps<{
    timezone?: string | null
}>()

const emit = defineEmits<{ (e: 'saved'): void }>()

const { t } = useI18n()
const toast = useToast()
const saving = ref(false)

/* Select 不允许空字符串值，用哨兵表示「跟随浏览器时区」；存库写空串 */
const BROWSER_SENTINEL = '__browser__'

const options = computed(() => [
    { label: t('profile.timezone.followBrowser'), value: BROWSER_SENTINEL },
    ...getTimeZoneOptions(),
])

const selected = computed(() => props.timezone || BROWSER_SENTINEL)

const onSelect = async (value: string | number | null | undefined) => {
    const timezone = value === BROWSER_SENTINEL ? '' : typeof value === 'string' ? value : ''
    try {
        saving.value = true
        const { error } = await authClient.updateUser({ timezone })
        if (error) {
            throw error
        }
        emit('saved')
        toast.success({
            title: t('profile.timezone.savedTitle'),
            description: t('profile.timezone.saved'),
            duration: 3000,
        })
    } catch (error: unknown) {
        toast.danger({
            title: t('profile.timezone.failedTitle'),
            description: getApiErrorMessage(error, t('profile.timezone.failed')),
            duration: 3000,
        })
    } finally {
        saving.value = false
    }
}
</script>

<style lang="scss" scoped>
.timezone-settings {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--admin-border, #e5e7eb);

    &__title {
        margin: 0 0 0.25rem;
        font-size: 1rem;
        font-weight: 600;
    }

    &__description {
        margin: 0 0 0.75rem;
        font-size: 0.875rem;
        color: var(--text-muted, #6b7280);
    }

    &__field {
        max-width: 22rem;
    }
}
</style>
