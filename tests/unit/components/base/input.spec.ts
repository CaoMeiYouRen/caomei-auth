import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseInput from '@/components/base/input.vue'

describe('BaseInput', () => {
    const global = {
        stubs: {
            InputText: {
                template: '<input class="p-inputtext-stub" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
                props: ['modelValue', 'id', 'placeholder', 'type', 'disabled'],
            },
        },
    }

    it('renders correctly with default props', () => {
        const wrapper = mount(BaseInput, {
            props: {
                id: 'test-input',
                modelValue: '',
            },
            global,
        })

        expect(wrapper.find('.p-inputtext-stub').exists()).toBe(true)
        expect(wrapper.find('label').exists()).toBe(false)
    })

    it('renders label and required mark', () => {
        const wrapper = mount(BaseInput, {
            props: {
                id: 'test-input',
                modelValue: '',
                label: 'Test Label',
                required: true,
            },
            global,
        })

        expect(wrapper.find('label').text()).toContain('Test Label')
        expect(wrapper.find('span[style="color: #e63946;"]').exists()).toBe(true)
    })

    it('emits update:modelValue when input changes', async () => {
        const wrapper = mount(BaseInput, {
            props: {
                id: 'test-input',
                modelValue: '',
            },
            global,
        })

        const input = wrapper.find('.p-inputtext-stub')
        await input.setValue('new value')

        expect(wrapper.emitted('update:modelValue')).toBeTruthy()
        expect(wrapper.emitted('update:modelValue')![0]).toEqual(['new value'])
    })

    it('displays error message', () => {
        const error = 'Invalid input'
        const wrapper = mount(BaseInput, {
            props: {
                id: 'test-input',
                modelValue: '',
                error,
            },
            global,
        })

        expect(wrapper.find('.error-message').text()).toBe(error)
        // The class p-invalid is applied to InputText, which is our stub.
        // But in the template: :class="['form-input', {'p-invalid': !!error}]" is passed to InputText.
        // Since we are using a stub, attributes fallthrough to the root element of the stub.
        expect(wrapper.find('.p-inputtext-stub').classes()).toContain('p-invalid')
    })

    it('renders append slot', () => {
        const wrapper = mount(BaseInput, {
            props: {
                id: 'test-input',
                modelValue: '',
            },
            slots: {
                append: '<button class="append-btn">Append</button>',
            },
            global,
        })

        expect(wrapper.find('.append-btn').exists()).toBe(true)
        // The parent div gets 'code-row' class if append slot is present
        expect(wrapper.find('.code-row').exists()).toBe(true)
    })
})
