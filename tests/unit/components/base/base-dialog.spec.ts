import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseDialog from '@/components/base/base-dialog.vue'

describe('BaseDialog', () => {
    const global = {
        stubs: {
            Dialog: {
                template: '<div class="p-dialog-stub"><slot /><slot name="footer" /></div>',
                props: ['visible', 'header', 'modal', 'breakpoints'],
            },
            Button: {
                template: '<button class="p-button-stub" @click="$emit(\'click\')">{{ label }}</button>',
                props: ['label', 'severity', 'loading', 'text'],
            },
        },
    }

    it('renders correctly with default props', () => {
        const wrapper = mount(BaseDialog, {
            props: {
                visible: true,
            },
            global,
        })

        expect(wrapper.find('.p-dialog-stub').exists()).toBe(true)
        expect(wrapper.props('title')).toBe('')
        expect(wrapper.props('width')).toBe('500px')
    })

    it('renders title correctly', () => {
        const title = 'Test Dialog'
        const wrapper = mount(BaseDialog, {
            props: {
                visible: true,
                title,
            },
            global,
        })

        expect(wrapper.props('title')).toBe(title)
    })

    it('emits update:visible and cancel when cancel button is clicked', async () => {
        const wrapper = mount(BaseDialog, {
            props: {
                visible: true,
            },
            global,
        })

        const buttons = wrapper.findAll('.p-button-stub')
        expect(buttons.length).toBeGreaterThan(0)
        const cancelButton = buttons[0] // First button is cancel

        await cancelButton!.trigger('click')

        expect(wrapper.emitted('update:visible')).toBeTruthy()
        expect(wrapper.emitted('update:visible')![0]).toEqual([false])
        expect(wrapper.emitted('cancel')).toBeTruthy()
    })

    it('emits confirm when confirm button is clicked', async () => {
        const wrapper = mount(BaseDialog, {
            props: {
                visible: true,
            },
            global,
        })

        const buttons = wrapper.findAll('.p-button-stub')
        expect(buttons.length).toBeGreaterThan(1)
        const confirmButton = buttons[1] // Second button is confirm

        await confirmButton!.trigger('click')

        expect(wrapper.emitted('confirm')).toBeTruthy()
    })

    it('renders slots correctly', () => {
        const wrapper = mount(BaseDialog, {
            props: {
                visible: true,
            },
            slots: {
                default: '<div class="default-slot">Content</div>',
                footer: '<div class="footer-slot">Custom Footer</div>',
            },
            global,
        })

        expect(wrapper.find('.default-slot').exists()).toBe(true)
        expect(wrapper.find('.footer-slot').exists()).toBe(true)
        // When footer slot is provided, the default footer (with buttons) should be replaced
        expect(wrapper.findAll('.p-button-stub').length).toBe(0)
    })

    it('hides footer when showFooter is false', () => {
        const wrapper = mount(BaseDialog, {
            props: {
                visible: true,
                showFooter: false,
            },
            global,
        })

        expect(wrapper.find('.dialog-footer').exists()).toBe(false)
    })
})
