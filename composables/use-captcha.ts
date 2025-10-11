import { ref, computed } from 'vue'
import { useChallengeV3, type UseChallengeV3Return } from 'vue-recaptcha'

export function useCaptcha() {
    const token = ref<string>('')
    const widget = ref<any | null>(null) // 用于存储组件实例
    const error = ref<string | null>(null)
    const loading = ref(false) // 新增 loading 状态

    const config = useRuntimeConfig().public

    const provider = computed(() => config.captchaProvider)
    const siteKey = computed(() => {
        switch (config.captchaProvider) {
            case 'google-recaptcha':
                return config.recaptchaSiteKey || null

            case 'cloudflare-turnstile':
                return config.turnstileSiteKey || null

            case 'hcaptcha':
                return config.hcaptchaSiteKey || null
            default:
                return null
        }
    })
    const enabled = computed(() => Boolean(provider.value && siteKey.value))

    let challengeV3: UseChallengeV3Return | null = null

    if (config.captchaProvider === 'google-recaptcha') {
        challengeV3 = useChallengeV3('submit')
    }

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
        token.value = ''
        error.value = '验证码已过期，请重试。'
    }

    /**
     * 发生错误时调用
     * @param err 错误信息
     */
    function onError(err: unknown) {
        const message = err instanceof Error ? err.message : String(err ?? '')
        token.value = ''
        error.value = `验证码加载失败: ${message}`
        console.error('Captcha error:', err)
    }

    /**
     * 当浏览器不支持 Turnstile 时调用
     */
    function onUnsupported() {
        token.value = ''
        error.value = '您的浏览器不支持验证码，请更换浏览器或禁用广告拦截插件。'
    }

    /**
     * 主动执行验证 (主要用于 reCAPTCHA v3)
     */
    async function execute() {
        if (!enabled.value) {
            return
        }

        if (provider.value === 'google-recaptcha' && challengeV3) {
            loading.value = true
            error.value = null
            try {
                const t = await challengeV3.execute()
                token.value = t
                onVerify(t)
            } catch (e: any) {
                onError(e ?? 'reCAPTCHA v3 execute failed')
            } finally {
                loading.value = false
            }
        }
        // 对于 hCaptcha 和 Turnstile，token 是通过 v-model 获取的，无需主动执行
    }

    /**
     * 重置验证码
     */
    function reset() {
        if (widget.value) {
            widget.value.reset()
        }
        token.value = ''
        error.value = null
        if (challengeV3) {
            challengeV3.response.value = undefined
        }
    }

    return {
        token,
        error,
        loading, // 暴露 loading
        provider,
        siteKey,
        enabled,
        widget,
        onVerify,
        onExpired,
        onError,
        onUnsupported,
        reset,
        execute, // 暴露 execute 方法
    }
}
