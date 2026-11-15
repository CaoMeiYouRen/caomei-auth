import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import AuthLeft from '@/components/auth-left.vue'

vi.mock('@/composables/utils/use-i18n-text', () => import('@/tests/mocks/i18n-text'))
describe('AuthLeft', () => {
    it('renders with default props', () => {
        const wrapper = mount(AuthLeft)
        expect(wrapper.find('.auth-title').text()).toBe('草梅Auth统一登录平台')
        expect(wrapper.find('.auth-subtitle').exists()).toBe(false)
        expect(wrapper.find('.auth-logo').exists()).toBe(true)
    })

    it('renders with custom props', () => {
        const wrapper = mount(AuthLeft, {
            props: {
                title: 'Custom Title',
                subtitle: 'Custom Subtitle',
                showLogo: false,
            },
        })
        expect(wrapper.find('.auth-title').text()).toBe('Custom Title')
        expect(wrapper.find('.auth-subtitle').text()).toBe('Custom Subtitle')
        expect(wrapper.find('.auth-logo').exists()).toBe(false)
    })

    it('renders slot content', () => {
        const wrapper = mount(AuthLeft, {
            slots: {
                content: '<div class="custom-content">Slot Content</div>',
            },
        })
        expect(wrapper.find('.custom-content').text()).toBe('Slot Content')
    })
})
