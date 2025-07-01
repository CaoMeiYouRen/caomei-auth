<template>
    <div class="auth-container">
        <AuthLeft
            title="验证码验证"
            subtitle="请输入收到的验证码完成验证。"
        />
        <div class="auth-right">
            <div class="auth-card">
                <h2 class="auth-title">
                    验证码验证
                </h2>
                <p class="auth-subtitle">
                    请输入发送到
                    <span v-if="mode === 'email'">邮箱 <b>{{ email }}</b></span>
                    <span v-else>手机号 <b>{{ phone }}</b></span>
                    的6位验证码
                </p>
                <div class="form-group">
                    <label class="form-label" for="otp">验证码</label>
                    <div class="code-row">
                        <InputOtp
                            v-model="code"
                            :length="6"
                            input-class="form-input"
                            :disabled="verifying"
                        />
                        <SendCodeButton
                            class="code-btn"
                            :on-send="handleResend"
                            :duration="60"
                            :disabled="sending || countdown > 0"
                            :loading="sending"
                            text="发送验证码"
                            resend-text="重新发送"
                        />
                    </div>
                    <span v-if="errors.code" class="error-message">{{ errors.code }}</span>
                </div>
                <Button
                    label="提交"
                    class="btn btn-primary verify-btn"
                    :loading="verifying"
                    @click="handleVerify"
                />
                <div class="toggle-login">
                    <NuxtLink class="toggle-link" to="/login">
                        返回登录
                    </NuxtLink>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Button from 'primevue/button'
import InputOtp from 'primevue/inputotp'
import { useToast } from 'primevue/usetoast'
import SendCodeButton from '@/components/send-code-button.vue'
import AuthLeft from '@/components/auth-left.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const mode = ref<'email' | 'phone'>('email')
const email = ref('')
const phone = ref('')
const code = ref('')
const errors = ref<Record<string, string>>({})
const sending = ref(false)
const verifying = ref(false)
const countdown = ref(0)
let timer: any = null

onMounted(() => {
    if (route.query.mode === 'phone') {
        mode.value = 'phone'
    }
    // TODO 邮箱和手机号不应该在query中传递，应该在store中管理
    if (route.query.email) {
        email.value = String(route.query.email)
    }
    if (route.query.phone) {
        phone.value = String(route.query.phone)
    }
})

function handleResend() {
    errors.value.code = ''
    if (sending.value || countdown.value > 0) {
        return
    }
    sending.value = true
    toast.add({ severity: 'info', summary: '验证码已发送', detail: mode.value === 'email' ? '请查收您的邮箱' : '请查收您的短信', life: 2000 })
    countdown.value = 60
    timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) {
            clearInterval(timer)
            timer = null
        }
    }, 1000)
    setTimeout(() => {
        sending.value = false
    }, 1000)
}

function handleVerify() {
    errors.value.code = ''
    if (!code.value || code.value.length !== 6) {
        errors.value.code = '请输入6位验证码'
        return
    }
    verifying.value = true
    setTimeout(() => {
        verifying.value = false
        toast.add({ severity: 'success', summary: '验证成功', detail: '即将跳转...', life: 1500 })
        setTimeout(() => {
            router.push('/login')
        }, 1200)
    }, 1200)
}
</script>

<style scoped lang="scss">
@import '@/styles/theme';
@import '@/styles/form';
@import '@/styles/common';

.code-row {
    display: flex;
    gap: 0.5rem;
    align-items: center;
    margin-bottom: 1.5rem;

    @media (max-width: 480px) {
        flex-wrap: wrap;
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
    }
}

.code-btn {
    min-width: 110px;
    padding: 0.75rem 0.75rem;
    font-size: 0.95rem;

    @media (max-width: 480px) {
        max-width: 100%;
    }
}

.auth-card {
    max-width: 480px;
}

.countdown {
    color: $secondary-light;
    font-size: 0.98rem;
}

.verify-btn {
    width: 100%;
    margin-bottom: 1.2em;
}

.toggle-login {
    margin-top: 1.5rem;
    text-align: center;
    color: $secondary-light;
}

.toggle-link {
    color: $primary;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
}

.error-message {
    color: $error;
    margin-top: 0.25rem;
    display: block;
}
</style>
