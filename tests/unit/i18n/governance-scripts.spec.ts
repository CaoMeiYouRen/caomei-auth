import { describe, expect, it } from 'vitest'
import {
    diffFlatKeys,
    flattenMessages,
    hasKeyReference,
} from '../../../scripts/i18n/lib/locale-data.mjs'
import {
    countHardcodedLines,
    diffHardcodedAllowlist,
    extractVueScripts,
    extractVueTemplate,
} from '../../../scripts/i18n/lib/hardcoded-scan.mjs'
import { validateLocaleRegistry } from '../../../scripts/i18n/lib/registry-rules.mjs'

const validRegistry = {
    DEFAULT_LOCALE: 'zh-CN',
    LOCALE_REGISTRY: [
        {
            code: 'zh-CN',
            name: '简体中文',
            nativeName: '简体中文',
            dir: 'ltr',
            default: true,
            enabled: true,
            fallbackChain: ['zh-CN'],
            routePrefix: '',
            readiness: 'seo-ready',
            switchable: true,
            indexable: true,
            files: ['zh-CN/common.json'],
        },
        {
            code: 'en-US',
            name: 'English',
            nativeName: 'English',
            dir: 'ltr',
            default: false,
            enabled: true,
            fallbackChain: ['en-US', 'zh-CN'],
            routePrefix: '/en-US',
            readiness: 'ui-ready',
            switchable: true,
            indexable: false,
            files: ['en-US/common.json'],
        },
    ],
}

const validDiskState = {
    directories: ['en-US', 'zh-CN'],
    filesByLocale: {
        'zh-CN': ['common.json'],
        'en-US': ['common.json'],
    },
}

describe('i18n 治理脚本：语言数据工具', () => {
    it('把嵌套语言对象拍平为点分隔键', () => {
        expect(flattenMessages({
            app: { name: '草梅 Auth' },
            language: { label: '语言', short: '中文' },
        })).toEqual([
            { key: 'app.name', value: '草梅 Auth' },
            { key: 'language.label', value: '语言' },
            { key: 'language.short', value: '中文' },
        ])
    })

    it('忽略空对象并保留非对象叶子', () => {
        expect(flattenMessages({ empty: {}, list: ['a'] })).toEqual([{ key: 'list', value: ['a'] }])
    })

    it('区分缺失键与多余键', () => {
        const base = new Map([['a', '1'], ['b', '2']])
        const target = new Map([['a', '1'], ['c', '3']])
        expect(diffFlatKeys(base, target)).toEqual({ missing: ['b'], extra: ['c'] })
    })

    it('按键名边界匹配引用，避免前缀误命中', () => {
        const source = 't(\'validation.invalidValue\') // t(\'validation.invalid\')'
        expect(hasKeyReference(source, 'validation.invalid')).toBe(true)
        expect(hasKeyReference('t(\'validation.invalidValue\')', 'validation.invalid')).toBe(false)
        expect(hasKeyReference('app-name', 'app.name')).toBe(false)
    })
})

describe('i18n 治理脚本：硬编码中文扫描', () => {
    it('统计模板与脚本中的中文，忽略注释', () => {
        const source = `<template>
    <div>登录</div>
    <!-- 注释里的中文 -->
    <span>{{ '中文' }}</span>
</template>

<script setup lang="ts">
const label = '脚本里的中文'
</script>
`
        expect(extractVueTemplate(source)).toContain('登录')
        /* 模板 2 行 + 脚本 1 行；注释不计入 */
        expect(countHardcodedLines('pages/login.vue', source)).toBe(3)
    })

    it('保留嵌套 template slot 中的内容', () => {
        const source = `<template>
    <BaseDialog>
        <template #footer>
            <button>确定</button>
        </template>
    </BaseDialog>
</template>`
        expect(countHardcodedLines('components/dialog.vue', source)).toBe(1)
    })

    it('完整移除嵌套 / 连续 HTML 注释', () => {
        const source = `<template>
    <div>登录</div>
    <!-- <!-- 注释里的中文 -->
    <!-- 另一个注释 -->
    <span>注册</span>
</template>`
        expect(countHardcodedLines('pages/auth.vue', source)).toBe(2)
    })

    it('把 `<script setup>` 中的文案计入基线', () => {
        const source = `<template>
    <div>用户管理</div>
</template>

<script setup lang="ts">
const columns = [
    { key: 'role', header: '角色' },
    { key: 'status', header: '状态' },
]
</script>`
        expect(extractVueScripts(source)).toContain('角色')
        expect(countHardcodedLines('pages/admin/users.vue', source)).toBe(3)
    })

    it('脚本块中的注释不计入基线', () => {
        const source = `<template>
    <div>标题</div>
</template>

<script setup lang="ts">
// 中文注释
/* 块注释里的中文 */
const label = '保存'
</script>`
        expect(countHardcodedLines('pages/example.vue', source)).toBe(2)
    })

    it('模板与多个脚本块合并计数', () => {
        const source = `<template><div>甲</div></template>
<script lang="ts">const a = '乙'</script>
<script setup lang="ts">const b = '丙'</script>`
        expect(countHardcodedLines('components/example.vue', source)).toBe(3)
    })

    it('HTML 注释中的 `<script>` 不计入，字符串中的 `</script>` 按 SFC 同口径截断', () => {
        const source = `<template>
    <div>标题</div>
</template>

<!-- <script setup lang="ts">const hidden = '注释里的中文'</script> -->
<script setup lang="ts">
const label = '保存'
const close = '</script>'
const after = '截断后的中文'
</script>`
        const scripts = extractVueScripts(source)
        expect(scripts).not.toContain('注释里的中文')
        expect(scripts).toContain('保存')
        expect(scripts).not.toContain('截断后的中文')
        /* 模板 1 行 + 截断前的脚本 1 行 */
        expect(countHardcodedLines('components/edge.vue', source)).toBe(2)
    })

    it('TypeScript 忽略块注释与整行注释', () => {
        const source = `// 整行注释
/* 块注释
 * 继续
 */
const message = '请输入邮箱'
logger.info('console message')
`
        expect(countHardcodedLines('server/utils/error.ts', source)).toBe(1)
    })

    it('按文件比较基线的增减', () => {
        const current = new Map([['a.vue', 2], ['b.vue', 1]])
        const result = diffHardcodedAllowlist(current, { 'a.vue': 1, 'c.vue': 3 })
        expect(result.newFiles).toEqual([{ file: 'b.vue', count: 1 }])
        expect(result.increased).toEqual([{ file: 'a.vue', count: 2, allowed: 1 }])
        expect(result.stale).toEqual([{ file: 'c.vue', allowed: 3 }])
    })
})

describe('i18n 治理脚本：Locale Registry 校验', () => {
    it('接受合法的 Registry', () => {
        expect(validateLocaleRegistry(validRegistry, validDiskState)).toEqual([])
    })

    it('拒绝 ui-ready 但可索引的语言', () => {
        const registry = structuredClone(validRegistry)
        const english = registry.LOCALE_REGISTRY[1]!
        english.indexable = true
        expect(validateLocaleRegistry(registry, validDiskState)).toContain('locale en-US 尚未 seo-ready，indexable 必须为 false')
    })

    it('拒绝未启用语言开放切换或索引', () => {
        const registry = structuredClone(validRegistry)
        const disabled = structuredClone(registry.LOCALE_REGISTRY[1]!)
        disabled.code = 'ja-JP'
        disabled.enabled = false
        disabled.switchable = true
        disabled.indexable = true
        registry.LOCALE_REGISTRY.push(disabled)
        const errors = validateLocaleRegistry(registry, validDiskState)
        expect(errors).toContain('locale ja-JP 未启用，switchable 必须为 false')
        expect(errors).toContain('locale ja-JP 未启用，indexable 必须为 false')
    })

    it('未启用语言不要求目录与语言文件', () => {
        const registry = structuredClone(validRegistry)
        const disabled = structuredClone(registry.LOCALE_REGISTRY[1]!)
        disabled.code = 'ja-JP'
        disabled.enabled = false
        disabled.switchable = false
        disabled.indexable = false
        disabled.readiness = 'draft'
        disabled.routePrefix = '/ja-JP'
        disabled.fallbackChain = ['ja-JP', 'en-US', 'zh-CN']
        disabled.files = ['ja-JP/common.json']
        registry.LOCALE_REGISTRY.push(disabled)
        expect(validateLocaleRegistry(registry, validDiskState)).toEqual([])
    })

    it('要求回退链最终回到默认语言', () => {
        const registry = structuredClone(validRegistry)
        const english = registry.LOCALE_REGISTRY[1]!
        english.fallbackChain = ['en-US']
        expect(validateLocaleRegistry(registry, validDiskState)).toContain('locale en-US 的 fallbackChain 必须最终回退到 zh-CN')
    })

    it('拒绝未登记的语言文件与目录', () => {
        const diskState = {
            directories: ['en-US', 'zh-CN', 'ja-JP'],
            filesByLocale: {
                'zh-CN': ['common.json', 'extra.json'],
                'en-US': ['common.json'],
                'ja-JP': ['common.json'],
            },
        }
        const errors = validateLocaleRegistry(validRegistry, diskState)
        expect(errors).toContain('locale zh-CN 存在未注册的语言文件：zh-CN/extra.json')
        expect(errors).toContain('i18n/locales/ja-JP 未在 Locale Registry 中登记')
    })
})
