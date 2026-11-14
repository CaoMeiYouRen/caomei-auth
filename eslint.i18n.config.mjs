import vueI18n from '@intlify/eslint-plugin-vue-i18n'
import * as jsoncParser from 'jsonc-eslint-parser'

// i18n 语言包专用 ESLint 配置（`pnpm lint:i18n`）。
// 与仓库主配置分离：只加载 @intlify/eslint-plugin-vue-i18n 的语法校验与 JSON 解析器，
// 目标为 i18n/locales 下的模块 JSON，避免日常 lint 把「页面文案尚未迁移」当成错误。
//
// 只启用 `valid-message-syntax`：插件按「一个文件一种语言」模型解析 locale，
// 与本项目「每语言多模块文件」的结构不匹配（`no-duplicate-keys-in-locale` 实测
// 204 条跨语言误报，`valid-plural-forms` 取不到可信 locale）；复数分隔符禁令改由
// `pnpm test:i18n` 的「文案不含复数分隔符」断言覆盖。
export default [
    {
        name: 'caomei-auth/i18n-locales',
        files: ['i18n/locales/**/*.json'],
        languageOptions: {
            parser: jsoncParser,
        },
        plugins: {
            '@intlify/vue-i18n': vueI18n,
        },
        settings: {
            'vue-i18n': {
                // `valid-message-syntax` 需要 localeDir 定位语言包资源
                localeDir: ['./i18n/locales/*/*.json'],
                messageSyntaxVersion: '^11.0.0',
            },
        },
        rules: {
            // 语言包必须能编译（未闭合占位符、花括号语法错误等在此拦截）
            '@intlify/vue-i18n/valid-message-syntax': 'error',
        },
    },
]
