import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import ThemeToggle from '@/components/theme-toggle.vue'
import BaseTooltip from '@/components/base/base-tooltip.vue'

/* CaomeiButton 把 `label` 映射为 aria-label；测试只关心按钮属性与图标插槽 */
const ButtonStub = {
    props: ['label'],
    template: '<button :aria-label="label" v-bind="$attrs"><slot name="icon" /><slot /></button>',
}

/* tooltip 依赖 Reka 的 Provider 与浏览器环境；组件测试只关心触发器与属性传递 */
const TooltipStub = {
    template: '<span><slot /></span>',
}

// Mock @vueuse/core：useAppTheme 依赖 useColorMode + usePreferredDark
const mode = ref<'auto' | 'light' | 'dark'>('auto')
const preferredDark = ref(false)

vi.mock('@vueuse/core', () => ({
    useColorMode: vi.fn(() => mode),
    usePreferredDark: vi.fn(() => preferredDark),
}))

const mountToggle = () => mount(ThemeToggle, {
    global: {
        stubs: {
            CaomeiButton: ButtonStub,
            CaomeiTooltip: TooltipStub,
            CaomeiTooltipTrigger: TooltipStub,
            CaomeiTooltipContent: TooltipStub,
        },
    },
})

describe('ThemeToggle', () => {
    beforeEach(() => {
        mode.value = 'auto'
        preferredDark.value = false
    })

    it('renders correctly in light mode', async () => {
        const wrapper = mountToggle()
        await nextTick()

        expect(wrapper.find('.mdi-white-balance-sunny').exists()).toBe(true)
        expect(wrapper.findComponent(BaseTooltip).props('content')).toBe('切换为暗色模式')
        expect(wrapper.find('button').attributes('aria-label')).toBe('切换为暗色模式')
    })

    it('renders correctly in dark mode', async () => {
        mode.value = 'dark'
        const wrapper = mountToggle()
        await nextTick()

        expect(wrapper.find('.mdi-weather-night').exists()).toBe(true)
        expect(wrapper.findComponent(BaseTooltip).props('content')).toBe('切换为亮色模式')
        expect(wrapper.find('button').attributes('aria-pressed')).toBe('true')
    })

    it('toggles theme on click', async () => {
        const wrapper = mountToggle()
        await nextTick()

        await wrapper.find('button').trigger('click')
        expect(mode.value).toBe('dark')

        await wrapper.find('button').trigger('click')
        expect(mode.value).toBe('light')
    })

    it('renders the real CaomeiButton with accessible name and type', async () => {
        const wrapper = mount(ThemeToggle, {
            global: {
                stubs: {
                    CaomeiTooltip: TooltipStub,
                    CaomeiTooltipTrigger: TooltipStub,
                    CaomeiTooltipContent: TooltipStub,
                },
            },
        })
        await nextTick()

        const button = wrapper.get('button')
        expect(button.attributes('aria-label')).toBe('切换为暗色模式')
        expect(button.attributes('type')).toBe('button')
    })

    it('follows system preference in auto mode', async () => {
        const wrapper = mountToggle()
        await nextTick()

        preferredDark.value = true
        await nextTick()
        expect(wrapper.find('.mdi-weather-night').exists()).toBe(true)

        preferredDark.value = false
        await nextTick()
        expect(wrapper.find('.mdi-white-balance-sunny').exists()).toBe(true)
    })
})
