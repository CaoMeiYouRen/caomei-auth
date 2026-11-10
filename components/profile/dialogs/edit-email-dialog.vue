<template>
    <BaseDialogV2
        v-model:visible="visible"
        :title="user.emailVerified ? '修改邮箱' : '绑定邮箱'"
    >
        <BaseInputV2
            id="email"
            v-model="email"
            placeholder="请输入新邮箱"
            :error="errors.email"
            title="输入新的邮箱地址"
        />
        <Captcha ref="emailCaptcha" />
        <CaomeiMessage
            v-if="emailCaptchaError"
            tone="danger"
            size="sm"
            variant="simple"
        >
            {{ emailCaptchaError }}
        </CaomeiMessage>
        <div class="form-group">
            <CaomeiButton
                class="btn btn-primary w-full"
                block
                :loading="bindingEmail"
                title="点击发送验证链接到新邮箱"
                @click="bindEmail"
            >
                发送验证链接
            </CaomeiButton>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import Captcha from '@/components/captcha.vue'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'
import { emailSchema } from '@/utils/shared/validators'
import { z } from 'zod'

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
const emailCaptcha = ref<CaptchaExpose | null>(null)
const emailCaptchaError = ref('')

const { values, errors, submitting: bindingEmail, handleSubmit, reset, setField } = useForm({
    initialValues: { email: '' },
    zodSchema: z.object({ email: emailSchema }),
})

const email = computed({ get: () => values.value.email, set: (v) => setField('email', v) })

watch(visible, (val) => {
    if (val) {
        if (!props.user.emailVerified) {
            setField('email', props.user.email)
        } else {
            reset()
        }
        emailCaptcha.value?.reset()
        emailCaptchaError.value = ''
    }
})

async function bindEmail() {
    await handleSubmit(async (vals) => {
        let captchaContext: ResolvedCaptchaToken | null = null
        try {
            captchaContext = await resolveCaptchaToken(emailCaptcha)
            emailCaptchaError.value = ''
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '请先完成验证码验证'
            emailCaptchaError.value = errorMessage
            toast.warning({ title: '需要验证码', description: errorMessage, duration: 2500 })
            return
        }

        try {
            const requestOptions = captchaContext ? { headers: { 'x-captcha-response': captchaContext.token } } : undefined
            await authClient.changeEmail({
                newEmail: vals.email,
                callbackURL: '/profile', // 验证后重定向
            }, requestOptions)
            if (props.user.emailVerified) {
                toast.info({ title: '验证链接已发送到当前邮箱，请查收', duration: 2000 })
                return
            }

            // Update user locally
            emit('update:user', {
                ...props.user,
                email: vals.email,
            })

            visible.value = false
            toast.success({ title: '验证邮件已发送', description: '请前往新邮箱查收验证邮件', duration: 3000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '绑定邮箱时发生未知错误'
            toast.danger({ title: '绑定失败', description: errorMessage, duration: 5000 })
        }
    })
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
