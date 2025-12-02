<template>
    <div class="form-group">
        <label class="form-label">ID</label>
        <InputText
            id="id"
            v-tooltip.top="privacyMode ? '用户ID已隐藏，点击顶部隐私模式开关可显示' : '当前用户的唯一标识，不可编辑'"
            :value="privacyMode ? maskUserId(user.id) : user.id"
            class="form-input"
            disabled
        />
    </div>
    <div class="form-group">
        <label class="form-label" for="username">用户名</label>
        <InputText
            v-if="user.username"
            id="username"
            v-tooltip.top="privacyMode ? '用户名已隐藏，点击顶部隐私模式开关可显示' : '当前使用的用户名，不可编辑'"
            :value="privacyMode ? maskUsername(user.username) : user.username"
            class="form-input"
            disabled
        />
        <template v-if="!user.username">
            <Button
                v-tooltip.top="'点击设置用户名，设置后可使用用户名密码登录'"
                label="设置用户名"
                text
                size="small"
                class="ml-2"
                @click="emit('openSetUsernameDialog')"
            />
            <Message severity="warn">
                您当前未设置用户名，无法通过用户名密码登录
            </Message>
        </template>
    </div>
    <div class="form-group">
        <label class="form-label" for="nickname">昵称</label>
        <InputText
            id="nickname"
            v-model="user.nickname"
            v-tooltip.top="'您的昵称，可随时修改。2-36个字符。'"
            class="form-input"
        />
    </div>
</template>

<script setup lang="ts">
import { maskUserId, maskUsername } from '@/utils/privacy'

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
