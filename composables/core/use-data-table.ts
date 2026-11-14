import { ref, type Ref } from 'vue'

export interface DataTableFetchParams {
    page: number
    limit: number
    sortField?: string
    sortOrder?: 'asc' | 'desc'
    filters?: Record<string, any>
    searchQuery?: string
}

export interface UseDataTableOptions<T> {
    fetcher: (params: DataTableFetchParams) => Promise<{ data: T[], total: number }>
    defaultPageSize?: number
    defaultSortField?: string
    defaultSortOrder?: 'asc' | 'desc'
    immediate?: boolean
}

export function useDataTable<T = any>(options: UseDataTableOptions<T>) {
    const {
        fetcher,
        defaultPageSize = 10,
        defaultSortField,
        defaultSortOrder = 'desc',
        immediate = true,
    } = options

    const loading = ref(false)
    const data = ref<T[]>([]) as Ref<T[]>
    const total = ref(0)
    const page = ref(0)
    const pageSize = ref(defaultPageSize)
    const sortField = ref(defaultSortField)
    const sortOrder = ref<'asc' | 'desc'>(defaultSortOrder)
    const filters = ref<Record<string, any>>({})
    const searchQuery = ref('')
    /**
     * 每页条数意图（来自 `CaomeiDataTable` 的 `update:rows`）。
     *
     * 切换每页条数时组件先抛 `update:rows`，Reka 分页器随后还会补一次仍带**旧 rows** 的
     * `page` 事件；两者若都落到 `onPage`，会先用新条数请求、再用旧条数覆盖回去，形成
     * 「页码已换、条数回退」的越界请求。用意图过滤掉这类过期事件，不改变正常翻页。
     */
    const rowsIntent = ref<number | null>(null)

    const load = async () => {
        loading.value = true
        try {
            const result = await fetcher({
                page: page.value,
                limit: pageSize.value,
                sortField: sortField.value,
                sortOrder: sortOrder.value,
                filters: filters.value,
                searchQuery: searchQuery.value,
            })
            data.value = result.data
            total.value = result.total
        } catch (error) {
            console.error('Failed to load data', error)
            throw error
        } finally {
            loading.value = false
        }
    }

    const onPage = (event: { page: number, rows: number }) => {
        /* 携带旧 `rows` 的补发事件：跳过，避免覆盖刚生效的每页条数 */
        if (rowsIntent.value !== null && event.rows !== rowsIntent.value) {
            return
        }
        page.value = event.page
        pageSize.value = event.rows
        load()
    }

    /** 记录每页条数变更意图；后续合法翻页事件的 `rows` 会与之一致 */
    const onRowsChange = (rows: number) => {
        rowsIntent.value = rows
    }

    const onSort = (event: { sortField: string, sortOrder: number }) => {
        sortField.value = event.sortField
        sortOrder.value = event.sortOrder === 1 ? 'asc' : 'desc'
        load()
    }

    const onFilter = () => {
        page.value = 0 // Reset to first page on filter
        load()
    }

    const onSearch = () => {
        page.value = 0
        load()
    }

    if (immediate) {
        load()
    }

    return {
        loading,
        data,
        total,
        page,
        pageSize,
        sortField,
        sortOrder,
        filters,
        searchQuery,
        load,
        onPage,
        onRowsChange,
        onSort,
        onFilter,
        onSearch,
    }
}
