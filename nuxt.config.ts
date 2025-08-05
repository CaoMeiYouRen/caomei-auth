// https://nuxt.com/docs/api/configuration/nuxt-config
import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'
import { en } from 'primelocale/js/en.js'
import { zh_CN } from 'primelocale/js/zh_CN.js'

const AppPreset = definePreset(Lara, {
    semantic: {
        primary: {
            '50': '#ffe5e9',
            '100': '#ffccd3',
            '200': '#ffb3bd',
            '300': '#ff8a9e',
            '400': '#ff6b6b', // 主色浅
            '500': '#e63946', // 主色
            '600': '#d12f3a',
            '700': '#a52834', // 主色深
            '800': '#7c1d28',
            '900': '#5a151d',
            '950': '#3a0c12',
        },
        colorScheme: {
            light: {
                surface: {
                    '0': '#ffffff',
                    '50': '#f8fafc', // 背景色
                    '100': '#f1f5f9',
                    '200': '#e2e8f0', // 辅助色
                    '300': '#cbd5e1',
                    '400': '#94a3b8',
                    '500': '#718096', // 辅助色
                    '600': '#64748b',
                    '700': '#475569',
                    '800': '#2d3748', // 辅助色
                    '900': '#1e293b',
                    '950': '#0f172a',
                },
            },
        },
    },
})

export default defineNuxtConfig({
    compatibilityDate: '2025-06-30',
    devtools: { enabled: false },
    modules: [
        '@primevue/nuxt-module',
        '@sentry/nuxt/module',
    ],
    build: {
        // 使用 Babel 转译不兼容的包
        transpile: ['sqlite3', (ctx) => !ctx.isDev && 'google-libphonenumber', 'winston', 'winston-daily-rotate-file'],
    },
    css: [
        'normalize.css/normalize.css',
        '@mdi/font/css/materialdesignicons.min.css',
        '@/styles/_theme.scss',
        '@/assets/iconfont.css',
    ],
    app: {
        head: {
            title: '草梅 Auth 统一登录平台',
            htmlAttrs: {
                lang: 'zh-CN',
            },
            link: [
                { rel: 'icon', type: 'image/png', href: '/favicon.png' },
            ],
        },
    },
    runtimeConfig: {
        public: {
            NODE_ENV: process.env.NODE_ENV,
            appName: process.env.NUXT_PUBLIC_APP_NAME,
            authBaseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL,
            contactEmail: process.env.NUXT_PUBLIC_CONTACT_EMAIL,
            maxUploadSize: process.env.NUXT_PUBLIC_MAX_UPLOAD_SIZE,
            icpBeianNumber: process.env.NUXT_PUBLIC_ICP_BEIAN_NUMBER,
            publicSecurityBeianNumber: process.env.NUXT_PUBLIC_PUBLIC_SECURITY_BEIAN_NUMBER,
            phoneEnabled: process.env.NUXT_PUBLIC_PHONE_ENABLED || (process.env.PHONE_CHANNEL ? 'true' : ''),
            sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
            clarityProjectId: process.env.NUXT_PUBLIC_CLARITY_PROJECT_ID,
        },
    },
    primevue: {
        autoImport: true,
        // components: [],
        options: {
            theme: {
                preset: AppPreset,
            },
            locale: zh_CN,
        },
    },
    experimental: {
        componentIslands: true,
    },
    vite: {
        vue: {
            template: {
            },
        },
        resolve: {
            alias: {
            },
        },
        optimizeDeps: {
            exclude: [],
        },
        css: {
            preprocessorOptions: {
                scss: {
                    silenceDeprecations: ['import', 'legacy-js-api'], // 忽略警告
                },
            },
        },
        server: {
            // allowedHosts: process.env.NODE_ENV === 'development' ? true : undefined,
        },
    },
    devServer: {
        port: 3000,
    },
    nitro: {
        esbuild: {
            options: {
                target: 'esnext',
                tsconfigRaw: {
                    compilerOptions: {
                        experimentalDecorators: true,
                    },
                },
            },
        },
        typescript: {
            tsConfig: {
                compilerOptions: {
                    emitDecoratorMetadata: true,
                    experimentalDecorators: true,
                    strictPropertyInitialization: false,
                },
            },
        },
        vercel: {
            functions: {
                maxDuration: 60, // 最长持续 60 秒
                memory: 1024, // 最大 1 GB 内存
            },
        },
    },
    sentry: {
        autoInjectServerSentry: 'top-level-import',
    },
})
