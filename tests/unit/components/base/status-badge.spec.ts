import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StatusBadge from '@/components/base/status-badge.vue'

describe('StatusBadge', () => {
    const global = {
        stubs: {
            Tag: {
                template: '<span class="p-tag-stub" :data-severity="severity">{{ value }}</span>',
                props: ['value', 'severity'],
            },
        },
    }

    it('renders enabled variant correctly', () => {
        const wrapperTrue = mount(StatusBadge, {
            props: { status: true, variant: 'enabled' },
            global,
        })
        expect(wrapperTrue.find('.p-tag-stub').text()).toBe('已启用')
        expect(wrapperTrue.find('.p-tag-stub').attributes('data-severity')).toBe('success')

        const wrapperFalse = mount(StatusBadge, {
            props: { status: false, variant: 'enabled' },
            global,
        })
        expect(wrapperFalse.find('.p-tag-stub').text()).toBe('已禁用')
        expect(wrapperFalse.find('.p-tag-stub').attributes('data-severity')).toBe('danger')
    })

    it('renders disabled variant correctly', () => {
        const wrapperTrue = mount(StatusBadge, {
            props: { status: true, variant: 'disabled' },
            global,
        })
        expect(wrapperTrue.find('.p-tag-stub').text()).toBe('已禁用')
        expect(wrapperTrue.find('.p-tag-stub').attributes('data-severity')).toBe('danger')
    })

    it('renders role variant correctly', () => {
        const wrapperAdmin = mount(StatusBadge, {
            props: { status: 'admin', variant: 'role' },
            global,
        })
        expect(wrapperAdmin.find('.p-tag-stub').text()).toBe('管理员')
        expect(wrapperAdmin.find('.p-tag-stub').attributes('data-severity')).toBe('danger')

        const wrapperUser = mount(StatusBadge, {
            props: { status: 'user', variant: 'role' },
            global,
        })
        expect(wrapperUser.find('.p-tag-stub').text()).toBe('用户')
        expect(wrapperUser.find('.p-tag-stub').attributes('data-severity')).toBe('info')
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
        expect(wrapper.find('.p-tag-stub').text()).toBe('Active')
        expect(wrapper.find('.p-tag-stub').attributes('data-severity')).toBe('info')
    })
})
