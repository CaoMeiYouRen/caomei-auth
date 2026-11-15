import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import { createI18n } from 'vue-i18n'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import DemoModeBanner from '@/components/demo-mode-banner.vue'

const demoMessages = (JSON.parse(readFileSync(join(process.cwd(), 'i18n/locales/zh-CN/demo.json'), 'utf8')) as { demo: Record<string, string> }).demo

const useRuntimeConfigMock = vi.hoisted(() => vi.fn())
mockNuxtImport('useRuntimeConfig', () => useRuntimeConfigMock)

const NuxtLinkStub = {
    props: ['to'],
    template: '<a :href="to"><slot /></a>',
}

function createI18nPlugin() {
    return createI18n({
        legacy: false,
        locale: 'zh-CN',
        messages: { 'zh-CN': { demo: demoMessages }, 'en-US': { demo: demoMessages } },
    })
}

function mountBanner(props: Record<string, unknown> = {}) {
    useRuntimeConfigMock.mockReturnValue({ public: { demoMode: true, docUrl: 'https://docs.example.com' } })
    return mount(DemoModeBanner, {
        props,
        global: {
            plugins: [createI18nPlugin()],
            stubs: { NuxtLink: NuxtLinkStub },
        },
    })
}

describe('DemoModeBanner', () => {
    it('renders localized title, message and doc link', () => {
        const wrapper = mountBanner()
        const text = wrapper.text()

        expect(text).toContain('演示模式')
        expect(text).toContain('当前为演示模式')
        expect(text).toContain('Demo账号密码详见')
        expect(text).toContain('文档说明')
        expect(wrapper.get('a').attributes('href')).toBe('https://docs.example.com')
    })

    it('keeps caller overrides for message and doc text', () => {
        const wrapper = mountBanner({ message: '自定义提示', docText: '自定义链接' })

        expect(wrapper.text()).toContain('自定义提示')
        expect(wrapper.text()).toContain('自定义链接')
    })

    it('hides the doc link when showDocLink is false', () => {
        const wrapper = mountBanner({ showDocLink: false })

        expect(wrapper.find('a').exists()).toBe(false)
    })
})
