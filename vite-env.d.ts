/* eslint-disable spaced-comment */
/// <reference types="vite/client" />

interface ViteTypeOptions {

    // strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
    readonly NUXT_PUBLIC_AUTH_BASE_URL: string
    readonly NUXT_PUBLIC_MAX_UPLOAD_SIZE: string
    readonly NUXT_PUBLIC_ICP_BEIAN_NUMBER: string
    readonly NUXT_PUBLIC_PUBLIC_SECURITY_BEIAN_NUMBER: string
    readonly NUXT_PUBLIC_PHONE_ENABLED: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
