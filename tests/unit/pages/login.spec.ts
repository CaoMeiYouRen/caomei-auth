import { flushPromises, shallowMount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from '@/pages/login.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

mockNuxtImport('useI18n', () => () => ({ t: useI18nText(), locale: { value: 'zh-CN' } }))

interface LoginFlowRefs {
    activeTab: { value: string }
    emailUseCode: { value: boolean }
    phoneUseCode: { value: boolean }
    show2FADialog: { value: boolean }
}

const { flowState } = vi.hoisted(() => ({
    flowState: { flow: null as null | Record<string, { value: unknown }> },
}))

vi.mock('@/composables/use-login-flow', async () => {
    const { computed, ref } = await import('vue')
    const activeTab = ref<'username' | 'email' | 'phone'>('username')
    const flow = {
        activeTab,
        activeAuthTab: computed(() => activeTab.value),
        email: ref(''),
        emailPassword: ref(''),
        username: ref(''),
        usernamePassword: ref(''),
        phone: ref(''),
        phonePassword: ref(''),
        rememberMe: ref(true),
        errors: ref<Record<string, string>>({}),
        emailUseCode: ref(false),
        emailCode: ref(''),
        emailCodeSending: ref(false),
        phoneUseCode: ref(false),
        phoneCode: ref(''),
        phoneCodeSending: ref(false),
        captcha: ref(''),
        show2FADialog: ref(false),
        twoFactorCode: ref(''),
        twoFactorError: ref(''),
        verifying2FA: ref(false),
        otpSending: ref(false),
        socialProviders: ref([{ provider: 'github', name: 'GitHub', label: 'GitHub' }, { provider: 'google', name: 'Google', label: 'Google' }]),
        phoneEnabled: ref(true),
        usernameEnabled: ref(true),
        changeMode: vi.fn(),
        sendOtp: vi.fn(),
        verify2FA: vi.fn(),
        login: vi.fn(),
        loginWithSocial: vi.fn(),
        sendEmailCode: vi.fn(),
        sendPhoneCode: vi.fn(),
        validateEmail: vi.fn(),
        validatePhone: vi.fn(),
    }
    flowState.flow = flow as unknown as Record<string, { value: unknown }>
    return { useLoginFlow: () => flow }
})

vi.mock('@/composables/utils/use-page-meta', () => ({ usePageMeta: vi.fn() }))

function flowRefs(): LoginFlowRefs {
    return flowState.flow as unknown as LoginFlowRefs
}

describe('登录页', () => {
    beforeEach(() => {
        if (flowState.flow) {
            const flow = flowRefs()
            flow.activeTab.value = 'username'
            flow.emailUseCode.value = false
            flow.phoneUseCode.value = false
            flow.show2FADialog.value = false
        }
    })

    it('渲染登录表单与社交登录入口', async () => {
        const wrapper = shallowMount(LoginPage, { global: { renderStubDefaultSlot: true } })
        await flushPromises()

        expect(wrapper.text()).toContain('登录')
        expect(wrapper.html()).toContain('GitHub')
        expect(wrapper.html()).toContain('Google')
    })

    it('邮箱验证码模式渲染邮箱验证码输入', async () => {
        const wrapper = shallowMount(LoginPage, { global: { renderStubDefaultSlot: true } })
        await flushPromises()

        const flow = flowRefs()
        flow.activeTab.value = 'email'
        flow.emailUseCode.value = true
        await nextTick()
        await flushPromises()

        expect(wrapper.html()).toContain('emailCode')
        expect(wrapper.html()).not.toContain('emailPassword')
    })

    it('手机号验证码模式渲染短信验证码输入', async () => {
        const wrapper = shallowMount(LoginPage, { global: { renderStubDefaultSlot: true } })
        await flushPromises()

        const flow = flowRefs()
        flow.activeTab.value = 'phone'
        flow.phoneUseCode.value = true
        await nextTick()
        await flushPromises()

        expect(wrapper.html()).toContain('phoneCode')
        expect(wrapper.html()).not.toContain('phonePassword')
    })

    it('2FA 对话框展示验证码与备份码标签', async () => {
        const wrapper = shallowMount(LoginPage, { global: { renderStubDefaultSlot: true } })
        await flushPromises()

        flowRefs().show2FADialog.value = true
        await nextTick()
        await flushPromises()

        expect(wrapper.html()).toContain('一次性验证码')
        expect(wrapper.html()).toContain('备份码')
    })
})
