<template>
    <BaseDialogV2
        v-model:visible="visible"
        :title="user.phoneVerified ? t('profile.phoneDialog.titleEdit') : t('profile.phoneDialog.titleBind')"
    >
        <div class="form-group">
            <BaseTooltip :content="t('profile.phoneDialog.inputTip')">
                <BasePhoneInputV2
                    id="phone"
                    v-model="phone"
                    :placeholder="t('profile.phoneDialog.placeholder')"
                    :error="errors.phone"
                />
            </BaseTooltip>
        </div>
        <BaseTooltip :content="t('profile.phoneDialog.codeTip')">
            <BaseInputV2
                id="phoneCode"
                v-model="phoneCode"
                :placeholder="t('profile.phoneDialog.codePlaceholder')"
                :error="errors.code"
            >
                <template #append>
                    <SendCodeButtonV2
                        :on-send="sendPhoneCode"
                        :duration="60"
                        :disabled="phoneCodeSending || !!errors.phone"
                        :loading="phoneCodeSending"
                    />
                </template>
            </BaseInputV2>
        </BaseTooltip>
        <Captcha ref="phoneCaptcha" />
        <CaomeiMessage
            v-if="errors.captcha"
            tone="danger"
            size="sm"
            variant="simple"
        >
            {{ errors.captcha }}
        </CaomeiMessage>
        <div class="form-group">
            <BaseTooltip :content="t('profile.phoneDialog.submitTip')">
                <CaomeiButton
                    class="btn btn-primary w-full"
                    block
                    :loading="bindingPhone"
                    @click="bindPhone"
                >
                    {{ t('profile.phoneDialog.submit') }}
                </CaomeiButton>
            </BaseTooltip>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'caomei-ui'
import { usePhoneOtp } from '@/composables/use-otp'
import Captcha from '@/components/captcha.vue'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import type { CaptchaExpose } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'
import { editPhoneFormSchema } from '@/utils/shared/schemas'
import { useValidationMessage } from '@/composables/utils/use-validation-message'
import { getApiErrorMessage } from '@/utils/shared/api-error'

const props = defineProps<{
    user: {
        phone: string
        phoneVerified: boolean
    }
}>()

const emit = defineEmits<{
    (e: 'update:user', user: any): void
}>()

const visible = defineModel<boolean>('visible', { required: true })

const { t } = useI18n()
const toast = useToast()
const translate = useValidationMessage()
const phoneCaptcha = ref<CaptchaExpose | null>(null)

const { values, errors, submitting: bindingPhone, handleSubmit, reset, setField, setErrors } = useForm({
    initialValues: { phone: '', code: '' },
    zodSchema: editPhoneFormSchema,
})

const phone = computed({ get: () => values.value.phone, set: (v) => setField('phone', v) })
const phoneCode = computed({ get: () => values.value.code, set: (v) => setField('code', v) })

const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()

watch(visible, (val) => {
    if (val) {
        phoneCaptcha.value?.reset()
        setErrors({})
        reset()
    }
})

const sendPhoneCode = async () => {
    await sendPhoneOtp(
        phone.value,
        'phone-verification',
        phoneCaptcha,
        () => {
            const res = editPhoneFormSchema.shape.phone.safeParse(phone.value)
            if (!res.success) {
                setErrors({ ...errors.value, phone: translate(res.error.issues[0]?.message) || t('profile.phoneDialog.invalidPhone') })
                return false
            }
            return true
        },
        (field, msg) => {
            setErrors({ ...errors.value, [field]: msg })
        },
    )
}

const bindPhone = async () => {
    await handleSubmit(async (vals) => {
        try {
            await $fetch('/api/security/bind-phone', {
                method: 'POST',
                body: {
                    phoneNumber: vals.phone,
                    code: vals.code,
                },
            })

            emit('update:user', {
                ...props.user,
                phone: vals.phone,
                phoneVerified: true,
            })

            visible.value = false
            toast.success({ title: t('profile.phoneDialog.success'), duration: 2000 })
        } catch (error) {
            const errorMessage = getApiErrorMessage(error, t('profile.phoneDialog.failedUnknown'))
            toast.danger({ title: t('profile.phoneDialog.failed'), description: errorMessage, duration: 5000 })
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

.flex-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
</style>
