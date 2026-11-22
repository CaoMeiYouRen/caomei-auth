import { onMounted, ref, watch } from 'vue'
import type { LoginEventHeatmap } from '@/utils/shared/api-schemas'
import { getApiErrorMessage } from '@/utils/shared/api-error'

/**
 * 登录事件热力图（阶段 12 M3.2）。
 *
 * 只负责请求聚合矩阵与切换 7 / 30 天窗口；颜色、可访问名与空 / 错误态由展示组件处理。
 */
interface HeatmapResponse {
    success: boolean
    data: LoginEventHeatmap
}

export function useLoginEventHeatmap() {
    const { t } = useI18n()
    const days = ref<7 | 30>(7)
    const loading = ref(false)
    const data = ref<LoginEventHeatmap | null>(null)
    const errorMessage = ref('')

    let requestId = 0

    const load = async () => {
        const current = ++requestId
        try {
            loading.value = true
            errorMessage.value = ''
            const response = await $fetch<HeatmapResponse>('/api/admin/login-events/heatmap', {
                query: { days: String(days.value) },
            })
            if (current !== requestId) {
                return
            }
            data.value = response.data
        } catch (error) {
            if (current !== requestId) {
                return
            }
            errorMessage.value = getApiErrorMessage(error, t('admin.logs.heatmap.loadFailedDescription'))
            data.value = null
        } finally {
            if (current === requestId) {
                loading.value = false
            }
        }
    }

    watch(days, load)
    onMounted(load)

    return { days, loading, data, errorMessage, reload: load }
}
