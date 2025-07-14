<template>
    <div class="auth-container">
        <AuthLeft title="修改密码" subtitle="请输入当前密码和新密码以修改密码。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    修改密码
                </h2>
                <p class="auth-subtitle">
                    请输入相关信息以修改密码
                </p>
                <div class="form-group">
                    <label class="form-label" for="currentPassword">当前密码</label>
                    <Password
                        id="currentPassword"
                        v-model="currentPassword"
                        class="form-input password-input"
                        placeholder="请输入当前密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <div v-if="errors.currentPassword" class="error-message">
                        {{ errors.currentPassword }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="newPassword">新密码</label>
                    <Password
                        id="newPassword"
                        v-model="newPassword"
                        class="form-input password-input"
                        placeholder="请输入新密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <div v-if="errors.newPassword" class="error-message">
                        {{ errors.newPassword }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">确认新密码</label>
                    <Password
                        id="confirmPassword"
                        v-model="confirmPassword"
                        class="form-input password-input"
                        placeholder="请再次输入新密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <div v-if="errors.confirmPassword" class="error-message">
                        {{ errors.confirmPassword }}
                    </div>
                </div>
                <div class="form-group">
                    <Checkbox
                        v-model="revokeOtherSessions"
                        input-id="revokeSessions"
                        binary
                    />
                    <label class="checkbox-label" for="revokeSessions">撤销用户登录的所有其他会话</label>
                </div>
                <div class="form-group">
                    <Button
                        class="btn btn-primary mt-2"
                        label="修改密码"
                        @click="changePassword"
                    />
                </div>
                <div class="toggle-login">
                    <NuxtLink :to="`/profile`" class="toggle-link">
                        返回个人中心
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'
import { passwordValidator } from '@/utils/validate'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const errors = ref<Record<string, string>>({})
const toast = useToast()
const revokeOtherSessions = ref(true)

async function changePassword() {
    errors.value = {}

    if (!currentPassword.value) {
        errors.value.currentPassword = '请输入当前密码'
        return
    }
    if (!newPassword.value) {
        errors.value.newPassword = '请输入新密码'
        return
    }
    if (!passwordValidator(newPassword.value)) {
        errors.value.newPassword = '密码必须包含至少1个小写字母、1个大写字母、1个数字和1个特殊字符，且长度至少为8个字符'
        return
    }
    if (!confirmPassword.value) {
        errors.value.confirmPassword = '请确认新密码'
        return
    }
    if (newPassword.value !== confirmPassword.value) {
        errors.value.confirmPassword = '两次输入的密码不一致'
        return
    }

    try {
        await authClient.changePassword({
            newPassword: newPassword.value,
            currentPassword: currentPassword.value,
            revokeOtherSessions: revokeOtherSessions.value,
        })
        toast.add({ severity: 'success', summary: '密码修改成功', detail: '请使用新密码登录', life: 2500 })
        // 可以添加跳转到登录页或其他操作
        setTimeout(() => {
            window.location.href = '/login'
        }, 1500)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '密码修改时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '修改失败',
            detail: errorMessage,
            life: 5000,
        })
    }
}
</script>

<style scoped lang="scss">
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    background: $background;

    @media (min-width: 768px) {
        flex-direction: row;
    }
}

.auth-left {
    color: $background-light;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    min-height: 20vh;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;

        .auth-logo img {
            width: 25%;
            max-width: none;
        }
    }
}

.auth-right {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 1rem;
    min-height: 60vh;

    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 450px;
}

.auth-title {
    color: $secondary;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.auth-subtitle {
    color: $secondary-light;
    margin-bottom: 2rem;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.checkbox-label {
    position: relative;
    left: 8px;
    top: -3px;
}

.form-input {
    border: 1px solid $secondary-bg;
    background-color: $background-light;
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
    font-size: 1rem;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgba(230, 57, 70, 0.2);
}

.btn {
    width: 100%;
    padding: 0.75rem 0;
    border-radius: 8px;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
}

.btn-primary {
    background-color: $primary !important;
    color: $background-light !important;
    border: none !important;
    width: 100%;
    min-height: 44px;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background-color: $primary-dark !important;
}

.toggle-login {
    margin-top: 1.5rem;
    text-align: center;
    color: $secondary-light;
}

.toggle-link {
    color: $primary;
    text-decoration: none;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
}

.p-password {
    padding: 0 0 0 0;
    width: 100%;
}
</style>

<style lang="scss">
.password-input {
    .p-password-input {
        width: 100%;
        border: none;
    }
}
</style>
