import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BaseTable from '@/components/base/table.vue'

describe('BaseTable', () => {
    const global = {
        stubs: {
            DataTable: {
                template: `
          <div class="p-datatable-stub">
            <slot />
            <div class="header-slot" v-if="$slots.header"><slot name="header" /></div>
            <button class="page-btn" @click="$emit('page', { page: 1 })">Page</button>
            <button class="sort-btn" @click="$emit('sort', { field: 'name', order: 1 })">Sort</button>
          </div>
        `,
                props: ['value', 'loading', 'totalRecords', 'rows', 'sortField', 'sortOrder'],
            },
        },
    }

    it('renders correctly with props', () => {
        const data = [{ id: 1, name: 'Test' }]
        const wrapper = mount(BaseTable, {
            props: {
                data,
                loading: false,
                totalRecords: 10,
                rows: 5,
                sortField: 'name',
                sortOrder: 1,
            },
            global,
        })

        expect(wrapper.find('.p-datatable-stub').exists()).toBe(true)
    })

    it('emits page event', async () => {
        const wrapper = mount(BaseTable, {
            props: {
                data: [],
                loading: false,
                totalRecords: 0,
                rows: 10,
            },
            global,
        })

        await wrapper.find('.page-btn').trigger('click')
        expect(wrapper.emitted('page')).toBeTruthy()
        expect(wrapper.emitted('page')![0]).toEqual([{ page: 1 }])
    })

    it('emits sort event', async () => {
        const wrapper = mount(BaseTable, {
            props: {
                data: [],
                loading: false,
                totalRecords: 0,
                rows: 10,
            },
            global,
        })

        await wrapper.find('.sort-btn').trigger('click')
        expect(wrapper.emitted('sort')).toBeTruthy()
        expect(wrapper.emitted('sort')![0]).toEqual([{ field: 'name', order: 1 }])
    })

    it('renders slots', () => {
        const wrapper = mount(BaseTable, {
            props: {
                data: [],
                loading: false,
                totalRecords: 0,
                rows: 10,
            },
            slots: {
                default: '<div class="default-content">Column</div>',
                header: '<div class="header-content">Header</div>',
            },
            global,
        })

        expect(wrapper.find('.default-content').exists()).toBe(true)
        expect(wrapper.find('.header-content').exists()).toBe(true)
    })
})
