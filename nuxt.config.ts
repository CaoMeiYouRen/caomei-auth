// https://nuxt.com/docs/api/configuration/nuxt-config
import Lara from '@primeuix/themes/lara'

export default defineNuxtConfig({
    compatibilityDate: '2025-06-30',
    devtools: { enabled: false },
    modules: [
        '@primevue/nuxt-module',
    ],
    css: ['@mdi/font/css/materialdesignicons.min.css'],
    primevue: {
        autoImport: true,
        // components: [],
        options: {
            theme: {
                preset: Lara,
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
