import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import FormGroup from '@/components/base/form-group.vue'

describe('FormGroup', () => {
    it('renders correctly with default props', () => {
        const wrapper = mount(FormGroup, {
            props: {
                id: 'test-group',
            },
        })

        expect(wrapper.find('.form-group').exists()).toBe(true)
        expect(wrapper.find('label').exists()).toBe(false)
    })

    it('renders label and required mark', () => {
        const wrapper = mount(FormGroup, {
            props: {
                id: 'test-group',
                label: 'Test Label',
                required: true,
            },
        })

        expect(wrapper.find('label').text()).toContain('Test Label')
        expect(wrapper.find('.required-mark').exists()).toBe(true)
    })

    it('displays error message', () => {
        const error = 'Invalid input'
        const wrapper = mount(FormGroup, {
            props: {
                id: 'test-group',
                error,
            },
        })

        expect(wrapper.find('.error-message').text()).toBe(error)
    })

    it('renders slot content', () => {
        const wrapper = mount(FormGroup, {
            props: {
                id: 'test-group',
            },
            slots: {
                default: '<input class="test-input" />',
            },
        })

        expect(wrapper.find('.test-input').exists()).toBe(true)
        expect(wrapper.find('.form-control-wrapper').exists()).toBe(true)
    })
})
