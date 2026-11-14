// https://nuxt.com/docs/api/configuration/nuxt-config
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, LOCALE_REGISTRY } from './i18n/config/locale-registry'

export default defineNuxtConfig({
    compatibilityDate: '2025-06-30',
    devtools: { enabled: false },
    modules: [
        // caomei-ui 基座（PrimeVue 已在阶段 4 P5 下线；见 docs/design/governance/2026-11-14-p4-closure.md）
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
    caomeiUI: {
        // 暗色策略：由 VueUse useDark() 在 <html> 上切换 .dark
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
