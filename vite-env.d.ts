/* eslint-disable spaced-comment */
/// <reference types="vite/client" />

interface ViteTypeOptions {

    // strictImportMetaEnv: unknown
  }

  interface ImportMetaEnv {
    readonly VITE_AUTH_BASE_URL: string
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
