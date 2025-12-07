/// <reference types="vite/client" />

// interface ViteTypeOptions {

//     // strictImportMetaEnv: unknown
// }

interface ImportMetaEnv {
    readonly NUXT_PUBLIC_AUTH_BASE_URL: string
    readonly NUXT_PUBLIC_MAX_UPLOAD_SIZE: string
    readonly NUXT_PUBLIC_ICP_BEIAN_NUMBER: string
    readonly NUXT_PUBLIC_PUBLIC_SECURITY_BEIAN_NUMBER: string
    readonly NUXT_PUBLIC_PHONE_ENABLED: string
    readonly NUXT_PUBLIC_SENTRY_DSN: string
    readonly NUXT_PUBLIC_CLARITY_PROJECT_ID: string
    readonly NUXT_PUBLIC_CONTACT_EMAIL: string
    readonly NUXT_PUBLIC_APP_NAME: string
    readonly NUXT_PUBLIC_PASSWORD_STRENGTH_LEVEL: string
    readonly NUXT_PUBLIC_DEMO_MODE: string
    readonly NUXT_PUBLIC_USERNAME_ENABLED: string
    readonly NUXT_PUBLIC_CAPTCHA_PROVIDER: string
    readonly NUXT_PUBLIC_RECAPTCHA_SITE_KEY: string
    readonly NUXT_PUBLIC_TURNSTILE_SITE_KEY: string
    readonly NUXT_PUBLIC_HCAPTCHA_SITE_KEY: string
    readonly NUXT_PUBLIC_BAIDU_ANALYTICS_ID: string
    readonly NUXT_PUBLIC_GOOGLE_ANALYTICS_ID: string
    readonly NUXT_PUBLIC_FEEDBACK_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
