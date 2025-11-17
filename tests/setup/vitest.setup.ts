import { afterEach, beforeAll, vi } from 'vitest'
import loggerMock, { resetLoggerMock } from '../mocks/logger'

// Provide the same mock instance for every import of the logger utility.
vi.mock('@/server/utils/logger', () => ({
    default: loggerMock,
}))

// Some server utilities rely on Nuxt auto-imported globals (e.g. `logger`).
// Expose the mocked logger on the global scope so those modules keep working.
;(globalThis as any).logger = loggerMock

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
