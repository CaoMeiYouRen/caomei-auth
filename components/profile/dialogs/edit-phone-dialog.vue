<template>
    <BaseDialog
        v-model:visible="visible"
        :title="user.phoneVerified ? '修改手机号' : '绑定手机号'"
        width="450px"
        :show-footer="false"
    >
        <div class="form-group">
            <BasePhoneInput
                v-model="phone"
                v-tooltip.top="'输入新的手机号'"
                placeholder="请输入新手机号"
                :error="errors.phone"
            />
        </div>
        <BaseInput
            id="phoneCode"
            v-model="phoneCode"
            v-tooltip.top="'输入收到的短信验证码'"
            placeholder="验证码"
            :error="errors.code"
        >
            <template #append>
                <SendCodeButton
                    v-tooltip.top="'点击发送验证码到新手机号'"
                    :on-send="sendPhoneCode"
                    :duration="60"
                    :disabled="phoneCodeSending || !!errors.phone"
                    :loading="phoneCodeSending"
                    text="发送验证码"
                    resend-text="重新发送"
                />
            </template>
        </BaseInput>
        <Captcha ref="phoneCaptcha" />
        <Message
            v-if="errors.captcha"
            severity="error"
            size="small"
            variant="simple"
        >
            {{ errors.captcha }}
        </Message>
        <div class="form-group">
            <Button
                v-tooltip.top="'点击确认修改手机号信息'"
                label="确认修改"
                class="btn btn-primary w-full"
                :loading="bindingPhone"
                @click="bindPhone"
            />
        </div>
    </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { usePhoneOtp } from '@/composables/use-otp'
import Captcha from '@/components/captcha.vue'
import SendCodeButton from '@/components/send-code-button.vue'
import type { CaptchaExpose } from '@/utils/web/captcha'
import { useForm } from '@/composables/core/use-form'
import { editPhoneFormSchema } from '@/utils/shared/schemas'

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
                setErrors({ ...errors.value, phone: res.error.issues[0]?.message || '请输入有效的手机号' })
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
            toast.add({
                severity: 'success',
                summary: '手机号修改成功',
                life: 2000,
            })
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : '手机号修改时发生未知错误'
            toast.add({
                severity: 'error',
                summary: '手机号修改失败',
                detail: errorMessage,
                life: 5000,
            })
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
