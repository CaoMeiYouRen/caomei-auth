import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'
import AboutPage from '@/pages/about.vue'
import PrivacyPage from '@/pages/privacy.vue'
import TermsPage from '@/pages/terms.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

mockNuxtImport('useI18n', () => () => ({ t: useI18nText(), locale: { value: 'zh-CN' } }))

const mountOptions = {
    global: {
        stubs: {
            NuxtLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        },
    },
}

describe('静态页面', () => {
    it('关于页展示项目信息与作者', () => {
        const wrapper = mount(AboutPage, mountOptions)
        expect(wrapper.text()).toContain('关于草梅 Auth')
        expect(wrapper.text()).toContain('CaoMeiYouRen')
    })

    it('隐私政策页渲染标题', () => {
        const wrapper = mount(PrivacyPage, mountOptions)
        expect(wrapper.text()).toContain('隐私政策')
    })

    it('服务条款页渲染标题', () => {
        const wrapper = mount(TermsPage, mountOptions)
        expect(wrapper.text()).toContain('服务条款')
    })
})
