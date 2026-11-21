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


    it('parses explicit boolean flags and warns on invalid values', async () => {
        const envModule = await loadEnvModule()

        expect(envModule.parseBooleanFlag('true', false)).toBe(true)
        expect(envModule.parseBooleanFlag('1', false)).toBe(true)
        expect(envModule.parseBooleanFlag('yes', false)).toBe(true)
        expect(envModule.parseBooleanFlag('on', false)).toBe(true)
        expect(envModule.parseBooleanFlag('false', true)).toBe(false)
        expect(envModule.parseBooleanFlag('0', true)).toBe(false)
        expect(envModule.parseBooleanFlag('no', true)).toBe(false)
        expect(envModule.parseBooleanFlag('off', true)).toBe(false)
        expect(envModule.parseBooleanFlag(undefined, true)).toBe(true)
        expect(envModule.parseBooleanFlag('', false)).toBe(false)

        const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
        expect(envModule.parseBooleanFlag('definitely-not-a-flag', true)).toBe(true)
        expect(warn).toHaveBeenCalledWith(expect.stringContaining('无法解析'))
        warn.mockRestore()
    })

    it('reads 2FA coverage switches with per-channel explicit overrides', async () => {
        const defaults = await loadEnvModule({
            processEnv: {
                TWO_FACTOR_COVERAGE_EMAIL_OTP: undefined,
                TWO_FACTOR_COVERAGE_PHONE_OTP: undefined,
                TWO_FACTOR_COVERAGE_MAGIC_LINK: undefined,
                TWO_FACTOR_COVERAGE_EMAIL_VERIFICATION: undefined,
                TWO_FACTOR_COVERAGE_SOCIAL: undefined,
                TWO_FACTOR_COVERAGE_SSO: undefined,
            },
        })
        expect(defaults.TWO_FACTOR_COVERAGE).toEqual({
            emailOtp: true,
            phoneOtp: true,
            magicLink: true,
            emailVerification: true,
            social: true,
            sso: true,
        })

        const overridden = await loadEnvModule({
            processEnv: {
                TWO_FACTOR_COVERAGE_EMAIL_OTP: 'false',
                TWO_FACTOR_COVERAGE_SSO: '0',
                TWO_FACTOR_COVERAGE_PHONE_OTP: 'true',
            },
        })
        expect(overridden.TWO_FACTOR_COVERAGE.emailOtp).toBe(false)
        expect(overridden.TWO_FACTOR_COVERAGE.sso).toBe(false)
        expect(overridden.TWO_FACTOR_COVERAGE.phoneOtp).toBe(true)
        expect(overridden.TWO_FACTOR_COVERAGE.magicLink).toBe(true)
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
