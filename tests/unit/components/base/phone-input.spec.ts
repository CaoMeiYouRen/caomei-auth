import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PhoneInput from '@/components/base/phone-input.vue'

// Mock google-libphonenumber
vi.mock('google-libphonenumber', () => ({
    default: {
        PhoneNumberFormat: { E164: 1 },
        PhoneNumberUtil: {
            getInstance: () => ({}),
        },
    },
}))

// Mock utils/shared/phone
vi.mock('@/utils/shared/phone', () => ({
    SUPPORTED_REGIONS: [
        { region: 'CN', countryCode: 86 },
        { region: 'US', countryCode: 1 },
    ],
    formatPhoneNumber: vi.fn((phone, region) => {
        if (phone === '13800138000' && region === 'CN') {
            return '+8613800138000'
        }
        return phone
    }),
    phoneUtil: {
        parse: vi.fn(),
        format: vi.fn(),
    },
}))

describe('PhoneInput', () => {
    const global = {
        stubs: {
            Dropdown: {
                template: `
          <select class="p-dropdown-stub" :value="modelValue" @change="$emit('update:modelValue', $event.target.value); $emit('change')">
            <option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        `,
                props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder'],
            },
            InputText: {
                template: '<input class="p-inputtext-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value); $emit(\'input\')" />',
                props: ['modelValue', 'id', 'placeholder'],
            },
        },
    }

    it('renders correctly with default props', () => {
        const wrapper = mount(PhoneInput, {
            props: {
                id: 'test-phone',
                modelValue: '',
            },
            global,
        })

        expect(wrapper.find('.p-dropdown-stub').exists()).toBe(true)
        expect(wrapper.find('.p-inputtext-stub').exists()).toBe(true)
    })

    it('renders label and required mark', () => {
        const wrapper = mount(PhoneInput, {
            props: {
                id: 'test-phone',
                modelValue: '',
                label: 'Phone',
                required: true,
            },
            global,
        })

        expect(wrapper.find('label').text()).toContain('Phone')
        expect(wrapper.find('span[style="color: #e63946;"]').exists()).toBe(true)
    })

    it('updates region', async () => {
        const wrapper = mount(PhoneInput, {
            props: {
                id: 'test-phone',
                modelValue: '',
            },
            global,
        })

        const dropdown = wrapper.find('.p-dropdown-stub')
        await dropdown.setValue('US')

        expect((dropdown.element as HTMLSelectElement).value).toBe('US')
    })

    it('formats phone number and emits update:modelValue', async () => {
        const wrapper = mount(PhoneInput, {
            props: {
                id: 'test-phone',
                modelValue: '',
                defaultRegion: 'CN',
            },
            global,
        })

        const input = wrapper.find('.p-inputtext-stub')
        await input.setValue('13800138000')

        // Wait for next tick/events
        await wrapper.vm.$nextTick()

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        // Since we mocked formatPhoneNumber to return +8613800138000
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['+8613800138000'])
    })
})
