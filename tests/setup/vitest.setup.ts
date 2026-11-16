import { afterEach, beforeAll, vi } from 'vitest'

/* 单测使用内存 SQLite：避免 synchronize 改动开发库，也避免并行用例共享文件库时的重建冲突 */
process.env.DATABASE_TYPE = process.env.DATABASE_TYPE || 'sqlite'
process.env.DATABASE_PATH = ':memory:'
import loggerMock, { resetLoggerMock } from '../mocks/logger'

// Provide the same mock instance for every import of the logger utility.
vi.mock('@/server/utils/logger', () => ({
    default: loggerMock,
}))

// Some server utilities rely on Nuxt auto-imported globals (e.g. `logger`).
// Expose the mocked logger on the global scope so those modules keep working.
;(globalThis as any).logger = loggerMock

// Mock Nuxt/H3 globals
;(globalThis as any).defineEventHandler = (handler: any) => handler
;(globalThis as any).createError = (err: any) => {
    const error = new Error(err.message || err.statusMessage)
    Object.assign(error, err)
    return error
}
;(globalThis as any).readBody = vi.fn()

// Ensure consistently mocked timers and cleared spy state between specs.
afterEach(() => {
    resetLoggerMock()
    vi.clearAllTimers()
    vi.clearAllMocks()
})

// Guarantee deterministic locale-sensitive behaviour across tests.
beforeAll(() => {
    process.env.TZ = process.env.TZ || 'UTC'
})
