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
            />
            <Message
                v-if="errors.phone"
                severity="error"
                size="small"
                variant="simple"
            >
                {{ errors.phone }}
            </Message>
        </div>
        <BaseInput
            id="phoneCode"
            v-model="phoneCode"
            v-tooltip.top="'输入收到的短信验证码'"
            placeholder="验证码"
        >
            <template #append>
                <SendCodeButton
                    v-tooltip.top="'点击发送验证码到新手机号'"
                    :on-send="sendPhoneCode"
                    :duration="60"
                    :disabled="phoneCodeSending || !validatePhone(phone)"
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
import { ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'
import { validatePhone } from '@/utils/validate'
import { usePhoneOtp } from '@/composables/use-otp'
import Captcha from '@/components/captcha.vue'
import SendCodeButton from '@/components/send-code-button.vue'
import type { CaptchaExpose } from '@/utils/captcha'

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
const phone = ref('')
const phoneCode = ref('')
const errors = ref<Record<string, string>>({})
const bindingPhone = ref(false)
const phoneCaptcha = ref<CaptchaExpose | null>(null)

const { send: sendPhoneOtp, sending: phoneCodeSending } = usePhoneOtp()

watch(visible, (val) => {
    if (val) {
        phoneCaptcha.value?.reset()
        errors.value.captcha = ''
        phone.value = ''
        phoneCode.value = ''
    }
})

const sendPhoneCode = async () => {
    return await sendPhoneOtp(
        phone.value,
        'phone-verification',
        phoneCaptcha,
        () => validatePhone(phone.value),
        (field, msg) => { errors.value[field] = msg },
    )
}

async function bindPhone() {
    if (!validatePhone(phone.value) || !phoneCode.value) {
        toast.add({ severity: 'warn', summary: '请填写完整', life: 2000 })
        return
    }
    bindingPhone.value = true
    try {
        const result = await authClient.phoneNumber.verify({
            phoneNumber: phone.value,
            code: phoneCode.value,
            updatePhoneNumber: true, // 更新手机号，否则就注册新号了
        })
        if (result.error) {
            throw new Error(result.error.message || '手机号验证失败')
        }

        emit('update:user', {
            ...props.user,
            phone: phone.value,
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
    } finally {
        bindingPhone.value = false
        phone.value = ''
        phoneCode.value = ''
        errors.value.captcha = ''
        phoneCaptcha.value?.reset()
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

.flex-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}
</style>
