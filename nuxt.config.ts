// https://nuxt.com/docs/api/configuration/nuxt-config
import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'
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
        '@nuxt/eslint',
        'vue-recaptcha/nuxt',
    ],
    build: {
        // 使用 Babel 转译不兼容的包
        transpile: [
            'better-sqlite3',
            'ms',
            (ctx) => !ctx.isDev && 'google-libphonenumber',
            // PrimeVue/PrimeUIX 生态包的 exports 仅含 import/default 条件，
            // Nitro nft trace（过滤 import/default 条件）无法完整复制其文件，
            // 导致 .output/server/node_modules 缺文件、生产运行时 ERR_MODULE_NOT_FOUND
            // （如 @primeuix/styles/dist/base/index.mjs、@primevue/core/index.mjs）。
            // 同时需要在 nitro.externals.inline 中用正则覆盖（含传递依赖），
            // 字符串形式对 pnpm 虚拟 store 内的传递依赖（如 @primeuix/styled）无法匹配。
            '@primeuix/styles',
            '@primeuix/themes',
            '@primeuix/styled',
            '@primeuix/utils',
            '@primevue/core',
            '@primevue/forms',
            // sanitize-html 为 CJS 包，但依赖 ESM-only 的 htmlparser2@12，
            // 在不支持 require(esm) 的 Node 版本（< 20.19 / < 22.12）上抛 ERR_REQUIRE_ESM。
            // 内联后由 rollup 处理 CJS/ESM 互操作。
            'sanitize-html',
        ],
    },
    eslint: {
        config: {
            standalone: false,
        },
    },
    css: [
        'normalize.css/normalize.css',
        '@mdi/font/css/materialdesignicons.min.css',
        '@/assets/iconfont.css',
        '@/styles/_global.scss',
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
            usernameEnabled: process.env.NUXT_PUBLIC_USERNAME_ENABLED === 'true',
            sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
            clarityProjectId: process.env.NUXT_PUBLIC_CLARITY_PROJECT_ID,
            baiduAnalyticsId: process.env.NUXT_PUBLIC_BAIDU_ANALYTICS_ID,
            googleAnalyticsId: process.env.NUXT_PUBLIC_GOOGLE_ANALYTICS_ID,
            passwordStrengthLevel: process.env.NUXT_PUBLIC_PASSWORD_STRENGTH_LEVEL || 'strong',
            demoMode: process.env.NUXT_PUBLIC_DEMO_MODE === 'true',
            feedbackUrl: process.env.NUXT_PUBLIC_FEEDBACK_URL,
            // 验证码配置
            captchaProvider: process.env.NUXT_PUBLIC_CAPTCHA_PROVIDER,
            recaptchaSiteKey: process.env.NUXT_PUBLIC_RECAPTCHA_SITE_KEY,
            turnstileSiteKey: process.env.NUXT_PUBLIC_TURNSTILE_SITE_KEY,
            hcaptchaSiteKey: process.env.NUXT_PUBLIC_HCAPTCHA_SITE_KEY,
        },
    },
    primevue: {
        autoImport: true,
        // components: [],
        options: {
            theme: {
                preset: AppPreset,
                // 当应用使用 html 上的 .dark 类来控制暗色模式时，告诉 PrimeVue 使用该选择器以便自动应用暗色主题
                options: {
                    darkModeSelector: 'html.dark',
                },
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
                    // 自动在每个 .scss 文件中注入这些内容
                    additionalData: `
                    @import "@/styles/mixins.scss";
                    @import "@/styles/theme.scss";
                    @import "@/styles/common.scss";
                    @import "@/styles/form.scss";
                    @import "@/styles/dark-mode.scss";
                    `,
                },
            },
        },
        server: {
            // allowedHosts: process.env.NODE_ENV === 'development' ? true : undefined,
        },

        build: {
            // 调试模式下禁用压缩和混淆
            // minify: process.env.DEBUG_BUILD === 'true' ? false : 'esbuild',
            // 生成 source map
            // sourcemap: process.env.DEBUG_BUILD === 'true',
            // 保持函数名和变量名
            // target: process.env.DEBUG_BUILD === 'true' ? 'esnext' : 'modules',
            // rollupOptions: process.env.DEBUG_BUILD === 'true'
            //     ? {
            //         output: {
            //             // 禁用混淆
            //             minifyInternalExports: false,
            //             // 保持函数名
            //             compact: false,
            //         },
            //     }
            //     : undefined,
        },
    },
    devServer: {
        port: 3000,
        // host: '0.0.0.0',
    },
    nitro: {
        externals: {
            // Better Auth SSO 在容器运行时会依赖多层 peer dependency 解析；
            // 将整个 Better Auth 生态内联到 Nitro 服务端产物中，避免 .output/server/node_modules 缺文件导致启动失败。
            inline: [
                'better-auth',
                'better-auth-localization',
                '@better-auth/core',
                '@better-auth/utils',
                /^@better-auth\//,
                /^@better-fetch\//,
                'better-call',
                // PrimeVue/PrimeUIX 生态（含 @primevue/core、@primeuix/styled 等传递依赖）：
                // 其 package.json exports 仅含 import/default 条件，Nitro 的 nft trace
                // （条件集过滤 import/default）无法解析，导致 .output/server/node_modules
                // 缺文件、生产运行时 ERR_MODULE_NOT_FOUND。
                // 使用函数匹配以同时覆盖裸包名与 pnpm 虚拟 store 真实路径
                // （node_modules/.pnpm/@primeuix+styled@0.7.4/node_modules/...），
                // 避免字符串/正则前缀匹配在真实路径下失效。
                (id) => id.startsWith('@primeuix/') || id.includes('@primeuix+'),
                (id) => id.startsWith('@primevue/') || id.includes('@primevue+'),
                // sanitize-html 为 CJS 包但依赖 ESM-only 的 htmlparser2@12，
                // 在不支持 require(esm) 的 Node 版本（< 20.19 / < 22.12）上抛 ERR_REQUIRE_ESM。
                // 内联后由 rollup 处理 CJS/ESM 互操作；htmlparser2 链（ESM-only）一并内联。
                'sanitize-html',
                (id) => /^(htmlparser2|domelementtype|domhandler|domutils|dom-serializer|entities)(\/|$)/.test(id)
                    || /@(?:htmlparser2|domelementtype|domhandler|domutils|dom-serializer|entities)\+/.test(id),
            ],
        },
        // 将模板文件夹包含到构建输出中 - 使用正确的配置
        serverAssets: [
            {
                baseName: 'templates',
                dir: './server/templates', // 相对于项目根目录
            },
        ],
        esbuild: {
            options: {
                target: 'esnext',
                // 调试模式下禁用压缩
                // minify: process.env.DEBUG_BUILD !== 'true',
                // 生成 source map
                // sourcemap: process.env.DEBUG_BUILD === 'true',
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
                    esModuleInterop: true,
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
    recaptcha: {
        enterprise: false,
        installPlugin: false,
    },
})
