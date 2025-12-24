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
                <p class="info-note">
                    注意：通过第三方登录、邮箱验证码、短信验证码等方式注册，导致未设置初始密码的用户，请通过<NuxtLink
                        v-tooltip.top="'点击前往忘记密码页面'"
                        :to="`/forget-password`"
                        class="toggle-link"
                    >
                        「忘记密码」
                    </NuxtLink>页面重置初始密码。
                </p>
                <div class="form-group">
                    <label class="form-label" for="currentPassword">当前密码</label>
                    <Password
                        id="currentPassword"
                        v-model="currentPassword"
                        v-tooltip.top="'请输入您当前正在使用的登录密码'"
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
                        v-tooltip.top="getPasswordRequirementsShort()"
                        class="form-input password-input"
                        placeholder="请输入新密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <PasswordStrength
                        :show-strength="!!newPassword"
                        :password="newPassword"
                        :show-score="false"
                        :min-length-for-display="1"
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
                        v-tooltip.top="'请再次输入相同的新密码以确认'"
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
                        v-tooltip.top="'勾选后，系统将撤销您在其他设备上的所有登录会话'"
                        input-id="revokeSessions"
                        binary
                    />
                    <label class="checkbox-label" for="revokeSessions">撤销用户登录的所有其他会话</label>
                </div>
                <div class="form-group">
                    <Button
                        v-tooltip.top="'点击提交修改密码请求'"
                        class="btn btn-primary mt-2"
                        label="修改密码"
                        @click="changePassword"
                    />
                </div>
                <div class="toggle-login">
                    <NuxtLink
                        v-tooltip.top="'点击返回个人中心页面'"
                        :to="`/profile`"
                        class="toggle-link"
                    >
                        返回个人中心
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import AuthLeft from '@/components/auth-left.vue'
import PasswordStrength from '@/components/password-strength.vue'
import { getPasswordRequirementsShort } from '@/utils/shared/password'
import { useChangePasswordFlow } from '@/composables/use-change-password-flow'

const {
    currentPassword,
    newPassword,
    confirmPassword,
    errors,
    revokeOtherSessions,
    changePassword,
} = useChangePasswordFlow()
</script>

<style scoped lang="scss">

.auth-container {
    display: flex;
    flex-direction: column-reverse;
    background: $background;

    @media (width >= 768px) {
        flex-direction: row;
    }
}

.auth-left {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: 20vh;
    padding: 1rem;
    color: $background-light;
    text-align: center;

    .auth-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (width >= 768px) {
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
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    padding: 1rem;

    @media (width >= 768px) {
        width: 50%;
        min-height: 100vh;
    }
}

.auth-card {
    width: 100%;
    max-width: 450px;
    padding: 2rem;
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgb(0 0 0 / 0.05);
}

.auth-title {
    margin-bottom: 1rem;
    color: $secondary;
    font-weight: 600;
    font-size: 2rem;
}

.auth-subtitle {
    margin-bottom: 1rem;
    color: $secondary-light;
}

.info-note {
    margin-bottom: 1.5rem;
    color: $secondary-light;
    background-color: rgba(230,57,70,0.04);
    border-left: 4px solid $primary;
    padding: 0.75rem 1rem;
    border-radius: 6px;
    font-size: 0.95rem;
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
    top: -3px;
    left: 8px;
}

.form-input {
    width: 100%;
    padding: 0.75rem 1rem;
    font-size: 1rem;
    background-color: $background-light;
    border: 1px solid $secondary-bg;
    border-radius: 8px;
    transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
    border-color: $primary;
    box-shadow: 0 0 0 3px rgb(230 57 70 / 0.2);
}

.btn {
    width: 100%;
    padding: 0.75rem 0;
    font-weight: 500;
    font-size: 1rem;
    text-align: center;
    border-radius: 8px;
}

.btn-primary {
    width: 100%;
    min-height: 44px;
    color: $background-light !important;
    background-color: $primary !important;
    border: none !important;
    box-shadow: none;
    transition: background 0.2s;
}

.btn-primary:hover {
    background-color: $primary-dark !important;
}

.toggle-login {
    margin-top: 1.5rem;
    color: $secondary-light;
    text-align: center;
}

.toggle-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

.p-password {
    width: 100%;
    padding: 0;
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
