import { onMounted, onScopeDispose, ref, watch } from 'vue'
import { debounce } from 'lodash-es'
import type { DatePickerRange } from 'caomei-ui'
import { useDataTable } from '../core/use-data-table'
import type { LoginEventView } from '@/utils/shared/api-schemas'
import type { LoginEventChannel, LoginEventResult, LoginEventType } from '@/utils/shared/login-events'
import { getApiErrorMessage } from '@/utils/shared/api-error'

/**
 * 管理端登录事件视图（阶段 12 M2.3）。
 *
 * 与服务端共用 `loginEventViewSchema` 的类型；筛选条件与 `GET /api/admin/login-events`
 * 的 query schema 一一对应，日期区间按当日 `23:59:59.999` 补齐。
 */
interface LoginEventsResponse {
    success: boolean
    data: {
        events: LoginEventView[]
        pagination: {
            page: number
            limit: number
            total: number
            totalPages: number
        }
    }
}

export function useLoginEvents() {
    const { t } = useI18n()

    const typeFilter = ref<LoginEventType | undefined>(undefined)
    const resultFilter = ref<LoginEventResult | undefined>(undefined)
    const channelFilter = ref<LoginEventChannel | undefined>(undefined)
    const ipFilter = ref('')
    const dateRange = ref<DatePickerRange | null>(null)
    const errorMessage = ref('')

    const fetcher = async (params: { page: number, limit: number, sortOrder?: 'asc' | 'desc' }) => {
        const query: Record<string, string | number> = {
            page: params.page + 1,
            limit: params.limit,
            sort: params.sortOrder === 'asc' ? 'asc' : 'desc',
        }
        if (typeFilter.value) {
            query.type = typeFilter.value
        }
        if (resultFilter.value) {
            query.result = resultFilter.value
        }
        if (channelFilter.value) {
            query.channel = channelFilter.value
        }
        if (ipFilter.value.trim()) {
            query.ip = ipFilter.value.trim()
        }
        if (dateRange.value) {
            query.startDate = dateRange.value[0].toISOString()
            const end = new Date(dateRange.value[1])
            end.setHours(23, 59, 59, 999)
            query.endDate = end.toISOString()
        }

        try {
            const response = await $fetch<LoginEventsResponse>('/api/admin/login-events', { query })
            errorMessage.value = ''
            return {
                data: response.data.events,
                total: response.data.pagination.total,
            }
        } catch (error) {
            errorMessage.value = getApiErrorMessage(error, t('admin.logs.events.loadFailedDescription'))
            return { data: [], total: 0 }
        }
    }

    const table = useDataTable<LoginEventView>({
        fetcher,
        defaultPageSize: 20,
        defaultSortField: 'createdAt',
        /* SSR 的 $fetch 不转发 Cookie，挂载后再请求，避免首屏 401 假错误 */
        immediate: false,
    })

    const reload = () => {
        table.page.value = 0
        table.load()
    }

    watch([typeFilter, resultFilter, channelFilter, dateRange], reload)

    const onIpChange = debounce(reload, 500)

    onMounted(reload)
    onScopeDispose(() => onIpChange.cancel())

    return {
        typeFilter,
        resultFilter,
        channelFilter,
        ipFilter,
        dateRange,
        errorMessage,
        ...table,
        reload,
        onIpChange,
    }
}
