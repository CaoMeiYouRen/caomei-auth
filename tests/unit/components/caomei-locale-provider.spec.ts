import { mount } from '@vue/test-utils'
import { type Component, defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import { CaomeiConfigProvider, CaomeiDataTable, type CaomeiLocale, useLocale, useLocaleCode } from 'caomei-ui'
import { toCaomeiLocale } from '@/composables/utils/use-caomei-locale'

/**
 * 阶段 5 M1（见 docs/design/governance/2026-11-15-m1-caomei-ui-1.3.0.md）契约测试：
 * 项目 locale 经 `CaomeiConfigProvider` 注入后，组件库内建文案随语言切换。
 *
 * 只验证「接线」——映射函数 + provider + 消费组件；不复制组件库自身的文案表，
 * 因此除 M1 验收要求的 DataTable 空态锚点外，断言以「与中文文案不同」为准。
 */
const Probe = defineComponent({
    setup() {
        const messages = useLocale()
        const locale = useLocaleCode()
        return () => h('div', {
            'data-locale-code': locale.value,
            'data-table-empty': messages.value.table.empty,
            'data-pagination': messages.value.pagination.label,
            'data-confirm': messages.value.confirm.confirm,
            'data-toast': messages.value.toast.close,
            'data-select-clear': messages.value.select.clear,
            'data-multiselect-empty': messages.value.multiSelect.empty,
        })
    },
})

const PROBED_KEYS = [
    'data-table-empty',
    'data-pagination',
    'data-confirm',
    'data-toast',
    'data-select-clear',
    'data-multiselect-empty',
] as const

/** locale 作为 prop 传入，便于 `setProps` 验证运行时切换（app 里是 computed，语义一致）。 */
const Host = defineComponent({
    props: {
        locale: { type: String, required: true },
    },
    setup(props) {
        return () => h(CaomeiConfigProvider, { locale: props.locale as CaomeiLocale }, {
            default: () => h(Probe),
        })
    },
})

function mountProbe(code: string) {
    return mount(Host, { props: { locale: toCaomeiLocale(code) } })
}

function probeAttrs(code: string) {
    const wrapper = mountProbe(code)
    return wrapper.find('div').attributes()
}

function mountEmptyTable(locale: CaomeiLocale) {
    const TableHost = defineComponent({
        setup() {
            return () => h(CaomeiConfigProvider, { locale }, {
                default: () => h(CaomeiDataTable as unknown as Component, {
                    columns: [{ key: 'name', header: 'Name' }],
                    data: [],
                }),
            })
        },
    })
    return mount(TableHost)
}

describe('CaomeiConfigProvider locale 桥接', () => {
    it('英文下内建文案为英文', () => {
        const zh = probeAttrs('zh-CN')
        const en = probeAttrs('en-US')

        expect(en['data-locale-code']).toBe('en-US')
        expect(zh['data-locale-code']).toBe('zh-CN')
        for (const key of PROBED_KEYS) {
            expect(en[key]).toBeTruthy()
            expect(en[key]).not.toBe(zh[key])
        }
    })

    it('M1 验收锚点：DataTable 空态 / Confirm 默认文案', () => {
        const en = probeAttrs('en-US')
        const zh = probeAttrs('zh-CN')

        expect(en['data-table-empty']).toBe('No data')
        expect(en['data-confirm']).toBe('Confirm')
        expect(zh['data-table-empty']).toBe('暂无数据')
        expect(zh['data-confirm']).toBe('确定')
    })

    it('切换语言后内建文案同步更新', async () => {
        const wrapper = mountProbe('zh-CN')

        expect(wrapper.find('div').attributes('data-table-empty')).toBe('暂无数据')

        await wrapper.setProps({ locale: toCaomeiLocale('en-US') })

        expect(wrapper.find('div').attributes('data-locale-code')).toBe('en-US')
        expect(wrapper.find('div').attributes('data-table-empty')).toBe('No data')
        expect(wrapper.find('div').attributes('data-confirm')).toBe('Confirm')
    })

    it('空表英文渲染 DataTable 空态英文', () => {
        const wrapper = mountEmptyTable(toCaomeiLocale('en-US'))

        expect(wrapper.text()).toContain('No data')
    })

    it('空表中文渲染 DataTable 空态中文', () => {
        const wrapper = mountEmptyTable(toCaomeiLocale('zh-CN'))

        expect(wrapper.text()).toContain('暂无数据')
    })
})
