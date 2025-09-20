import { ref, readonly } from 'vue'
import { getCaptchaProvider, getCaptchaSiteKey, isCaptchaEnabled } from '@/utils/captcha'

export function useCaptcha() {
    const token = ref<string | null>(null)
    const widget = ref<any | null>(null) // 用于存储组件实例
    const error = ref<string | null>(null)

    const provider = readonly(ref(getCaptchaProvider()))
    const siteKey = readonly(ref(getCaptchaSiteKey()))
    const enabled = readonly(ref(isCaptchaEnabled()))

    /**
     * 验证成功时调用，获取 token
     * @param t 验证码 token
     */
    function onVerify(t: string) {
        token.value = t
        error.value = null
    }

    /**
     * 验证码过期时调用
     */
    function onExpired() {
        token.value = null
        error.value = '验证码已过期，请重试。'
    }

    /**
     * 发生错误时调用
     * @param err 错误信息
     */
    function onError(err: string) {
        token.value = null
        error.value = `验证码加载失败: ${err}`
        console.error('hCaptcha error:', err)
    }

    /**
     * 重置验证码
     */
    function reset() {
        if (widget.value) {
            widget.value.reset()
        }
        token.value = null
        error.value = null
    }

    return {
        token,
        error,
        provider,
        siteKey,
        enabled,
        widget,
        onVerify,
        onExpired,
        onError,
        reset,
    }
}
