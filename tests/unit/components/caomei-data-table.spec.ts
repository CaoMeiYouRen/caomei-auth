import { mount } from '@vue/test-utils'
import type { Component } from 'vue'
import { describe, expect, it } from 'vitest'
import { CaomeiDataTable, type DataTableColumn } from 'caomei-ui'

/**
 * P4-0 DataTable spike（可复现证据）。
 *
 * 目的：在迁移第一个 Admin 数据页前，锁定 `CaomeiDataTable` 与现有 `BaseTable`（PrimeVue）
 * 的映射语义：列定义、插槽优先级、多选 / 全选、受控分页与 `page` / `first` 换算、
 * lazy 不切片、排序方向、空态与加载态。
 *
 * 结论见 docs/design/governance/2026-11-10-p4-0-decisions.md。本文件不引入生产组件，
 * 只验证目标库自身行为，避免「迁移后才发现语义不同」。
 */

interface Row {
    id: string
    name: string
    email: string
    profile: { city: string }
}

const rows: Row[] = [
    { id: 'u1', name: '张伟', email: 'zhang.wei@example.com', profile: { city: '北京' } },
    { id: 'u2', name: '李芳', email: 'li.fang@example.com', profile: { city: '上海' } },
    { id: 'u3', name: '王强', email: 'wang.qiang@example.com', profile: { city: '广州' } },
]

const columns: DataTableColumn<Row>[] = [
    { key: 'name', header: '姓名', sortable: true },
    { key: 'email', header: '邮箱' },
    { key: 'city', header: '城市', accessor: 'profile.city' },
]

function mountTable(props: Record<string, unknown> = {}, slots: Record<string, () => string> = {}) {
    /* 泛型组件在 @vue/test-utils 的 props 推断上与 Record 不兼容，这里收窄到 Component 运行期契约 */
    return mount(CaomeiDataTable as unknown as Component, {
        props: {
            data: rows,
            columns,
            rowKey: 'id',
            ...props,
        },
        slots,
    })
}

describe('CaomeiDataTable spike', () => {
    it('按 columns 渲染表头，支持点号 accessor', () => {
        const wrapper = mountTable()

        const headers = wrapper.findAll('thead th').map((header) => header.text())
        expect(headers).toEqual(['姓名', '邮箱', '城市'])

        const firstRow = wrapper.find('tbody tr')
        expect(firstRow.text()).toContain('张伟')
        expect(firstRow.text()).toContain('北京')
    })

    it('cell 函数与 #cell-{key} 插槽优先于 accessor', () => {
        const withCell = mountTable({
            columns: [
                ...columns,
                {
                    key: 'badge',
                    header: '标记',
                    accessor: () => '函数值',
                    cell: () => 'cell 函数',
                },
            ],
        })
        expect(withCell.find('tbody tr').text()).toContain('cell 函数')

        const withSlot = mountTable(
            { columns: [{ key: 'name', header: '姓名', accessor: () => 'accessor 值' }] },
            { 'cell-name': () => '插槽值' },
        )
        expect(withSlot.find('tbody tr').text()).toContain('插槽值')
        expect(withSlot.find('tbody tr').text()).not.toContain('accessor 值')
    })

    it('多选使用受控 selection，并回传完整行对象', async () => {
        const wrapper = mountTable({ selectionMode: 'multiple', selection: [rows[0]] })

        const rowCheckboxes = wrapper.findAll('tbody [role="checkbox"]')
        expect(rowCheckboxes).toHaveLength(rows.length)

        await rowCheckboxes[1]!.trigger('click')

        const selection = wrapper.emitted('update:selection')?.at(-1)?.[0] as Row[]
        expect(selection.map((row) => row.id)).toEqual(['u1', 'u2'])
    })

    it('全选（受控）回传全部行对象', async () => {
        const wrapper = mountTable({ selectionMode: 'multiple', selection: [] })

        const selectAll = wrapper.find('thead [role="checkbox"]')
        await selectAll.trigger('click')

        const selection = wrapper.emitted('update:selection')?.at(-1)?.[0] as Row[]
        expect(selection.map((row) => row.id)).toEqual(['u1', 'u2', 'u3'])
    })

    it('受控分页使用 1 基 page，并抛出 first / rows / pageCount', async () => {
        const wrapper = mountTable({
            paginator: true,
            page: 1,
            rows: 2,
            totalRecords: 5,
        })

        expect(wrapper.findAll('tbody tr')).toHaveLength(2)

        const labels = wrapper.findAll('.caomei-paginator button').map((button) => button.attributes('aria-label'))
        /* 默认 showEdges=false：只有上一页 / 页码 / 下一页；无「首页 / 末页」 */
        expect(labels).toEqual(['上一页', '第 1 页', '第 2 页', '第 3 页', '下一页'])
        await wrapper.findAll('.caomei-paginator button').at(-1)!.trigger('click')

        expect(wrapper.emitted('update:page')?.at(-1)).toEqual([2])
        const pageEvent = wrapper.emitted('page')?.at(-1)?.[0] as {
            page: number
            rows: number
            first: number
            pageCount: number
        }
        expect(pageEvent).toEqual({ page: 2, rows: 2, first: 2, pageCount: 3 })
    })

    it('lazy 模式不切片 data，分页器只按 totalRecords 计算页数', () => {
        const wrapper = mountTable({
            data: rows,
            lazy: true,
            paginator: true,
            page: 1,
            rows: 10,
            totalRecords: 25,
        })

        expect(wrapper.findAll('tbody tr')).toHaveLength(rows.length)
        /* 1 基 page 1 + totalRecords 25 / rows 10 => 3 页（1 2 3） */
        expect(wrapper.find('.caomei-paginator').text()).toBe('123')
        /* 关键差异：没有 PrimeVue 的「x 到 y 共 n 条」报告，总数需留在页面标题 */
        expect(wrapper.find('.caomei-paginator').text()).not.toContain('25')
    })

    it('非 lazy 模式按 page / rows 切片', async () => {
        const manyRows = Array.from({ length: 5 }, (_, index) => ({
            id: `u${index + 1}`,
            name: `用户${index + 1}`,
            email: `u${index + 1}@example.com`,
            profile: { city: '北京' },
        }))
        const wrapper = mountTable({
            data: manyRows,
            paginator: true,
            page: 1,
            rows: 2,
        })

        expect(wrapper.findAll('tbody tr')).toHaveLength(2)
        expect(wrapper.text()).toContain('用户1')
        expect(wrapper.text()).not.toContain('用户3')
    })

    it('排序事件使用 asc / desc，而非 PrimeVue 的 1 / -1', async () => {
        const wrapper = mountTable()

        await wrapper.find('.caomei-data-table__sort').trigger('click')
        expect(wrapper.emitted('sort')?.at(-1)?.[0]).toMatchObject({ sortField: 'name', sortOrder: 'asc' })

        await wrapper.find('.caomei-data-table__sort').trigger('click')
        expect(wrapper.emitted('sort')?.at(-1)?.[0]).toMatchObject({ sortField: 'name', sortOrder: 'desc' })
    })

    it('空态与加载态可直接承接 #empty / loading', () => {
        const empty = mountTable({ data: [] }, { empty: () => '没有数据' })
        expect(empty.text()).toContain('没有数据')

        const loading = mountTable({ loading: true })
        expect(loading.text()).toContain('加载中')
        expect(loading.find('.caomei-data-table').attributes('aria-busy')).toBe('true')
    })
})
