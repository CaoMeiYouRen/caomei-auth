<template>
    <BaseInput
        id="id"
        v-tooltip.top="privacyMode ? '用户ID已隐藏，点击顶部隐私模式开关可显示' : '当前用户的唯一标识，不可编辑'"
        :model-value="privacyMode ? maskUserId(user.id) : user.id"
        label="ID"
        disabled
    />
    <BaseInput
        v-if="user.username"
        id="username"
        v-tooltip.top="privacyMode ? '用户名已隐藏，点击顶部隐私模式开关可显示' : '当前使用的用户名，不可编辑'"
        :model-value="privacyMode ? maskUsername(user.username) : user.username"
        label="用户名"
        disabled
    />
    <div v-else class="form-group">
        <label class="form-label">用户名</label>
        <div class="align-items-center flex">
            <Button
                v-tooltip.top="'点击设置用户名，设置后可使用用户名密码登录'"
                label="设置用户名"
                text
                size="small"
                @click="emit('openSetUsernameDialog')"
            />
        </div>
        <Message severity="warn" class="mt-2">
            您当前未设置用户名，无法通过用户名密码登录
        </Message>
    </div>
    <BaseInput
        id="nickname"
        v-model="user.nickname"
        v-tooltip.top="'您的昵称，可随时修改。2-36个字符。'"
        label="昵称"
    />
</template>

<script setup lang="ts">
import { maskUserId, maskUsername } from '@/utils/shared/privacy'

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
