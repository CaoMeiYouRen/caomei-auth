import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/base/status-badge.vue'

describe('StatusBadge', () => {
    const global = {
        stubs: {
            CaomeiTag: {
                template: '<span class="caomei-tag-stub" :data-tone="tone" :data-variant="variant"><slot /></span>',
                props: ['tone', 'variant'],
            },
        },
    }

    it('renders enabled variant correctly', () => {
        const wrapperTrue = mount(StatusBadge, {
            props: { status: true, variant: 'enabled' },
            global,
        })
        expect(wrapperTrue.find('.caomei-tag-stub').text()).toBe('已启用')
        expect(wrapperTrue.find('.caomei-tag-stub').attributes('data-tone')).toBe('success')
        expect(wrapperTrue.find('.caomei-tag-stub').attributes('data-variant')).toBe('soft')

        const wrapperFalse = mount(StatusBadge, {
            props: { status: false, variant: 'enabled' },
            global,
        })
        expect(wrapperFalse.find('.caomei-tag-stub').text()).toBe('已禁用')
        expect(wrapperFalse.find('.caomei-tag-stub').attributes('data-tone')).toBe('danger')
    })

    it('renders disabled variant correctly', () => {
        const wrapperTrue = mount(StatusBadge, {
            props: { status: true, variant: 'disabled' },
            global,
        })
        expect(wrapperTrue.find('.caomei-tag-stub').text()).toBe('已禁用')
        expect(wrapperTrue.find('.caomei-tag-stub').attributes('data-tone')).toBe('danger')
    })

    it('renders role variant correctly', () => {
        const wrapperAdmin = mount(StatusBadge, {
            props: { status: 'admin', variant: 'role' },
            global,
        })
        expect(wrapperAdmin.find('.caomei-tag-stub').text()).toBe('管理员')
        expect(wrapperAdmin.find('.caomei-tag-stub').attributes('data-tone')).toBe('danger')

        const wrapperUser = mount(StatusBadge, {
            props: { status: 'user', variant: 'role' },
            global,
        })
        expect(wrapperUser.find('.caomei-tag-stub').text()).toBe('用户')
        expect(wrapperUser.find('.caomei-tag-stub').attributes('data-tone')).toBe('neutral')
    })

    it('allows custom overrides', () => {
        const wrapper = mount(StatusBadge, {
            props: {
                status: true,
                variant: 'enabled',
                trueLabel: 'Active',
                trueSeverity: 'info',
            },
            global,
        })
        expect(wrapper.find('.caomei-tag-stub').text()).toBe('Active')
        expect(wrapper.find('.caomei-tag-stub').attributes('data-tone')).toBe('neutral')
    })
})
