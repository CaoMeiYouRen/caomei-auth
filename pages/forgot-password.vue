<template>
    <div class="forgot-container">
        <div class="forgot-left">
            <h1 class="forgot-title">
                找回密码
            </h1>
            <p class="forgot-subtitle">
                请输入相关信息以重置密码
            </p>
            <div class="forgot-logo">
                <img src="/logo.png" alt="logo">
            </div>
        </div>
        <div class="forgot-right">
            <div class="forgot-card">
                <div class="forgot-btn mb-4">
                    <div class="card flex justify-center">
                        <ButtonGroup>
                            <Button
                                label="邮箱"
                                icon="mdi mdi-email"
                                :class="{'p-button-outlined': mode !== 'email'}"
                                @click="mode = 'email'"
                            />
                            <Button
                                label="手机号"
                                icon="mdi mdi-phone"
                                :class="{'p-button-outlined': mode !== 'phone'}"
                                @click="mode = 'phone'"
                            />
                        </ButtonGroup>
                    </div>
                </div>
                <div v-if="mode === 'email'">
                    <div class="form-group">
                        <label class="form-label" for="email">邮箱</label>
                        <InputText
                            id="email"
                            v-model="email"
                            class="form-input"
                            placeholder="请输入邮箱"
                        />
                        <div v-if="errors.email" class="error-message">
                            {{ errors.email }}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="emailCode">邮箱验证码</label>
                        <div class="code-row">
                            <InputText
                                id="emailCode"
                                v-model="emailCode"
                                class="form-input"
                                placeholder="请输入邮箱验证码"
                            />
                            <SendCodeButton
                                :on-send="sendEmailCode"
                                :duration="60"
                                :disabled="emailCodeSending || !validateEmail(email)"
                                :loading="emailCodeSending"
                                text="获取验证码"
                                resend-text="重新发送"
                            />
                        </div>
                        <div v-if="errors.emailCode" class="error-message">
                            {{ errors.emailCode }}
                        </div>
                    </div>
                </div>
                <div v-if="mode === 'phone'">
                    <div class="form-group">
                        <label class="form-label" for="phone">手机号</label>
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
                    <div class="form-group">
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
                <Button
                    class="btn btn-primary mt-2"
                    label="重置密码"
                    @click="resetPassword"
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Password from 'primevue/password'
import ButtonGroup from 'primevue/buttongroup'
import { useToast } from 'primevue/usetoast'
import SendCodeButton from '@/components/send-code-button.vue'
import { validateEmail, validatePhone } from '@/utils/validate'
import { useSendEmailCode, useSendPhoneCode } from '@/utils/code'

const mode = ref<'email' | 'phone'>('email')
const email = ref('')
const phone = ref('')
const emailCode = ref('')
const phoneCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const emailCodeSending = ref(false)
const phoneCodeSending = ref(false)
const errors = ref<Record<string, string>>({})
const toast = useToast()
const router = useRouter()
const route = useRoute()

onMounted(() => {
    // 支持通过 query 传递初始tab
    if (route.query.mode === 'phone') {
        mode.value = 'phone'
    } else {
        mode.value = 'email'
    }
    if (route.query.email) {
        email.value = String(route.query.email)
    }
    if (route.query.phone) {
        phone.value = String(route.query.phone)
    }
})

const sendEmailCode = useSendEmailCode(email, validateEmail, errors, emailCodeSending)
const sendPhoneCode = useSendPhoneCode(phone, validatePhone, errors, phoneCodeSending)

function resetPassword() {
    errors.value = {}
    let isValid = true
    if (mode.value === 'email') {
        if (!email.value) {
            errors.value.email = '请输入邮箱'
            isValid = false
        } else if (!validateEmail(email.value)) {
            errors.value.email = '请输入有效的邮箱地址'
            isValid = false
        }
        if (!emailCode.value) {
            errors.value.emailCode = '请输入邮箱验证码'
            isValid = false
        }
    } else if (mode.value === 'phone') {
        if (!phone.value) {
            errors.value.phone = '请输入手机号'
            isValid = false
        } else if (!validatePhone(phone.value)) {
            errors.value.phone = '请输入有效的手机号'
            isValid = false
        }
        if (!phoneCode.value) {
            errors.value.phoneCode = '请输入短信验证码'
            isValid = false
        }
    }
    if (!newPassword.value) {
        errors.value.newPassword = '请输入新密码'
        isValid = false
    }
    if (!confirmPassword.value) {
        errors.value.confirmPassword = '请确认新密码'
        isValid = false
    } else if (newPassword.value !== confirmPassword.value) {
        errors.value.confirmPassword = '两次输入的密码不一致'
        isValid = false
    }
    if (isValid) {
        toast.add({ severity: 'success', summary: '密码重置成功', detail: '请使用新密码登录', life: 2500 })
        setTimeout(() => {
            router.push('/login')
        }, 1500)
    }
}
</script>

<style scoped lang="scss">
@import '@/styles/theme';
@import '@/styles/form';

.forgot-container {
    display: flex;
    flex-direction: column-reverse;
    background: $background;
    @media (min-width: 768px) {
        flex-direction: row;
    }
}

.forgot-left {
    color: $background-light;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 1rem;
    text-align: center;
    min-height: 20vh;

    .forgot-logo img {
        width: 80%;
        max-width: 160px;
    }

    @media (min-width: 768px) {
        width: 50%;
        min-height: 100vh;

        .forgot-logo img {
            width: 25%;
            max-width: none;
        }
    }
}

.forgot-right {
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

.forgot-card {
    background-color: $background-light;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
    padding: 2rem;
    width: 100%;
    max-width: 450px;
}

.forgot-title {
    color: $secondary;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.forgot-subtitle {
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

.forgot-btn {
    display: flex;
    width: 100%;
    margin-bottom: 1em;
}

.card {
    width: 100%;
    display: flex;
    justify-content: center;
}

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
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

.choose-way {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

.p-password {
    padding: 0 0 0 0;
    width: 100%;
}
</style>
