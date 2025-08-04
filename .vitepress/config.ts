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
            { text: '部署指南', link: '/docs/deployment/' },
            { text: '使用文档', link: '/docs/usage/' },
            { text: '登录配置', link: '/docs/login-config/' },
            { text: '开发文档', link: '/docs/development/' },
            { text: 'API 文档', link: '/docs/api/' },
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
            '/docs/deployment/': [
                {
                    text: '部署指南',
                    items: [
                        { text: '部署概览', link: '/docs/deployment/' },
                        { text: '数据库配置', link: '/docs/deployment/database.md' },
                        { text: 'Node.js 部署', link: '/docs/deployment/nodejs' },
                        { text: 'Docker 部署', link: '/docs/deployment/docker' },
                        { text: 'Vercel 部署', link: '/docs/deployment/vercel' },
                        { text: 'Cloudflare Workers 部署', link: '/docs/deployment/cloudflare' }
                    ]
                }
            ],
            '/docs/usage/': [
                {
                    text: '使用文档',
                    items: [
                        { text: '使用概览', link: '/docs/usage/' },
                        { text: '快速开始', link: '/docs/usage/getting-started' },
                        { text: '用户管理', link: '/docs/usage/user-management' },
                        { text: '应用集成', link: '/docs/usage/app-integration' },
                        { text: '常见问题', link: '/docs/usage/faq' },
                        { text: '故障排除', link: '/docs/usage/troubleshooting' }
                    ]
                }
            ],
            '/docs/login-config/': [
                {
                    text: '登录配置',
                    items: [
                        { text: '配置概览', link: '/docs/login-config/' },
                        { text: '邮箱登录配置', link: '/docs/login-config/email-login' },
                        { text: '短信登录配置', link: '/docs/login-config/sms-login' },
                        { text: '匿名登录配置', link: '/docs/login-config/anonymous-login' }
                    ]
                },
                {
                    text: '社交登录配置',
                    items: [
                        { text: 'GitHub', link: '/docs/login-config/social/github' },
                        { text: 'Google', link: '/docs/login-config/social/google' },
                        { text: 'Microsoft', link: '/docs/login-config/social/microsoft' },
                        { text: 'Apple', link: '/docs/login-config/social/apple' },
                        { text: 'Twitter', link: '/docs/login-config/social/twitter' },
                        { text: 'Discord', link: '/docs/login-config/social/discord' },
                    ]
                },
                {
                    text: '自定义提供商',
                    items: [
                        { text: '微信', link: '/docs/login-config/social/wechat' },
                        { text: 'QQ', link: '/docs/login-config/social/qq' },
                        { text: '抖音', link: '/docs/login-config/social/douyin' },
                        { text: '微博', link: '/docs/login-config/social/weibo' },
                    ]
                }
            ],
            '/docs/development/': [
                {
                    text: '开发文档',
                    items: [
                        { text: '开发概览', link: '/docs/development/' },
                        { text: '项目架构', link: '/docs/development/architecture' },
                        { text: '数据库关系', link: '/docs/development/database-relations' },
                        { text: '管理员角色', link: '/docs/development/admin-role-sync' },
                        { text: '用户管理', link: '/docs/development/user-management-sorting' },
                        { text: '最佳实践', link: '/docs/development/best-practices' },
                        { text: '无障碍适配', link: '/docs/development/accessibility' }
                    ]
                },
                {
                    text: '第三方集成',
                    items: [
                        { text: '集成概览', link: '/docs/development/integrations/' },
                        { text: 'Microsoft Clarity', link: '/docs/development/integrations/clarity' },
                        { text: 'Sentry', link: '/docs/development/integrations/sentry' }
                    ]
                }
            ],
            '/docs/api/': [
                {
                    text: 'API 文档',
                    items: [
                        { text: 'API 概览', link: '/docs/api/' },
                        { text: '认证 API', link: '/docs/api/authentication' },
                        { text: 'OAuth API', link: '/docs/api/oauth' },
                        { text: '用户管理 API', link: '/docs/api/users' },
                        { text: '管理员 API', link: '/docs/api/admin' },
                        { text: '文件上传 API', link: '/docs/api/file' }
                    ]
                }
            ],
            '/docs/': [
                {
                    text: '项目文档',
                    items: [
                        { text: '项目规划', link: '/docs/PLAN' }
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
