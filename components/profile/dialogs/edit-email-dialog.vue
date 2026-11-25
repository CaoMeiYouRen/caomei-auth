<template>
    <BaseDialogV2
        v-model:visible="visible"
        :title="user.emailVerified ? t('profile.emailDialog.titleEdit') : t('profile.emailDialog.titleBind')"
    >
        <BaseTooltip :content="t('profile.emailDialog.inputTip')">
            <BaseInputV2
                id="email"
                v-model="email"
                :placeholder="t('profile.emailDialog.placeholder')"
                :error="errors.email"
            />
        </BaseTooltip>
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
            <BaseTooltip :content="t('profile.emailDialog.submitTip')">
                <CaomeiButton
                    class="btn btn-primary w-full"
                    block
                    :loading="bindingEmail"
                    @click="bindEmail"
                >
                    {{ t('profile.emailDialog.submit') }}
                </CaomeiButton>
            </BaseTooltip>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'caomei-ui'
import Captcha from '@/components/captcha.vue'
import { resolveCaptchaToken, type CaptchaExpose, type ResolvedCaptchaToken } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'
import { useCaptchaEnabled } from '@/composables/use-captcha'
import { emailSchema } from '@/utils/shared/validators'
import { getApiErrorMessage } from '@/utils/shared/api-error'
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

const { t } = useI18n()
const toast = useToast()
const captchaEnabled = useCaptchaEnabled()
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
            captchaContext = await resolveCaptchaToken(emailCaptcha, !captchaEnabled.value)
            emailCaptchaError.value = ''
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : t('profile.emailDialog.captchaRequired')
            emailCaptchaError.value = errorMessage
            toast.warning({ title: t('profile.emailDialog.captchaNeeded'), description: errorMessage, duration: 2500 })
            return
        }

        try {
            const headers = captchaContext ? { 'x-captcha-response': captchaContext.token } : undefined
            await $fetch('/api/security/change-email', {
                method: 'POST',
                body: {
                    newEmail: vals.email,
                    // 验证后重定向
                    callbackURL: '/profile',
                },
                headers,
            })
            if (props.user.emailVerified) {
                toast.info({ title: t('profile.emailDialog.sentToCurrent'), duration: 2000 })
                return
            }

            // Update user locally
            emit('update:user', {
                ...props.user,
                email: vals.email,
            })

            visible.value = false
            toast.success({ title: t('profile.emailDialog.sent'), description: t('profile.emailDialog.sentDescription'), duration: 3000 })
        } catch (error) {
            const errorMessage = getApiErrorMessage(error, t('profile.emailDialog.bindFailedUnknown'))
            toast.danger({ title: t('profile.emailDialog.bindFailed'), description: errorMessage, duration: 5000 })
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
