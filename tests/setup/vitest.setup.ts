import { afterEach, beforeAll, vi } from 'vitest'
import loggerMock, { resetLoggerMock } from '../mocks/logger'

// Provide the same mock instance for every import of the logger utility.
vi.mock('@/server/utils/logger', () => ({
    default: loggerMock,
}))

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
