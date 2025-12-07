<template>
    <BaseDialog
        v-model:visible="visible"
        :title="user.emailVerified ? '修改邮箱' : '绑定邮箱'"
        width="450px"
        :show-footer="false"
    >
        <BaseInput
            id="email"
            v-model="email"
            v-tooltip.top="'输入新的邮箱地址'"
            placeholder="请输入新邮箱"
        />
        <Captcha ref="emailCaptcha" />
        <Message
            v-if="emailCaptchaError"
            severity="error"
            size="small"
            variant="simple"
        >
            {{ emailCaptchaError }}
        </Message>
        <div class="form-group">
            <Button
                v-tooltip.top="'点击发送验证链接到新邮箱'"
                label="发送验证链接"
                class="btn btn-primary w-full"
                :loading="bindingEmail"
                @click="bindEmail"
            />
        </div>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { validateEmail } from '@/utils/validate'
import Captcha from '@/components/captcha.vue'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/captcha'

const props = defineProps<{
    user: {
        email: string
        emailVerified: boolean
    }
}>()

const emit = defineEmits<{
    (e: 'update:user', user: any): void
}>()

const visible = defineModel<boolean>('visible', { required: true })

const toast = useToast()
const email = ref('')
const bindingEmail = ref(false)
const emailCaptcha = ref<CaptchaExpose | null>(null)
const emailCaptchaError = ref('')

watch(visible, (val) => {
    if (val) {
        if (!props.user.emailVerified) {
            email.value = props.user.email
        }
        emailCaptcha.value?.reset()
        emailCaptchaError.value = ''
    }
})

async function bindEmail() {
    if (!validateEmail(email.value)) {
        toast.add({ severity: 'warn', summary: '请输入有效的邮箱地址', life: 2000 })
        return
    }
    let captchaContext: ResolvedCaptchaToken | null = null
    try {
        captchaContext = await resolveCaptchaToken(emailCaptcha)
        emailCaptchaError.value = ''
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
        emailCaptchaError.value = errorMessage
        toast.add({ severity: 'warn', summary: '需要验证码', detail: errorMessage, life: 2500 })
        return
    }
    bindingEmail.value = true
    try {
        const requestOptions = captchaContext ? { headers: { 'x-captcha-response': captchaContext.token } } : undefined
        await authClient.changeEmail({
            newEmail: email.value,
            callbackURL: '/profile', // 验证后重定向
        }, requestOptions)
        if (props.user.emailVerified) {
            toast.add({ severity: 'info', summary: '验证链接已发送到当前邮箱，请查收', life: 2000 })
            return
        }

        // Update user locally
        emit('update:user', {
            ...props.user,
            email: email.value,
            emailVerified: false,
        })

        visible.value = false
        toast.add({ severity: 'success', summary: '邮箱已更新', life: 2000 })
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '发送验证链接时发生未知错误'
        toast.add({
            severity: 'error',
            summary: '发送验证链接失败',
            detail: errorMessage,
            life: 5000,
        })
    } finally {
        bindingEmail.value = false
        if (captchaContext) {
            captchaContext.instance.reset()
        } else {
            emailCaptcha.value?.reset()
        }
    }
}
</script>

<style scoped lang="scss">
.form-group {
    margin-bottom: 1rem;
}

.form-input {
    width: 100%;
}
</style>
