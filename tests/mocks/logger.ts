import { vi } from 'vitest'

const trackedFns: Array<ReturnType<typeof vi.fn>> = []

const createFn = () => {
    const fn = vi.fn()
    trackedFns.push(fn)
    return fn
}

const createLevelledLogger = () => ({
    debug: createFn(),
    info: createFn(),
    warn: createFn(),
    error: createFn(),
    http: createFn(),
    verbose: createFn(),
    silly: createFn(),
})

const loggerMock = {
    ...createLevelledLogger(),
    security: {
        loginAttempt: createFn(),
        loginSuccess: createFn(),
        loginFailure: createFn(),
        passwordReset: createFn(),
        accountLocked: createFn(),
        permissionDenied: createFn(),
    },
    api: {
        request: createFn(),
        response: createFn(),
        error: createFn(),
    },
    database: {
        query: createFn(),
        error: createFn(),
        migration: createFn(),
    },
    system: {
        startup: createFn(),
        shutdown: createFn(),
        healthCheck: createFn(),
    },
    business: {
        userRegistered: createFn(),
        userDeleted: createFn(),
        oauthAppCreated: createFn(),
        oauthAppCreateFailed: createFn(),
        oauthAppUpdated: createFn(),
        oauthAppDeleted: createFn(),
        oauthAppListFailed: createFn(),
        fileUploaded: createFn(),
        ssoProviderCreated: createFn(),
        ssoProviderUpdated: createFn(),
        ssoProviderDeleted: createFn(),
        sessionLogQueryFailed: createFn(),
    },
    email: {
        sent: createFn(),
        failed: createFn(),
        templateRendered: createFn(),
        templateError: createFn(),
        rateLimited: createFn(),
    },
    phone: {
        sent: createFn(),
        failed: createFn(),
        rateLimited: createFn(),
    },
} as const

export type LoggerMock = typeof loggerMock

export const resetLoggerMock = () => {
    for (const fn of trackedFns) {
        fn.mockReset()
    }
}

export default loggerMock
