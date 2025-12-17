import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, nextTick } from 'vue'
import ThemeToggle from '@/components/theme-toggle.vue'

// Mock PrimeVue Button
const ButtonStub = {
    template: '<button><slot /></button>',
}

// Mock @vueuse/core
const isDark = ref(false)
const preferredDark = ref(false)

vi.mock('@vueuse/core', () => ({
    useDark: vi.fn(() => isDark),
    useToggle: vi.fn(), // Not used in the component logic shown, but imported
    usePreferredDark: vi.fn(() => preferredDark),
}))

describe('ThemeToggle', () => {
    beforeEach(() => {
        isDark.value = false
        preferredDark.value = false
    })

    it('renders correctly in light mode', () => {
        const wrapper = mount(ThemeToggle, {
            global: {
                stubs: {
                    Button: ButtonStub,
                },
            },
        })
        expect(wrapper.find('.mdi-white-balance-sunny').exists()).toBe(true)
        expect(wrapper.find('button').attributes('title')).toBe('切换为暗色模式')
        expect(wrapper.find('button').attributes('aria-label')).toBe('切换为暗色模式')
    })

    it('renders correctly in dark mode', async () => {
        isDark.value = true
        preferredDark.value = true // Ensure watcher doesn't reset isDark to false
        const wrapper = mount(ThemeToggle, {
            global: {
                stubs: {
                    Button: ButtonStub,
                },
            },
        })
        expect(wrapper.find('.mdi-weather-night').exists()).toBe(true)
        expect(wrapper.find('button').attributes('title')).toBe('切换为亮色模式')
    })

    it('toggles theme on click', async () => {
        const wrapper = mount(ThemeToggle, {
            global: {
                stubs: {
                    Button: ButtonStub,
                },
            },
        })

        await wrapper.find('button').trigger('click')
        expect(isDark.value).toBe(true)

        await wrapper.find('button').trigger('click')
        expect(isDark.value).toBe(false)
    })

    it('syncs with system preference', async () => {
        mount(ThemeToggle, {
            global: {
                stubs: {
                    Button: ButtonStub,
                },
            },
        })

        preferredDark.value = true
        await nextTick()
        expect(isDark.value).toBe(true)

        preferredDark.value = false
        await nextTick()
        expect(isDark.value).toBe(false)
    })
})
