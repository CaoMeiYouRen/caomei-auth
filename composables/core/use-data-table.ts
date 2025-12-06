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
        page.value = event.page
        pageSize.value = event.rows
        load()
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
        onSort,
        onFilter,
        onSearch,
    }
}
