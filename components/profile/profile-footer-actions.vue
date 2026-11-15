<template>
    <div class="form-group profile-actions">
        <BaseTooltip :content="t('profile.actions.saveTip')">
            <CaomeiButton
                class="btn btn-primary"
                :loading="saving"
                @click="emit('save')"
            >
                {{ t('profile.actions.save') }}
            </CaomeiButton>
        </BaseTooltip>
        <BaseTooltip :content="t('profile.actions.changePasswordTip')">
            <CaomeiButton
                variant="ghost"
                @click="emit('changePassword')"
            >
                {{ t('profile.actions.changePassword') }}
            </CaomeiButton>
        </BaseTooltip>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()

defineProps<{
    saving: boolean
}>()

const emit = defineEmits<{
    (e: 'save'): void
    (e: 'changePassword'): void
}>()
</script>

<style scoped lang="scss">
.profile-actions {
    display: flex;
    align-items: center;
    gap: 1.5rem;
}

.btn-link {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    margin-left: 0.6rem;
}
</style>
