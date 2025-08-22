// eslint.config.js
import cmyrConfig from 'eslint-config-cmyr/nuxt'
import withNuxt from './.nuxt/eslint.config.mjs'
export default withNuxt(cmyrConfig,
    {
        ignores: [
            'node_modules',
            '.husky',
            '.git',
            '.nuxt',
            '.output',
            '.vercel',
            '.vitepress',
            'dist',
            'public',
            'static',
            'coverage',
            'logs',
        ],
        rules: {
            'no-console': 0,
            // 保留原有的一些特殊配置，但移除已经无效的规则
            'vue/multi-word-component-names': 0,
            '@stylistic/operator-linebreak': [1, 'before', { overrides: { '=': 'after' } }], // '?': 'before', ':': 'before', '|': 'before', '&': 'before',
            '@stylistic/indent': [1, 4, { SwitchCase: 1 }],
        },
    },
)
