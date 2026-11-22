import { enableAutoUnmount, flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import LoginEventsPanel from '@/components/admin/logs/login-events-panel.vue'
import { useI18nText } from '@/tests/mocks/i18n-text'

mockNuxtImport('useI18n', () => () => ({ t: useI18nText() }))

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }))
mockNuxtImport('$fetch', () => fetchMock)

enableAutoUnmount(afterEach)

const CaomeiDataTableStub = {
    name: 'CaomeiDataTable',
    props: ['data', 'columns', 'loading', 'emptyText', 'page', 'rows'],
    emits: ['page', 'sort', 'update:rows'],
    template: `<div class="table-stub">
        <p v-if="!data.length" class="empty-stub">{{ emptyText }}</p>
        <div v-for="row in data" :key="row.id" class="row-stub">
            <slot name="cell-type" :row="row" />
            <slot name="cell-result" :row="row" />
            <slot name="cell-channel" :row="row" />
            <slot name="cell-userId" :row="row" />
            <slot name="cell-userAgent" :row="row" />
            <slot name="cell-ip" :row="row" />
        </div>
    </div>`,
}

const globalStubs = {
    CaomeiDataTable: CaomeiDataTableStub,
    CaomeiSelect: {
        name: 'CaomeiSelect',
        props: ['modelValue', 'options', 'label', 'placeholder'],
        emits: ['update:modelValue'],
        template: '<div class="select-stub" />',
    },
    CaomeiInput: {
        name: 'CaomeiInput',
        props: ['modelValue', 'label', 'placeholder'],
        emits: ['update:modelValue'],
        template: '<div class="input-stub" />',
    },
    CaomeiDatePicker: {
        name: 'CaomeiDatePicker',
        props: ['modelValue', 'label', 'placeholder'],
        emits: ['update:modelValue'],
        template: '<div class="date-stub" />',
    },
    CaomeiButton: {
        name: 'CaomeiButton',
        template: '<button class="button-stub"><slot /><slot name="icon" /></button>',
    },
    CaomeiTag: {
        name: 'CaomeiTag',
        template: '<span class="tag-stub"><slot /></span>',
    },
    NuxtLink: {
        name: 'NuxtLink',
        props: ['to'],
        template: '<a class="link-stub" :href="to"><slot /></a>',
    },
}

const eventRow = {
    id: 'event-1',
    type: 'sign_in_failure',
    result: 'failure',
    channel: 'email',
    userId: 'user-1',
    ip: '203.0.113.9',
    userAgent: 'Mozilla/5.0 test',
    metadata: { reason: 'INVALID' },
    createdAt: '2026-11-20T08:00:00.000Z',
}

function mockResponse(events = [eventRow], total = events.length) {
    fetchMock.mockResolvedValue({
        success: true,
        data: {
            events,
            pagination: { page: 1, limit: 20, total, totalPages: Math.ceil(total / 20) },
        },
    })
}

function mountPanel() {
    return mount(LoginEventsPanel, {
        global: { stubs: globalStubs },
    })
}

describe('LoginEventsPanel', () => {
    beforeEach(() => {
        fetchMock.mockReset()
        mockResponse()
    })

    it('加载事件并以链接、标签与截断 UA 展示', async () => {
        const wrapper = mountPanel()
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledTimes(1)
        expect(wrapper.text()).toContain('登录失败')
        expect(wrapper.text()).toContain('失败')
        expect(wrapper.text()).toContain('邮箱')
        expect(wrapper.find('.link-stub').attributes('href')).toBe('/admin/users?userId=user-1')
        expect(wrapper.find('.user-agent').attributes('title')).toBe('Mozilla/5.0 test')
    })

    it('空数据渲染空态文案', async () => {
        mockResponse([], 0)
        const wrapper = mountPanel()
        await flushPromises()

        expect(wrapper.find('.empty-stub').text()).toBe('暂无登录事件')
        expect(wrapper.findAll('.row-stub')).toHaveLength(0)
    })

    it('切换事件类型筛选会带上 query 重新加载', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        fetchMock.mockClear()

        const selects = wrapper.findAllComponents({ name: 'CaomeiSelect' })
        await selects[0]!.vm.$emit('update:modelValue', 'sign_in_failure')
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/login-events', expect.objectContaining({
            query: expect.objectContaining({ type: 'sign_in_failure', page: 1, sort: 'desc' }),
        }))
    })

    it('分页事件映射为 1 基页码请求', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        fetchMock.mockClear()

        const table = wrapper.findComponent({ name: 'CaomeiDataTable' })
        await table.vm.$emit('page', { first: 20, rows: 10 })
        await flushPromises()

        expect(fetchMock).toHaveBeenCalledWith('/api/admin/login-events', expect.objectContaining({
            query: expect.objectContaining({ page: 3, limit: 10 }),
        }))
    })

    it('切换结果筛选与会话通道会带上对应 query', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        fetchMock.mockClear()

        const selects = wrapper.findAllComponents({ name: 'CaomeiSelect' })
        await selects[1]!.vm.$emit('update:modelValue', 'failure')
        await flushPromises()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/login-events', expect.objectContaining({
            query: expect.objectContaining({ result: 'failure' }),
        }))

        await selects[2]!.vm.$emit('update:modelValue', 'sso')
        await flushPromises()
        expect(fetchMock).toHaveBeenLastCalledWith('/api/admin/login-events', expect.objectContaining({
            query: expect.objectContaining({ result: 'failure', channel: 'sso' }),
        }))
    })

    it('日期区间按当日末刻补齐 endDate', async () => {
        const wrapper = mountPanel()
        await flushPromises()
        fetchMock.mockClear()

        const start = new Date(2026, 10, 1)
        const end = new Date(2026, 10, 22)
        await wrapper.findComponent({ name: 'CaomeiDatePicker' }).vm.$emit('update:modelValue', [start, end])
        await flushPromises()

        const call = fetchMock.mock.calls.at(-1)
        const query = call?.[1]?.query as Record<string, string>
        expect(query.startDate).toBe(start.toISOString())
        expect(query.endDate).toBe(new Date(2026, 10, 22, 23, 59, 59, 999).toISOString())
    })

    it('加载失败展示错误态并可重试', async () => {
        fetchMock.mockRejectedValueOnce(new Error('network down'))
        const wrapper = mountPanel()
        await flushPromises()

        expect(wrapper.find('[role="alert"]').text()).toContain('network down')

        fetchMock.mockResolvedValueOnce({
            success: true,
            data: { events: [eventRow], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } },
        })
        await wrapper.find('[role="alert"] button').trigger('click')
        await flushPromises()

        expect(wrapper.find('[role="alert"]').exists()).toBe(false)
        expect(wrapper.findAll('.row-stub')).toHaveLength(1)
    })
})
