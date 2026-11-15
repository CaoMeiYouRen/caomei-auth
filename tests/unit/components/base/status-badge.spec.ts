import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import StatusBadge from '@/components/base/status-badge.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

const i18nStub = vi.hoisted(() => ({ t: (key: string) => key }))
mockNuxtImport('useI18n', () => () => i18nStub)
i18nStub.t = useI18nText()

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

    it('renders banned / session / yes-no presets', () => {
        const banned = mount(StatusBadge, { props: { status: true, variant: 'banned' }, global })
        expect(banned.find('.caomei-tag-stub').text()).toBe('已禁用')
        const normal = mount(StatusBadge, { props: { status: false, variant: 'banned' }, global })
        expect(normal.find('.caomei-tag-stub').text()).toBe('正常')

        const active = mount(StatusBadge, { props: { status: true, variant: 'session' }, global })
        expect(active.find('.caomei-tag-stub').text()).toBe('活跃')
        const expired = mount(StatusBadge, { props: { status: false, variant: 'session' }, global })
        expect(expired.find('.caomei-tag-stub').text()).toBe('已过期')

        const yes = mount(StatusBadge, { props: { status: true, variant: 'yes-no' }, global })
        expect(yes.find('.caomei-tag-stub').text()).toBe('是')
        const no = mount(StatusBadge, { props: { status: false, variant: 'yes-no' }, global })
        expect(no.find('.caomei-tag-stub').text()).toBe('否')
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
