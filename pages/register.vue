<template>
    <div class="auth-container">
        <AuthLeft
            title="注册新账号"
            subtitle="欢迎加入草梅 Auth，支持邮箱、手机号注册。"
        />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    创建新账号
                </h2>
                <p class="auth-subtitle">
                    请填写以下信息完成注册
                </p>
                <div class="form-group">
                    <label class="form-label" for="username">用户名 <span style="color: #e63946">*</span></label>
                    <InputText
                        id="username"
                        v-model="username"
                        class="form-input"
                        placeholder="请输入用户名"
                    />
                    <div v-if="errors.username" class="error-message">
                        {{ errors.username }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="email">邮箱 <span style="color: #e63946">*</span></label>
                    <InputText
                        id="email"
                        v-model="email"
                        class="form-input"
                        placeholder="example@mail.com"
                    />
                    <div v-if="errors.email" class="error-message">
                        {{ errors.email }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="password">密码 <span style="color: #e63946">*</span></label>
                    <Password
                        id="password"
                        v-model="password"
                        class="form-input password-input"
                        placeholder="请输入密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <div v-if="errors.password" class="error-message">
                        {{ errors.password }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="confirmPassword">确认密码 <span style="color: #e63946">*</span></label>
                    <Password
                        id="confirmPassword"
                        v-model="confirmPassword"
                        class="form-input password-input"
                        placeholder="请再次输入密码"
                        :feedback="false"
                        toggle-mask
                    />
                    <div v-if="errors.confirmPassword" class="error-message">
                        {{ errors.confirmPassword }}
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label" for="phone">手机号（选填）</label>
                    <InputText
                        id="phone"
                        v-model="phone"
                        class="form-input"
                        placeholder="请输入手机号"
                    />
                    <div v-if="errors.phone" class="error-message">
                        {{ errors.phone }}
                    </div>
                </div>
                <div v-if="phone" class="form-group">
                    <label class="form-label" for="phoneCode">短信验证码</label>
                    <div class="code-row">
                        <InputText
                            id="phoneCode"
                            v-model="phoneCode"
                            class="form-input"
                            placeholder="请输入短信验证码"
                        />
                        <SendCodeButton
                            :on-send="sendPhoneCode"
                            :duration="60"
                            :disabled="phoneCodeSending || !validatePhone(phone)"
                            :loading="phoneCodeSending"
                            text="获取验证码"
                            resend-text="重新发送"
                        />
                    </div>
                    <div v-if="errors.phoneCode" class="error-message">
                        {{ errors.phoneCode }}
                    </div>
                </div>
                <Button
                    class="btn btn-primary mt-2"
                    label="注册"
                    @click="register"
                />
                <div class="toggle-login">
                    已有账号？ <NuxtLink to="/login" class="toggle-link">
                        立即登录
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import { useToast } from 'primevue/usetoast'
import { validateEmail, validatePhone } from '@/utils/validate'
import { useSendPhoneCode } from '@/utils/code'
import SendCodeButton from '@/components/send-code-button.vue'
import AuthLeft from '@/components/auth-left.vue'
import { authClient } from '@/lib/auth-client'

const username = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const phone = ref('')
const phoneCode = ref('')
const phoneCodeSending = ref(false)
const errors = ref<Record<string, string>>({})
const toast = useToast()

const sendPhoneCode = useSendPhoneCode(phone, validatePhone, errors, phoneCodeSending)

async function register() {
    errors.value = {}
    let isValid = true
    if (!username.value) {
        errors.value.username = '请输入用户名'
        isValid = false
    }
    if (!email.value) {
        errors.value.email = '请输入邮箱'
        isValid = false
    } else if (!validateEmail(email.value)) {
        errors.value.email = '请输入有效的邮箱地址'
        isValid = false
    }
    if (!password.value) {
        errors.value.password = '请输入密码'
        isValid = false
    }
    if (!confirmPassword.value) {
        errors.value.confirmPassword = '请确认密码'
        isValid = false
    } else if (password.value !== confirmPassword.value) {
        errors.value.confirmPassword = '两次输入的密码不一致'
        isValid = false
    }
    if (phone.value) {
        if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            isValid = false
        }
        if (!phoneCode.value) {
            errors.value.phoneCode = '请输入短信验证码'
            isValid = false
        }
    }
    if (!isValid) {
        return
    }

    try {
        // 使用邮箱和用户名注册
        const { data, error } = await authClient.signUp.email({
            email: email.value,
            password: password.value,
            name: username.value,
            username: username.value,
        })

        if (error) {
            throw new Error(error.message || '注册失败')
        }

        if (phone.value) {
            // 验证手机号码
            const isVerified = await authClient.phoneNumber.verify({
                phoneNumber: phone.value,
                code: phoneCode.value,
            })

            if (!isVerified) {
                throw new Error('手机号码验证失败')
            }
        }

        toast.add({
            severity: 'success',
            summary: '注册成功',
            detail: '验证邮件已发送，请前往邮箱激活账号',
            life: 2500,
        })
        setTimeout(() => {
            navigateTo('/verify?mode=email') // 跳转到验证页面
        }, 1500)
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '注册过程中发生未知错误'
        toast.add({
            severity: 'error',
            summary: '注册失败',
            detail: errorMessage,
            life: 2500,
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

.register-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.card {
    width: 100%;
    display: flex;
    justify-content: center;
}

.separator {
    color: $secondary-light;
    display: flex;
    align-items: center;
    margin: 2rem 0;
    justify-content: center;
    gap: 0.5rem;

    &::before,
    &::after {
        content: '';
        flex: 1;
        border-bottom: 1px solid $secondary-bg;
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
    text-decoration: none;
    font-weight: 500;

    &:hover {
        text-decoration: underline;
    }
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

.p-password {
    padding: 0 0 0 0;
    width: 100%;
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.code-btn {
    min-width: 110px;
    padding: 0.75rem 0.75rem;
    font-size: 0.95rem;
}

.toggle-login {
    margin-top: 1em;
}
</style>

<!-- <style lang="scss">
.password-input {
    .p-password-input {
        width: 100%;
    }
}
</style> -->
