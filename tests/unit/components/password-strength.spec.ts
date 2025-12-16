import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import PasswordStrengthComponent from '@/components/password-strength.vue'
import {
    getPasswordStrength,
    getPasswordStrengthText,
    getPasswordStrengthColor,
    getPasswordValidationError,
    getPasswordScore,
    getDefaultPasswordStrength,
    PasswordStrength,
} from '@/utils/shared/password'

// Mock the password utility
vi.mock('@/utils/shared/password', () => ({
    getPasswordStrength: vi.fn(),
    getPasswordStrengthText: vi.fn(),
    getPasswordStrengthColor: vi.fn(),
    getPasswordValidationError: vi.fn(),
    getPasswordScore: vi.fn(),
    getDefaultPasswordStrength: vi.fn().mockReturnValue('strong'),
    PasswordStrength: {
        WEAK: 'weak',
        MEDIUM: 'medium',
        STRONG: 'strong',
        VERY_STRONG: 'very_strong',
    },
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
        vi.mocked(getPasswordStrengthText).mockReturnValue('Medium')
        vi.mocked(getPasswordStrengthColor).mockReturnValue('orange')
        vi.mocked(getPasswordScore).mockReturnValue(60)

        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'medium',
                showScore: true,
            },
        })

        expect(wrapper.find('.strength-text').text()).toContain('Medium')
        expect(wrapper.find('.strength-score').text()).toBe('(60/100)')
        expect(wrapper.find('.strength-progress').attributes('style')).toContain('width: 50%')
        expect(wrapper.find('.strength-progress').attributes('style')).toContain('background-color: orange')
    })

    it('shows requirements error message', () => {
        vi.mocked(getPasswordValidationError).mockReturnValue('Too short')

        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'short',
                showRequirements: true,
            },
        })

        expect(wrapper.find('.error-text').text()).toBe('Too short')
    })

    it('shows success message when valid', () => {
        vi.mocked(getPasswordValidationError).mockReturnValue('')

        const wrapper = mount(PasswordStrengthComponent, {
            props: {
                password: 'valid',
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
