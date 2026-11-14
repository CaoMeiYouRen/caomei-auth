import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import TrendChart from '@/components/admin/logs/trend-chart.vue'

/* Chart.js 只在浏览器里渲染 canvas，单测替换构造器并记录配置对象 */
const chartMock = vi.hoisted(() => {
    const destroy = vi.fn()
    const ctor = vi.fn(function (this: { destroy: () => void }) {
        this.destroy = destroy
    })
    return { ctor, destroy }
})

vi.mock('chart.js/auto', () => ({ default: chartMock.ctor }))

const isDark = ref(false)
vi.mock('@/composables/use-app-theme', () => ({
    useAppTheme: () => ({ isDark, toggle: vi.fn() }),
}))

const isDemoMode = ref(false)
vi.mock('@/composables/use-demo-mode', () => ({
    useDemoMode: () => ({ isDemoMode }),
}))

interface ChartConfig {
    data: { labels: string[], datasets: Array<{ data: number[] }> }
    options: { animation: unknown }
}

const lastConfig = () => (chartMock.ctor.mock.calls as unknown as Array<[HTMLCanvasElement, ChartConfig]>).at(-1)?.[1] as ChartConfig

enableAutoUnmount(afterEach)

function mountChart(trendData: Array<{ date: string, count: number }> = []) {
    return mount(TrendChart, { props: { trendData } })
}

describe('TrendChart', () => {
    beforeEach(() => {
        chartMock.ctor.mockClear()
        chartMock.destroy.mockClear()
        isDark.value = false
        isDemoMode.value = false
        /* happy-dom 默认没有 matchMedia；组件用它判断减少动态偏好 */
        vi.stubGlobal('matchMedia', vi.fn(() => ({
            matches: false,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        })))
    })

    it('maps trend data to labels and counts', () => {
        mountChart([
            { date: '2026-06-01', count: 3 },
            { date: '2026-06-02', count: 5 },
        ])

        expect(chartMock.ctor).toHaveBeenCalledTimes(1)
        expect(lastConfig().data.labels).toEqual(['2026-06-01', '2026-06-02'])
        expect(lastConfig().data.datasets[0]?.data).toEqual([3, 5])
    })

    it('renders empty labels outside demo mode', () => {
        mountChart([])

        expect(lastConfig().data.labels).toEqual([])
        expect(lastConfig().data.datasets[0]?.data).toEqual([])
    })

    it('generates a stable 7-point demo series and reuses it on theme change', async () => {
        isDemoMode.value = true
        mountChart([])

        const labels = lastConfig().data.labels
        const data = lastConfig().data.datasets[0]?.data
        expect(labels).toHaveLength(7)
        expect(data).toHaveLength(7)

        isDark.value = true
        await nextTick()
        await nextTick()

        expect(chartMock.ctor).toHaveBeenCalledTimes(2)
        expect(lastConfig().data.labels).toEqual(labels)
        expect(lastConfig().data.datasets[0]?.data).toEqual(data)
    })

    it('rebuilds the chart when the theme changes', async () => {
        mountChart([{ date: '2026-06-01', count: 1 }])

        isDark.value = true
        await nextTick()
        await nextTick()

        expect(chartMock.ctor).toHaveBeenCalledTimes(2)
        expect(chartMock.destroy).toHaveBeenCalled()
    })

    it('destroys the chart instance on unmount', () => {
        const wrapper = mountChart([{ date: '2026-06-01', count: 1 }])

        wrapper.unmount()

        expect(chartMock.destroy).toHaveBeenCalledTimes(1)
    })
})
