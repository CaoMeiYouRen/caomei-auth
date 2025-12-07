// eslint.config.js
import cmyrConfig from 'eslint-config-cmyr/nuxt'
import { globalIgnores } from 'eslint/config'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(cmyrConfig,
    globalIgnores([
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
        'jscpd-report',
    ]),
    {
        rules: {
            'no-console': 0,
            // 保留原有的一些特殊配置，但移除已经无效的规则
            'vue/multi-word-component-names': 0,
            '@stylistic/operator-linebreak': [1, 'before', { overrides: { '=': 'after' } }], // '?': 'before', ':': 'before', '|': 'before', '&': 'before',
            '@stylistic/indent': [1, 4, {
                ArrayExpression: 1,
                CallExpression: { arguments: 1 },
                flatTernaryExpressions: false,
                FunctionDeclaration: { body: 1, parameters: 1, returnType: 1 },
                FunctionExpression: { body: 1, parameters: 1, returnType: 1 },
                ignoreComments: false,
                ignoredNodes: [
                    'TSUnionType',
                    'TSIntersectionType',
                ],
                ImportDeclaration: 1,
                MemberExpression: 1,
                ObjectExpression: 1,
                offsetTernaryExpressions: false,
                outerIIFEBody: 1,
                SwitchCase: 1,
                tabLength: 4,
                VariableDeclarator: 1,
            }],
            '@stylistic/no-trailing-spaces': [1, { skipBlankLines: true, ignoreComments: false }],
            'max-lines': [1, { max: 800 }], // 强制文件的最大行数
            'max-lines-per-function': [0, { max: 150 }], // 强制函数最大行数
        },
    },
)
