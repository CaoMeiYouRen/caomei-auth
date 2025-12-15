import fs from 'fs'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>()
    return {
        ...actual,
        default: {
            ...actual,
            existsSync: vi.fn(() => true),
            mkdirSync: vi.fn(),
            writeFileSync: vi.fn(),
            unlinkSync: vi.fn(),
        },
        existsSync: vi.fn(() => true),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        unlinkSync: vi.fn(),
    }
})

vi.mock('winston', () => {
    const format = {
        combine: vi.fn(),
        timestamp: vi.fn(),
        json: vi.fn(),
        printf: vi.fn(),
        colorize: vi.fn(),
        simple: vi.fn(),
    }
    return {
        default: {
            createLogger: vi.fn(() => ({
                add: vi.fn(),
                info: vi.fn(),
                warn: vi.fn(),
                error: vi.fn(),
            })),
            format,
            transports: {
                Console: vi.fn(),
            },
        },
        format,
    }
})

vi.mock('winston-daily-rotate-file', () => ({
    default: vi.fn(),
}))

vi.mock('@axiomhq/winston', () => ({
    WinstonTransport: vi.fn(),
}))

vi.mock('@/utils/shared/env', () => ({
    LOG_LEVEL: 'info',
    LOGFILES: true,
    AXIOM_DATASET_NAME: '',
    AXIOM_API_TOKEN: '',
    LOG_DIR: 'logs',
}))

describe('server/utils/logger', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    it('should export logger instance', async () => {
        const loggerModule = await import('@/server/utils/logger')
        const logger = loggerModule.default
        expect(logger).toBeDefined()
        expect(logger.info).toBeDefined()
        expect(logger.error).toBeDefined()
    })
})
