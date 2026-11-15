<template>
    <BaseTooltip :content="privacyMode ? t('profile.basic.idTipHidden') : t('profile.basic.idTip')">
        <BaseInputV2
            id="id"
            :model-value="privacyMode ? maskUserId(user.id) : user.id"
            :label="t('profile.basic.idLabel')"
            disabled
            data-visual-mask
        />
    </BaseTooltip>
    <BaseTooltip
        v-if="user.username"
        :content="privacyMode ? t('profile.basic.usernameTipHidden') : t('profile.basic.usernameTip')"
    >
        <BaseInputV2
            id="username"
            :model-value="privacyMode ? maskUsername(user.username) : user.username"
            :label="t('profile.basic.usernameLabel')"
            disabled
        />
    </BaseTooltip>
    <div v-else class="form-group">
        <label class="form-label">{{ t('profile.basic.usernameLabel') }}</label>
        <div class="align-items-center flex">
            <BaseTooltip :content="t('profile.basic.setUsernameTip')">
                <CaomeiButton
                    variant="ghost"
                    size="sm"
                    @click="emit('openSetUsernameDialog')"
                >
                    {{ t('profile.basic.setUsername') }}
                </CaomeiButton>
            </BaseTooltip>
        </div>
        <CaomeiMessage tone="warning" class="mt-2">
            {{ t('profile.basic.unsetWarning') }}
        </CaomeiMessage>
    </div>
    <BaseTooltip :content="t('profile.basic.nicknameTip')">
        <BaseInputV2
            id="nickname"
            v-model="user.nickname"
            :label="t('profile.basic.nicknameLabel')"
        />
    </BaseTooltip>
</template>

<script setup lang="ts">
import { maskUserId, maskUsername } from '@/utils/shared/privacy'

const { t } = useI18n()

const props = defineProps<{
    privacyMode: boolean
}>()

const user = defineModel<{
    id: string
    username: string
    nickname: string
}>('user', { required: true })

const emit = defineEmits<{
    (e: 'openSetUsernameDialog'): void
}>()
</script>

<style scoped lang="scss">
.form-group {
    margin-bottom: 1rem;
}

.form-input {
    width: 100%;
}
</style>
