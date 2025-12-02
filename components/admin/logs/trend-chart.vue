<template>
    <div class="trend-chart">
        <div class="section-header">
            <h2 class="section-title">
                登录趋势（最近30天）
            </h2>
        </div>
        <div class="chart-container">
            <Chart
                type="line"
                :data="chartData"
                :options="chartOptions"
                class="chart-canvas"
            />
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import dayjs from 'dayjs'
import { formatDate } from '@/utils/date'
import { useDemoMode } from '@/composables/use-demo-mode'

const props = defineProps<{
    trendData: any[]
}>()

const { isDemoMode } = useDemoMode()
const chartData = ref()
const chartOptions = ref()

// 设置图表数据
const setChartData = () => {
    // 如果没有数据且处于 Demo 模式，生成一些示例数据用于显示
    if ((!props.trendData || props.trendData.length === 0) && isDemoMode.value) {
        const labels: string[] = []
        const data: number[] = []

        // 生成最近7天的示例数据
        for (let i = 6; i >= 0; i--) {
            labels.push(dayjs().subtract(i, 'day').format('MM月DD日'))
            data.push(Math.floor(Math.random() * 10) + 1) // 1-10的随机数
        }

        return {
            labels,
            datasets: [
                {
                    label: '登录次数',
                    data,
                    fill: true,
                    borderColor: '#4285f4',
                    backgroundColor: 'rgba(66, 133, 244, 0.1)',
                    tension: 0.4,
                    pointBackgroundColor: '#4285f4',
                    pointBorderColor: '#2563eb',
                    pointHoverBackgroundColor: '#60a5fa',
                    pointHoverBorderColor: '#1d4ed8',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                },
            ],
        }
    }

    const dataList = props.trendData || []
    const labels = dataList.map((item: any) => formatDate(item.date))
    const data = dataList.map((item: any) => item.count)

    return {
        labels,
        datasets: [
            {
                label: '登录次数',
                data,
                fill: true,
                borderColor: '#4285f4',
                backgroundColor: 'rgba(66, 133, 244, 0.1)',
                tension: 0.4,
                pointBackgroundColor: '#4285f4',
                pointBorderColor: '#2563eb',
                pointHoverBackgroundColor: '#60a5fa',
                pointHoverBorderColor: '#1d4ed8',
                pointRadius: 4,
                pointHoverRadius: 6,
            },
        ],
    }
}

// 设置图表配置
const setChartOptions = () => ({
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 0.8,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            labels: {
                color: '#2d3748',
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12,
                    weight: 500,
                },
            },
        },
        tooltip: {
            backgroundColor: 'rgba(45, 55, 72, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#ffffff',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            padding: 12,
            titleFont: {
                size: 13,
                weight: 600,
            },
            bodyFont: {
                size: 12,
            },
            callbacks: {
                title: (context: any) => `日期: ${context[0].label}`,
                label: (context: any) => `登录次数: ${context.parsed.y}`,
            },
        },
    },
    interaction: {
        intersect: false,
        mode: 'index',
    },
    scales: {
        x: {
            display: true,
            title: {
                display: true,
                text: '日期',
                color: '#2d3748',
                font: {
                    size: 12,
                    weight: 500,
                },
            },
            ticks: {
                color: '#718096',
                font: {
                    size: 11,
                },
                maxTicksLimit: 10,
            },
            grid: {
                color: '#e2e8f0',
                drawBorder: false,
            },
        },
        y: {
            display: true,
            title: {
                display: true,
                text: '登录次数',
                color: '#2d3748',
                font: {
                    size: 12,
                    weight: 500,
                },
            },
            ticks: {
                color: '#718096',
                font: {
                    size: 11,
                },
                beginAtZero: true,
                callback(value: any) {
                    return Number.isInteger(value) ? value : null
                },
            },
            grid: {
                color: '#e2e8f0',
                drawBorder: false,
            },
        },
    },
    elements: {
        line: {
            borderWidth: 2,
        },
        point: {
            borderWidth: 2,
        },
    },
    animation: {
        duration: 1000,
        easing: 'easeInOutQuart',
    },
})

const updateChart = () => {
    chartData.value = setChartData()
    chartOptions.value = setChartOptions()
}

watch(() => props.trendData, () => {
    updateChart()
}, { deep: true })

onMounted(() => {
    updateChart()
})
</script>

<style lang="scss" scoped>
.trend-chart {
    background: $background-light;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(0 0 0 / 0.1);
    margin-bottom: 2rem;
    overflow: hidden;
}

.section-header {
    padding: 1.5rem 2rem;
    border-bottom: 1px solid $border-color;
    background: linear-gradient(135deg, $background 0%, $background-light 100%);
}

.section-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: $primary;
    margin: 0;
}

.chart-container {
    padding: 2rem;
    background: $background-light;

    .chart-canvas {
        height: 400px;
        background: $background-light;
        border-radius: 8px;
        padding: 1rem;

        :deep(canvas) {
            background: transparent !important;
            border-radius: 8px;
        }
    }
}
</style>
