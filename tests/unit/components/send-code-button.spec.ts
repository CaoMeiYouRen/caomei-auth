import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import SendCodeButton from '@/components/send-code-button.vue'

// Mock useCountdown
const mockRemaining = ref(0)
const mockStart = vi.fn()
const mockReset = vi.fn((val) => {
    if (val !== undefined) {
        mockRemaining.value = val
    }
})

vi.mock('@vueuse/core', () => ({
    useCountdown: () => ({
        remaining: mockRemaining,
        start: mockStart,
        reset: mockReset,
    }),
}))

describe('SendCodeButton', () => {
    const global = {
        stubs: {
            Button: {
                template: '<button class="p-button-stub" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
                props: ['label', 'disabled', 'loading'],
            },
        },
    }

    it('renders correctly with default props', () => {
        const wrapper = mount(SendCodeButton, {
            props: {
                onSend: vi.fn(),
            },
            global,
        })

        expect(wrapper.find('.p-button-stub').text()).toBe('获取验证码')
        // When disabled is false, the attribute is not present
        expect(wrapper.find('.p-button-stub').attributes('disabled')).toBeUndefined()
    })

    it('handles click and starts countdown on success', async () => {
        const onSend = vi.fn().mockResolvedValue(true)
        const wrapper = mount(SendCodeButton, {
            props: { onSend },
            global,
        })

        await wrapper.find('.p-button-stub').trigger('click')

        expect(onSend).toHaveBeenCalled()
        expect(mockStart).toHaveBeenCalled()
    })

    it('does not start countdown on failure', async () => {
        const onSend = vi.fn().mockResolvedValue(false)
        const wrapper = mount(SendCodeButton, {
            props: { onSend },
            global,
        })

        await wrapper.find('.p-button-stub').trigger('click')

        expect(onSend).toHaveBeenCalled()
        // Should reset to 0
        expect(mockReset).toHaveBeenCalledWith(0)
    })

    it('shows countdown text when running', async () => {
        const wrapper = mount(SendCodeButton, {
            props: {
                onSend: vi.fn().mockResolvedValue(true),
            },
            global,
        })

        // Simulate start
        await wrapper.find('.p-button-stub').trigger('click')

        // Simulate countdown tick
        mockRemaining.value = 59
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.p-button-stub').text()).toBe('重新发送(59s)')
    })

    it('is disabled when loading or remaining > 0', async () => {
        const wrapper = mount(SendCodeButton, {
            props: {
                onSend: vi.fn(),
                loading: true,
            },
            global,
        })

        // When disabled is true, the attribute is present (value is empty string)
        expect(wrapper.find('.p-button-stub').attributes()).toHaveProperty('disabled')

        await wrapper.setProps({ loading: false })
        mockRemaining.value = 10
        await wrapper.vm.$nextTick()

        expect(wrapper.find('.p-button-stub').attributes()).toHaveProperty('disabled')
    })
})
