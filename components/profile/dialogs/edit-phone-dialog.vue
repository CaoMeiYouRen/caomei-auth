<template>
    <BaseDialogV2
        v-model:visible="visible"
        :title="user.phoneVerified ? '修改手机号' : '绑定手机号'"
    >
        <div class="form-group">
            <BaseTooltip content="输入新的手机号">
                <BasePhoneInputV2
                    id="phone"
                    v-model="phone"
                    placeholder="请输入新手机号"
                    :error="errors.phone"
                />
            </BaseTooltip>
        </div>
        <BaseTooltip content="输入收到的短信验证码">
            <BaseInputV2
                id="phoneCode"
                v-model="phoneCode"
                placeholder="验证码"
                :error="errors.code"
            >
                <template #append>
                    <SendCodeButtonV2
                        :on-send="sendPhoneCode"
                        :duration="60"
                        :disabled="phoneCodeSending || !!errors.phone"
                        :loading="phoneCodeSending"
                        text="发送验证码"
                        resend-text="重新发送"
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
            <BaseTooltip content="点击确认修改手机号信息">
                <CaomeiButton
                    class="btn btn-primary w-full"
                    block
                    :loading="bindingPhone"
                    @click="bindPhone"
                >
                    确认修改
                </CaomeiButton>
            </BaseTooltip>
        </div>
    </BaseDialogV2>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'caomei-ui'
import { authClient } from '@/lib/auth-client'
import { usePhoneOtp } from '@/composables/use-otp'
import Captcha from '@/components/captcha.vue'
import SendCodeButtonV2 from '@/components/send-code-button-v2.vue'
import type { CaptchaExpose } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'
import { editPhoneFormSchema } from '@/utils/shared/schemas'
import { useValidationMessage } from '@/composables/utils/use-validation-message'

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
                setErrors({ ...errors.value, phone: translate(res.error.issues[0]?.message) || '请输入有效的手机号' })
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
            const result = await authClient.phoneNumber.verify({
                phoneNumber: vals.phone,
                code: vals.code,
                updatePhoneNumber: true,
            })

            if (result.error) {
                throw new Error(result.error.message || '手机号验证失败')
            }

            emit('update:user', {
                ...props.user,
                phone: vals.phone,
                phoneVerified: true,
            })

            visible.value = false
            toast.success({ title: '手机号修改成功', duration: 2000 })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '手机号修改时发生未知错误'
            toast.danger({ title: '手机号修改失败', description: errorMessage, duration: 5000 })
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
