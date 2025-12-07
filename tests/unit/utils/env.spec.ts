import { describe, it, expect, afterEach, vi } from 'vitest'

const ORIGINAL_PROCESS_ENV = { ...process.env }
const DEFAULT_APP_NAME = (import.meta.env.NUXT_PUBLIC_APP_NAME as string | undefined) || '草梅Auth'
const DEFAULT_PHONE_ENABLED = import.meta.env.NUXT_PUBLIC_PHONE_ENABLED === 'true'

function restoreProcessEnv() {
    Object.keys(process.env).forEach((key) => {
        delete process.env[key]
    })
    Object.assign(process.env, ORIGINAL_PROCESS_ENV)
}

async function loadEnvModule(options: {
    processEnv?: Record<string, string | undefined>
} = {}) {
    restoreProcessEnv()

    vi.resetModules()

    if (options.processEnv) {
        Object.entries(options.processEnv).forEach(([key, value]) => {
            if (typeof value === 'undefined') {
                delete process.env[key]
            } else {
                process.env[key] = value
            }
        })
    }
    return import('@/utils/shared/env')
}

afterEach(() => {
    restoreProcessEnv()
})

describe('utils/env derived values', () => {
    it('prefers process environment variables for public auth base url', async () => {
        const envModule = await loadEnvModule({
            processEnv: {
                NUXT_PUBLIC_AUTH_BASE_URL: 'https://proc.example',
            },
        })

        expect(envModule.AUTH_BASE_URL).toBe('https://proc.example')
    })

    it('falls back to import.meta.env for public-only settings', async () => {
        const envModule = await loadEnvModule({
            processEnv: {
                NUXT_PUBLIC_APP_NAME: undefined,
            },
        })

        expect(envModule.APP_NAME).toBe(DEFAULT_APP_NAME)
    })

    it('enables demo mode overrides for database configuration', async () => {
        const envModule = await loadEnvModule({
            processEnv: {
                DEMO_MODE: 'true',
                DATABASE_TYPE: 'postgres',
                DATABASE_PATH: 'db/prod.sqlite',
            },
        })

        expect(envModule.DEMO_MODE).toBe(true)
        expect(envModule.DATABASE_TYPE).toBe('sqlite')
        expect(envModule.DATABASE_PATH).toBe(':memory:')
    })

    it('derives phone feature flag from layered environment values', async () => {
        const processOverride = await loadEnvModule({
            processEnv: {
                NUXT_PUBLIC_PHONE_ENABLED: 'true',
            },
        })
        expect(processOverride.PHONE_ENABLED).toBe(true)

        const fallbackEnv = await loadEnvModule({
            processEnv: {
                NUXT_PUBLIC_PHONE_ENABLED: undefined,
            },
        })
        expect(fallbackEnv.PHONE_ENABLED).toBe(DEFAULT_PHONE_ENABLED)
    })

    it('falls back to NODE_ENV defaults for log level when explicit value missing', async () => {
        const devEnv = await loadEnvModule({
            processEnv: {
                NODE_ENV: 'development',
                LOG_LEVEL: undefined,
            },
        })
        expect(devEnv.LOG_LEVEL).toBe('silly')

        const prodEnv = await loadEnvModule({
            processEnv: {
                NODE_ENV: 'production',
                LOG_LEVEL: undefined,
            },
        })
        expect(prodEnv.LOG_LEVEL).toBe('http')
    })
})
