<template>
    <div class="auth-container">
        <AuthLeft title="注册新账号" subtitle="欢迎加入草梅 Auth，支持邮箱、手机号注册，可设置用户名。" />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    创建新账号
                </h2>
                <p class="auth-subtitle">
                    请填写以下信息完成注册
                </p>
                <div class="card form-group">
                    <ButtonGroup>
                        <Button
                            label="邮箱"
                            icon="mdi mdi-email"
                            :class="{'p-button-outlined': activeTab !== 'email'}"
                            @click="changeMode('email')"
                        />
                        <Button
                            v-if="phoneEnabled"
                            v-tooltip.top="'使用手机号注册'"
                            label="手机号"
                            icon="mdi mdi-phone"
                            :class="{'p-button-outlined': activeTab!== 'phone'}"
                            @click="changeMode('phone')"
                        />
                    </ButtonGroup>
                </div>

                <!-- 邮箱注册表单 -->
                <div v-show="activeTab === 'email'">
                    <BaseBaseInput
                        id="nickname"
                        v-model="nickname"
                        v-tooltip.top="'昵称长度为2到36个字符，不能包含特殊控制字符。\n昵称将用于展示'"
                        label="昵称"
                        placeholder="请输入昵称"
                        :error="errors.nickname"
                        required
                    />
                    <div v-if="usernameEnabled">
                        <BaseBaseInput
                            id="username"
                            v-model="username"
                            v-tooltip.top="'用户名长度为2到36个字符，只能包含字母、数字、下划线和连字符。\n用户名将用于登录'"
                            label="用户名"
                            placeholder="请输入用户名"
                            :error="errors.username"
                            required
                        />
                    </div>
                    <BaseBaseInput
                        id="email"
                        v-model="email"
                        v-tooltip.top="'请输入有效的邮箱地址，用于接收验证邮件'"
                        label="邮箱"
                        placeholder="example@mail.com"
                        :error="errors.email"
                        required
                    />
                    <BaseBasePassword
                        id="password"
                        v-model="password"
                        v-tooltip.top="getPasswordRequirementsShort()"
                        label="密码"
                        placeholder="请输入密码"
                        :error="errors.password"
                        required
                        :feedback="false"
                        toggle-mask
                    >
                        <template #append>
                            <PasswordStrength
                                :show-strength="!!password"
                                :password="password"
                                :show-score="false"
                                :min-length-for-display="1"
                            />
                        </template>
                    </BaseBasePassword>
                    <BaseBasePassword
                        id="confirmPassword"
                        v-model="confirmPassword"
                        v-tooltip.top="'请再次输入相同的密码以确认'"
                        label="确认密码"
                        placeholder="请再次输入密码"
                        :error="errors.confirmPassword"
                        required
                        :feedback="false"
                        toggle-mask
                    />
                </div>

                <!-- 手机号注册表单 -->
                <div v-show="activeTab === 'phone'">
                    <BaseBaseInput
                        id="nickname"
                        v-model="nickname"
                        v-tooltip.top="'昵称长度为2到36个字符，不能包含特殊字符。\n昵称将用于展示'"
                        label="昵称"
                        placeholder="请输入昵称"
                        :error="errors.nickname"
                        required
                    />
                    <div v-if="usernameEnabled">
                        <BaseBaseInput
                            id="username"
                            v-model="username"
                            v-tooltip.top="'用户名长度为2到36个字符，只能包含字母、数字、下划线和连字符。\n用户名将用于登录'"
                            label="用户名"
                            placeholder="请输入用户名"
                            :error="errors.username"
                            required
                        />
                    </div>
                    <BasePhoneInput
                        id="phone"
                        v-model="phone"
                        v-tooltip.top="'请输入有效的手机号，用于接收短信验证码'"
                        label="手机号"
                        :error="errors.phone"
                        required
                    />
                    <BaseBaseInput
                        id="phoneCode"
                        v-model="phoneCode"
                        v-tooltip.top="'请输入发送到您手机的短信验证码'"
                        label="短信验证码"
                        placeholder="请输入短信验证码"
                        :error="errors.phoneCode"
                        required
                    >
                        <template #append>
                            <SendCodeButton
                                v-tooltip.top="'点击获取短信验证码，验证码将发送到您输入的手机号'"
                                :on-send="sendPhoneCode"
                                :duration="60"
                                :disabled="phoneCodeSending || !validatePhone(phone)"
                                :loading="phoneCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </template>
                    </BaseBaseInput>
                </div>

                <!-- 用户协议和隐私政策 -->
                <div class="agreement-section form-group">
                    <div v-tooltip.top="'勾选表示您已阅读并同意服务条款和隐私政策'" class="agreement-checkbox">
                        <Checkbox
                            v-model="agreedToTerms"

                            input-id="agreement"
                            binary
                        />
                        <label for="agreement" class="checkbox-label">
                            我已阅读并同意
                            <NuxtLink
                                to="/terms"
                                target="_blank"
                                class="agreement-link"
                            >
                                《服务条款》
                            </NuxtLink>
                            和
                            <NuxtLink
                                to="/privacy"
                                target="_blank"
                                class="agreement-link"
                            >
                                《隐私政策》
                            </NuxtLink>
                        </label>
                    </div>
                    <Message
                        v-if="errors.agreement"
                        severity="error"
                        size="small"
                        variant="simple"
                    >
                        {{ errors.agreement }}
                    </Message>
                </div>

                <Captcha ref="captcha" />
                <Message
                    v-if="errors.captcha"
                    severity="error"
                    size="small"
                    variant="simple"
                >
                    {{ errors.captcha }}
                </Message>

                <Button
                    class="btn btn-primary mt-2"
                    label="注册"
                    @click="register"
                />
                <div class="toggle-login">
                    已有账号？ <NuxtLink
                        :to="`/login?mode=${activeTab}`"
                        class="toggle-link"
                    >
                        立即登录
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import Message from 'primevue/message'
import Checkbox from 'primevue/checkbox'
import ButtonGroup from 'primevue/buttongroup'
import { validatePhone } from '@/utils/validate'
import SendCodeButton from '@/components/send-code-button.vue'
import AuthLeft from '@/components/auth-left.vue'
import PasswordStrength from '@/components/password-strength.vue'
import { getPasswordRequirementsShort } from '@/utils/password'
import Captcha from '@/components/captcha.vue'
import { useRegisterFlow } from '@/composables/use-register-flow'

const {
    nickname,
    username,
    email,
    phone,
    phoneCode,
    password,
    confirmPassword,
    agreedToTerms,
    errors,
    loading,
    captcha,
    activeTab,
    phoneCodeSending,
    phoneEnabled,
    usernameEnabled,
    changeMode,
    sendPhoneCode,
    register,
} = useRegisterFlow()
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
    margin-bottom: 2rem;
    color: $secondary-light;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
}

.form-input {
    width: 100%;
    margin-bottom: 0.25rem;
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

.register-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.card {
    display: flex;
    justify-content: center;
    width: 100%;
}

.separator {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    justify-content: center;
    margin: 2rem 0;
    color: $secondary-light;

    &::before,
    &::after {
        flex: 1;
        border-bottom: 1px solid $secondary-bg;
        content: "";
    }

    &::before {
        margin-right: 1rem;
    }

    &::after {
        margin-left: 1rem;
    }
}

.toggle-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
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

.p-password {
    width: 100%;
    padding: 0;
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.code-btn {
    min-width: 110px;
    padding: 0.75rem;
    font-size: 0.95rem;
    margin-top: -5px;
}

.toggle-login {
    margin-top: 1em;
}

.agreement-section {
    margin-bottom: 1.2rem;
}

.agreement-checkbox {
    display: flex;
    gap: 0.5rem;
    align-items: flex-start;
}

.checkbox-label {
    color: $secondary;
    font-size: 0.9rem;
    line-height: 1.5;
    cursor: pointer;
    user-select: none;
}

.agreement-link {
    color: $primary;
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

// 深色主题下的注册页面优化
@include auth-page-extended-dark-theme;
</style>
