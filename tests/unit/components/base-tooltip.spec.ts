import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import BaseTooltip from '@/components/base/base-tooltip.vue'

/**
 * `BaseTooltip` 的契约测试。
 *
 * Reka 的 Tooltip 需要 Provider 与浏览器定位，组件测试只验证本封装的接线：
 * 内容 / 方向透传、空内容禁用、默认插槽作为触发器。
 */
const TooltipStub = {
    props: ['disabled', 'delayDuration', 'side', 'sideOffset'],
    template: '<div class="tooltip-root" :data-disabled="String(disabled)"><slot /></div>',
}

const TriggerStub = {
    template: '<span class="tooltip-trigger"><slot /></span>',
}

const ContentStub = {
    props: ['side', 'sideOffset'],
    template: '<div class="tooltip-content" :data-side="side" :data-side-offset="sideOffset"><slot /></div>',
}

function mountTooltip(props: Record<string, unknown> = {}) {
    return mount(BaseTooltip, {
        props: { content: '提示文本', ...props },
        slots: { default: '<button type="button">触发</button>' },
        global: {
            stubs: {
                CaomeiTooltip: TooltipStub,
                CaomeiTooltipTrigger: TriggerStub,
                CaomeiTooltipContent: ContentStub,
            },
        },
    })
}

describe('BaseTooltip', () => {
    it('渲染触发器与提示文案', () => {
        const wrapper = mountTooltip()

        expect(wrapper.find('.tooltip-trigger button').text()).toBe('触发')
        expect(wrapper.find('.tooltip-content').text()).toBe('提示文本')
        expect(wrapper.find('.tooltip-root').attributes('data-disabled')).toBe('false')
    })

    it('content 为空时禁用提示且不渲染面板', () => {
        const wrapper = mountTooltip({ content: '' })

        expect(wrapper.find('.tooltip-root').attributes('data-disabled')).toBe('true')
        expect(wrapper.find('.tooltip-content').exists()).toBe(false)
    })

    it('透传方向与偏移', () => {
        const wrapper = mountTooltip({ side: 'right', sideOffset: 12 })

        expect(wrapper.find('.tooltip-content').attributes('data-side')).toBe('right')
        expect(wrapper.find('.tooltip-content').attributes('data-side-offset')).toBe('12')
    })
})
