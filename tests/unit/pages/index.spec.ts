import { flushPromises, mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { defineComponent, nextTick } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import IndexPage from '@/pages/index.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

mockNuxtImport('useI18n', () => () => ({ t: useI18nText(), locale: { value: 'zh-CN' } }))

const { sessionRef, navigate } = vi.hoisted(() => ({
    sessionRef: { current: null as null | { user?: { role?: string, id?: string } } },
    navigate: { login: vi.fn(), register: vi.fn(), quickLogin: vi.fn(), forgot: vi.fn(), profile: vi.fn(), admin: vi.fn() },
}))

vi.mock('@/composables/use-index-flow', async () => {
    const { ref } = await import('vue')
    return {
        useIndexFlow: async () => ({
            session: ref(sessionRef.current),
            toLogin: navigate.login,
            toQuickLogin: navigate.quickLogin,
            toRegister: navigate.register,
            toForgotPassword: navigate.forgot,
            toProfile: navigate.profile,
            toAdmin: navigate.admin,
        }),
    }
})

vi.mock('@/composables/utils/use-no-index', () => ({ useNoIndex: vi.fn() }))

const mountOptions = {
    global: {
        stubs: {
            NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
    },
}

const Host = defineComponent({
    components: { IndexPage },
    template: '<Suspense><IndexPage /></Suspense>',
})

describe('首页入口', () => {
    it('未登录时展示登录 / 注册 / 快速登录入口', async () => {
        sessionRef.current = null
        const wrapper = mount(Host, mountOptions)
        await flushPromises()
        await nextTick()

        expect(wrapper.text()).toContain('登录')
        expect(wrapper.text()).toContain('注册')
        expect(wrapper.text()).toContain('快速登录')
        expect(wrapper.text()).not.toContain('管理后台')
    })

    it('管理员会话展示管理后台与资料入口', async () => {
        sessionRef.current = { user: { id: 'admin-1', role: 'admin' } }
        const wrapper = mount(Host, mountOptions)
        await flushPromises()
        await nextTick()

        expect(wrapper.text()).toContain('管理后台')
        expect(wrapper.text()).toContain('前往个人中心')
    })

    it('未登录时点击入口跳转对应路由', async () => {
        sessionRef.current = null
        const wrapper = mount(Host, mountOptions)
        await flushPromises()
        await nextTick()

        const button = (text: string) => wrapper.findAll('button').find((item) => item.text().includes(text))
        await button('前往登录页')!.trigger('click')
        await button('前往快速登录页')!.trigger('click')
        await button('前往注册')!.trigger('click')
        await button('忘记密码')!.trigger('click')

        expect(navigate.login).toHaveBeenCalled()
        expect(navigate.quickLogin).toHaveBeenCalled()
        expect(navigate.register).toHaveBeenCalled()
        expect(navigate.forgot).toHaveBeenCalled()
    })

    it('已登录普通用户展示资料入口并可跳转', async () => {
        sessionRef.current = { user: { id: 'user-1', role: 'user' } }
        const wrapper = mount(Host, mountOptions)
        await flushPromises()
        await nextTick()

        expect(wrapper.text()).not.toContain('管理后台')
        expect(wrapper.text()).toContain('前往个人中心')
        await wrapper.findAll('button').find((item) => item.text().includes('前往个人中心'))!.trigger('click')
        expect(navigate.profile).toHaveBeenCalled()
    })
})
