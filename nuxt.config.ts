// https://nuxt.com/docs/api/configuration/nuxt-config
import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'

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
    ],
    css: [
        'normalize.css/normalize.css',
        '@mdi/font/css/materialdesignicons.min.css',
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
    primevue: {
        autoImport: true,
        // components: [],
        options: {
            theme: {
                preset: AppPreset,
            },
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

})
