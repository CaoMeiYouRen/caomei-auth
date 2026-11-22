import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import LoginEventHeatmap from '@/components/admin/logs/login-event-heatmap.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

mockNuxtImport('useI18n', () => () => ({ t: useI18nText() }))

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => fetchMock)

enableAutoUnmount(afterEach)

const response = {
    success: true,
    data: {
        days: 7,
        timezone: 'UTC',
        bucketUnit: 'hour',
        buckets: ['2026-06-15 02:00', '2026-06-15 03:00'],
        rows: [
            { type: 'sign_in_success', values: [1, 3] },
            { type: 'sign_in_failure', values: [0, 2] },
        ],
        max: 3,
    },
}

function mountHeatmap() {
    return mount(LoginEventHeatmap, {
        global: {
            stubs: {
                CaomeiButton: {
                    name: 'CaomeiButton',
                    template: '<button class="button-stub"><slot /></button>',
                },
            },
        },
    })
}

describe('LoginEventHeatmap', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        fetchMock.mockResolvedValue(response)
    })

    it('加载矩阵并按行渲染色块', async () => {
        const wrapper = mountHeatmap()
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/login-events/heatmap', { query: { days: '7' } })
        expect(wrapper.text()).toContain('事件热力图')
        expect(wrapper.text()).toContain('登录成功')
        expect(wrapper.findAll('.heatmap-cell')).toHaveLength(4)
        expect(wrapper.findAll('.heatmap-row')).toHaveLength(2)
        expect(wrapper.text()).toContain('2026-06-15 02:00 – 2026-06-15 03:00')
    })

    it('切换到 30 天会重新请求', async () => {
        const wrapper = mountHeatmap()
        await flushPromises()
        fetchMock.mockClear()

        const buttons = wrapper.findAll('.button-stub')
        await buttons[1]!.trigger('click')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/login-events/heatmap', { query: { days: '30' } })
    })

    it('空数据显示空态，失败显示错误与重试', async () => {
        fetchMock.mockResolvedValueOnce({
            success: true,
            data: { ...response.data, rows: [], max: 0 },
        })
        const empty = mountHeatmap()
        await flushPromises()
        expect(empty.text()).toContain('暂无事件数据')

        fetchMock.mockRejectedValueOnce(new Error('network down'))
        const failed = mountHeatmap()
        await flushPromises()
        expect(failed.find('[role="alert"]').text()).toContain('network down')
        expect(failed.find('[role="alert"] button').exists()).toBe(true)
    })
})
