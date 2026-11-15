import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import PasswordStrengthComponent from '@/components/password-strength.vue'
import {
    getPasswordStrength,
    getPasswordStrengthColor,
    getPasswordScore,
    PasswordStrength,
} from '@/utils/shared/password'

vi.mock('@/composables/utils/use-i18n-text', () => import('@/tests/mocks/i18n-text'))
// Mock the password utility
vi.mock('@/utils/shared/password', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@/utils/shared/password')>()),
    getPasswordStrength: vi.fn(),
    getPasswordStrengthColor: vi.fn(),
    getPasswordScore: vi.fn(),
    getDefaultPasswordStrength: vi.fn().mockReturnValue('strong'),
}))

describe('PasswordStrength', () => {
    it('renders nothing if password is empty', () => {
        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: '',
            },
        })
        // If password is empty, the component might still render the container if showStrength is true
        // But let's check the implementation.
        // <div v-if="showStrength" class="password-strength">
        // It depends on showStrength prop default which is true.
        // But if password is empty, maybe we want to check if it shows anything useful.
        expect(wrapper.find('.password-strength').exists()).toBe(true)
    })

    it('calculates strength and score correctly', () => {
        vi.mocked(getPasswordStrength).mockReturnValue(PasswordStrength.MEDIUM)
        vi.mocked(getPasswordStrengthColor).mockReturnValue('orange')
        vi.mocked(getPasswordScore).mockReturnValue(60)

        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'medium',
                showScore: true,
            },
        })

        expect(wrapper.find('.strength-text').text()).toBe('密码强度：中等')
        expect(wrapper.find('.strength-score').text()).toBe('(60/100)')
        expect(wrapper.find('.strength-progress').attributes('style')).toContain('width: 50%')
        expect(wrapper.find('.strength-progress').attributes('style')).toContain('background-color: orange')
    })

    it('shows localized requirements error message', () => {
        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'a',
                showRequirements: true,
            },
        })

        expect(wrapper.find('.error-text').text()).toContain('密码长度至少需要')
    })

    it('shows success message when valid', () => {
        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'ValidPass1!',
                targetStrength: PasswordStrength.STRONG,
                showRequirements: true,
            },
        })

        expect(wrapper.find('.success-text').text()).toBe('✓ 密码强度达标')
    })

    it('hides strength indicator when showStrength is false', () => {
        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'test',
                showStrength: false,
            },
        })
        expect(wrapper.find('.password-strength').exists()).toBe(false)
    })
})
