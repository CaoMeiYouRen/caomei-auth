import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import LanguageSwitcher from '@/components/base/language-switcher.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

const setLocale = vi.fn()

const { localeRef, localesRef, updateUser } = vi.hoisted(() => ({
    localeRef: { value: 'zh-CN' },
    localesRef: { value: [] as { code: string, name: string }[] },
    updateUser: vi.fn(async () => ({ data: {} })),
}))

mockNuxtImport('useI18n', () => () => ({
    t: useI18nText(),
    locale: ref(localeRef.value),
    locales: ref(localesRef.value),
    setLocale,
}))
mockNuxtImport('useCookie', () => () => ref(null))

vi.mock('@/lib/auth-client', () => ({
    authClient: { updateUser },
}))

const TooltipStub = { template: '<div><slot /></div>' }

describe('language-switcher', () => {
    it('只展示可切换语言，点击后切换并写回偏好', async () => {
        localesRef.value = [
            { code: 'zh-CN', name: '简体中文' },
            { code: 'en-US', name: 'English' },
            { code: 'ja-JP', name: '日本語' },
        ]
        localeRef.value = 'zh-CN'
        const wrapper = mount(LanguageSwitcher, {
            global: { stubs: { BaseTooltip: TooltipStub } },
        })

        await wrapper.find('.language-switcher__trigger').trigger('click')
        const labels = wrapper.findAll('.language-switcher__option-label').map((item) => item.text())
        expect(labels).toEqual(['简体中文', 'English', '日本語'])

        await wrapper.findAll('.language-switcher__option')[1]!.trigger('click')
        expect(setLocale).toHaveBeenCalledWith('en-US')
        expect(updateUser).toHaveBeenCalledWith({ locale: 'en-US' })
    })
})
