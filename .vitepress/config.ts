import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "草梅 Auth 文档",
    description: "草梅 Auth 是一个基于 Nuxt 全栈框架的统一登录平台。支持 OAuth2.0 协议，集成邮箱、用户名、手机号、验证码、社交媒体等多种登录注册方式。",
    lang: 'zh-CN',
    // 显示最后更新时间
    lastUpdated: true,
    // 删除 .html 后缀
    cleanUrls: true,
    // 不会因为死链而导致构建失败
    ignoreDeadLinks: true,
    // 重定向路由
    rewrites: {
        'README.md': 'index.md',
        'CHANGELOG.md': 'changelog.md',
        'CONTRIBUTING.md': 'contributing.md',
        'SECURITY.md': 'security.md',
        'CODE_OF_CONDUCT.md': 'code-of-conduct.md'
    },
    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: '首页', link: '/' },
            { text: '开发者文档', link: '/docs/developer/' },
            { text: '社交登录', link: '/docs/social-login/' },
            { text: '项目规划', link: '/docs/PLAN' },
            { text: '更新日志', link: 'https://github.com/CaoMeiYouRen/caomei-auth/blob/master/CHANGELOG.md' },
            {
                text: '更多',
                items: [
                    { text: '贡献指南', link: '/contributing' },
                    { text: '安全政策', link: '/security' },
                    { text: '行为准则', link: '/code-of-conduct' }
                ]
            }
        ],

        sidebar: {
            '/docs/developer/': [
                {
                    text: '开发者文档',
                    items: [
                        { text: '概览', link: '/docs/developer/' },
                        { text: '快速开始', link: '/docs/developer/getting-started' }
                    ]
                },
                {
                    text: 'API 文档',
                    items: [
                        { text: '认证 API', link: '/docs/developer/api/authentication' },
                        { text: 'OAuth API', link: '/docs/developer/api/oauth' },
                        { text: '用户管理 API', link: '/docs/developer/api/users' }
                    ]
                },
                {
                    text: '集成指南',
                    collapsed: true,
                    items: [
                        { text: '最佳实践', link: '/docs/developer/guides/best-practices' },
                        { text: '故障排除', link: '/docs/developer/guides/troubleshooting' }
                    ]
                }
            ],
            '/docs/social-login/': [
                {
                    text: '社交登录配置',
                    items: [
                        { text: '概览', link: '/docs/social-login/' },
                        { text: '匿名登录', link: '/docs/social-login/anonymous-login-setup' }
                    ]
                },
                {
                    text: '内置提供商',
                    items: [
                        { text: 'GitHub', link: '/docs/social-login/github-login-setup' },
                        { text: 'Google', link: '/docs/social-login/google-login-setup' },
                        { text: 'Microsoft', link: '/docs/social-login/microsoft-login-setup' },
                        { text: 'Discord', link: '/docs/social-login/discord-login-setup' },
                        { text: 'Apple', link: '/docs/social-login/apple-login-setup' },
                        { text: 'Twitter', link: '/docs/social-login/twitter-login-setup' }
                    ]
                },
                {
                    text: '自定义提供商',
                    items: [
                        { text: '微博', link: '/docs/social-login/weibo-login-setup' },
                        { text: 'QQ', link: '/docs/social-login/qq-login-setup' },
                        { text: '微信', link: '/docs/social-login/wechat-login-setup' },
                        { text: '抖音', link: '/docs/social-login/douyin-login-setup' }
                    ]
                }
            ],
            '/docs/': [
                {
                    text: '项目文档',
                    items: [
                        { text: '项目规划', link: '/docs/PLAN' },
                        { text: '数据库关系', link: '/docs/database-relations' },
                        { text: 'Clarity 集成', link: '/docs/clarity-integration' },
                        { text: '管理员角色同步', link: '/docs/admin-role-sync' }
                    ]
                }
            ]
        },

        socialLinks: [
            { icon: 'github', link: 'https://github.com/CaoMeiYouRen/caomei-auth' }
        ],

        search: {
            provider: 'local'
        },

        editLink: {
            pattern: 'https://github.com/CaoMeiYouRen/caomei-auth/edit/master/:path',
            text: '在 GitHub 上编辑此页'
        },

        lastUpdatedText: '最后更新时间',

        docFooter: {
            prev: '上一页',
            next: '下一页'
        },

        outline: {
            label: '页面导航',
            level: [2, 3]
        },

        footer: {
            message: '基于 MIT 许可发布',
            copyright: 'Copyright © 2025 CaoMeiYouRen'
        }
    }
})
