<template>
    <div class="trend-chart">
        <div class="section-header">
            <h2 id="trend-chart-title" class="section-title">
                登录趋势（最近30天）
            </h2>
        </div>
        <div class="chart-container">
            <canvas
                ref="canvasRef"
                class="chart-canvas"
                role="img"
                aria-labelledby="trend-chart-title"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import dayjs from 'dayjs'
import Chart, { type ChartConfiguration } from 'chart.js/auto'
import { useAppTheme } from '@/composables/use-app-theme'
import { formatDate } from '@/utils/shared/date'
import { useDemoMode } from '@/composables/use-demo-mode'
import type { AdminLogTrendPoint } from '@/types/admin'

const props = defineProps<{
    trendData: AdminLogTrendPoint[]
}>()

const { isDark } = useAppTheme()
const { isDemoMode } = useDemoMode()
const canvasRef = ref<HTMLCanvasElement | null>(null)
let chart: Chart | null = null
/** Demo 示例数据只生成一次，主题切换 / 重绘不换曲线 */
let demoSeries: { labels: string[], data: number[] } | null = null

/** 读取 Admin 语义 token；SSR / 未挂载时回退到浅色值 */
function readToken(name: string, fallback: string) {
    if (typeof window === 'undefined') {
        return fallback
    }
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function prefersReducedMotion() {
    return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function buildLabelsAndData() {
    // 如果没有数据且处于 Demo 模式，生成最近 7 天的示例数据用于展示
    if ((!props.trendData || props.trendData.length === 0) && isDemoMode.value) {
        if (!demoSeries) {
            const labels: string[] = []
            const data: number[] = []

            for (let i = 6; i >= 0; i--) {
                labels.push(dayjs().subtract(i, 'day').format('MM月DD日'))
                data.push(Math.floor(Math.random() * 10) + 1)
            }
            demoSeries = { labels, data }
        }

        return demoSeries
    }

    return {
        labels: (props.trendData || []).map((item) => formatDate(item.date)),
        data: (props.trendData || []).map((item) => item.count),
    }
}

function buildConfig(): ChartConfiguration<'line'> {
    const textColor = readToken('--admin-text', isDark.value ? '#ffffff' : '#2d3748')
    const mutedColor = readToken('--admin-muted', isDark.value ? '#a1a1aa' : '#718096')
    const gridColor = readToken('--admin-border', isDark.value ? '#374151' : '#e2e8f0')
    const seriesColor = readToken('--color-blue', '#4285f4')
    const seriesColorDark = readToken('--color-blue-dark', '#2563eb')
    const seriesColorLight = readToken('--color-blue-light', '#60a5fa')
    const seriesFill = readToken('--color-blue-light-alpha', 'rgba(66, 133, 244, 0.1)')
    const { labels, data } = buildLabelsAndData()
    const reduceMotion = prefersReducedMotion()

    return {
        type: 'line' as const,
        data: {
            labels,
            datasets: [
                {
                    label: '登录次数',
                    data,
                    fill: true,
                    borderColor: seriesColor,
                    backgroundColor: seriesFill,
                    tension: 0.4,
                    pointBackgroundColor: seriesColor,
                    pointBorderColor: seriesColorDark,
                    pointHoverBackgroundColor: seriesColorLight,
                    pointHoverBorderColor: seriesColorDark,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top' as const,
                    labels: {
                        color: textColor,
                        usePointStyle: true,
                        padding: 20,
                        font: { size: 12, weight: 500 as const },
                    },
                },
                tooltip: {
                    backgroundColor: 'rgba(45, 55, 72, 0.9)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: gridColor,
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    padding: 12,
                    titleFont: { size: 13, weight: 600 as const },
                    bodyFont: { size: 12 },
                    callbacks: {
                        // `label` 是 Chart.js 约定的回调名，不是 i18n 文案
                        title: (context) => `日期: ${context[0]?.label ?? ''}`,
                        label: (context) => `登录次数: ${context.parsed.y}`,
                    },
                },
            },
            interaction: {
                intersect: false,
                mode: 'index' as const,
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: '日期',
                        color: textColor,
                        font: { size: 12, weight: 500 as const },
                    },
                    ticks: {
                        color: mutedColor,
                        font: { size: 11 },
                        maxTicksLimit: 10,
                    },
                    grid: { color: gridColor },
                },
                y: {
                    display: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: '登录次数',
                        color: textColor,
                        font: { size: 12, weight: 500 as const },
                    },
                    ticks: {
                        color: mutedColor,
                        font: { size: 11 },
                        callback(value: string | number) {
                            return Number.isInteger(Number(value)) ? String(value) : ''
                        },
                    },
                    grid: { color: gridColor },
                },
            },
            elements: {
                line: { borderWidth: 2 },
                point: { borderWidth: 2 },
            },
            animation: reduceMotion ? false : { duration: 800, easing: 'easeInOutQuart' as const },
        },
    }
}

function renderChart() {
    if (!canvasRef.value) {
        return
    }
    chart?.destroy()
    chart = new Chart(canvasRef.value, buildConfig())
}

onMounted(renderChart)

watch(() => props.trendData, renderChart, { deep: true })

/* 主题切换后重算 token 颜色（暗色 / 浅色 token 在根元素上切换） */
watch(isDark, () => {
    nextTick(renderChart)
})

onBeforeUnmount(() => {
    chart?.destroy()
    chart = null
})
</script>

<style lang="scss" scoped>
.trend-chart {
    margin-bottom: 2rem;
    overflow: hidden;
    background: var(--admin-surface);
    border-radius: 12px;
    box-shadow: var(--admin-shadow);
}

.section-header {
    padding: 1.5rem 2rem;
    background: var(--admin-surface-muted);
    border-bottom: 1px solid var(--admin-border);
}

.section-title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-primary);
}

.chart-container {
    padding: 2rem;
    background: var(--admin-surface);

    .chart-canvas {
        display: block;
        width: 100%;
        height: 400px;
        padding: 1rem;
        background: var(--admin-surface);
        border-radius: 8px;
    }
}
</style>
