// https://nuxt.com/docs/api/configuration/nuxt-config
import Lara from '@primeuix/themes/lara'
import { definePreset } from '@primeuix/themes'
import { zh_CN } from 'primelocale/js/zh_CN.js'
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, LOCALE_REGISTRY } from './i18n/config/locale-registry'

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
        // caomei-ui 基座（迁移期与 PrimeVue 双库并存；页面组件未迁移，见 docs/design/governance/2026-11-05-caomei-ui-p0-baseline.md）
        'caomei-ui/nuxt',
        // i18n 技术验证（M5）：先接基础设施与语言切换原型，页面文案翻译在 M2+ 进行
        '@nuxtjs/i18n',
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
                'data-preset': 'caomei',
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
                // PrimeVue 只接受 class / system 形式的暗色选择器；写成 `html.dark` 会被渲染成
                // `html.dark :root`（后代选择器），暗色变量永远不生效。应用只切换 <html> 的 .dark 类，
                // 因此 `.dark` 与 `html.dark` 语义等价。
                options: {
                    darkModeSelector: '.dark',
                },
            },
            locale: zh_CN,
        },
    },
    caomeiUI: {
        // 与 PrimeVue 一致的暗色策略：由 VueUse useDark() 在 <html> 上切换 .dark
        darkMode: 'class',
        // 基础层由模块注入一次（组件自动导入不携带基础层）
        injectStyles: true,
    },
    i18n: {
        strategy: 'prefix_except_default',
        defaultLocale: DEFAULT_LOCALE,
        // hreflang / canonical 需要绝对地址
        baseUrl: process.env.NUXT_PUBLIC_AUTH_BASE_URL || 'http://localhost:3000',
        // locales 由 Locale Registry 生成，禁止手写第二份
        locales: LOCALE_REGISTRY.map((locale) => ({
            code: locale.code,
            name: locale.nativeName,
            language: locale.code,
            dir: locale.dir,
            files: locale.files,
        })),
        detectBrowserLanguage: {
            useCookie: true,
            cookieKey: LOCALE_COOKIE_KEY,
            redirectOn: 'root',
            alwaysRedirect: false,
        },
        experimental: {
            localeDetector: './localeDetector.ts',
        },
    },
    experimental: {
        componentIslands: true,
    },
    vite: {
        ssr: {
            // better-auth 1.7 的 context 初始化会静态/动态导入 @better-auth/kysely-adapter、@better-fetch/fetch
            // 等传递依赖；dev 下 Vite 默认将其外部化，Node 会从项目根解析而失败（Cannot find package）。
            // 这里与 nitro.externals.inline 保持一致，把 Better Auth 生态内联后由打包器解析。
            noExternal: [
                'better-auth',
                'better-auth-localization',
                /^@better-auth\//,
                /^@better-fetch\//,
                'better-call',
            ],
        },
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
