import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDataTable } from '@/composables/core/use-data-table'

describe('useDataTable', () => {
    const mockFetcher = vi.fn()

    beforeEach(() => {
        mockFetcher.mockReset()
        mockFetcher.mockResolvedValue({ data: [], total: 0 })
    })

    it('initializes with default values', () => {
        const { page, pageSize, sortField, sortOrder, loading, data, total } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        expect(page.value).toBe(0)
        expect(pageSize.value).toBe(10)
        expect(sortField.value).toBeUndefined()
        expect(sortOrder.value).toBe('desc')
        expect(loading.value).toBe(false)
        expect(data.value).toEqual([])
        expect(total.value).toBe(0)
    })

    it('calls fetcher immediately if immediate is true', async () => {
        useDataTable({
            fetcher: mockFetcher,
            immediate: true,
        })

        expect(mockFetcher).toHaveBeenCalledTimes(1)
    })

    it('loads data correctly', async () => {
        const mockData = [{ id: 1, name: 'Test' }]
        mockFetcher.mockResolvedValue({ data: mockData, total: 1 })

        const { load, data, total } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        await load()

        expect(data.value).toEqual(mockData)
        expect(total.value).toBe(1)
        expect(mockFetcher).toHaveBeenCalledWith(expect.objectContaining({
            page: 0,
            limit: 10,
        }))
    })

    it('handles pagination', async () => {
        const { onPage, page, pageSize } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        onPage({ page: 1, rows: 20 })

        expect(page.value).toBe(1)
        expect(pageSize.value).toBe(20)
        expect(mockFetcher).toHaveBeenCalledWith(expect.objectContaining({
            page: 1,
            limit: 20,
        }))
    })

    it('handles sorting', async () => {
        const { onSort, sortField, sortOrder } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        onSort({ sortField: 'name', sortOrder: 1 })

        expect(sortField.value).toBe('name')
        expect(sortOrder.value).toBe('asc')
        expect(mockFetcher).toHaveBeenCalledWith(expect.objectContaining({
            sortField: 'name',
            sortOrder: 'asc',
        }))
    })

    it('handles filtering', async () => {
        const { onFilter, page } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        // Simulate page change
        page.value = 2

        onFilter()

        expect(page.value).toBe(0) // Should reset to first page
        expect(mockFetcher).toHaveBeenCalled()
    })

    it('handles search', async () => {
        const { onSearch, page } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        page.value = 2
        onSearch()

        expect(page.value).toBe(0)
        expect(mockFetcher).toHaveBeenCalled()
    })

    it('handles errors', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { /* noop */ })
        mockFetcher.mockRejectedValue(new Error('Fetch failed'))

        const { load, loading } = useDataTable({
            fetcher: mockFetcher,
            immediate: false,
        })

        await expect(load()).rejects.toThrow('Fetch failed')
        expect(loading.value).toBe(false)

        consoleSpy.mockRestore()
    })
})
