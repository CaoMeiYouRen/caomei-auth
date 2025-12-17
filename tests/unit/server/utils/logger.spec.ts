import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Unmock the module we are testing because it is globally mocked in setup
vi.unmock('@/server/utils/logger')

// Hoist spies so they can be used in mock factories
const { createLoggerSpy, winstonTransportSpy } = vi.hoisted(() => ({
    createLoggerSpy: vi.fn().mockReturnValue({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        http: vi.fn(),
        verbose: vi.fn(),
        silly: vi.fn(),
    }),
    winstonTransportSpy: vi.fn(),
}))

// Mock dependencies
vi.mock('fs', async (importOriginal) => {
    const actual = await importOriginal<typeof import('fs')>()
    return {
        ...actual,
        default: {
            ...actual,
            existsSync: vi.fn(),
            mkdirSync: vi.fn(),
            writeFileSync: vi.fn(),
            unlinkSync: vi.fn(),
        },
        existsSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        unlinkSync: vi.fn(),
    }
})

vi.mock('winston', async (importOriginal) => {
    const actual = await importOriginal<any>()
    const formatMock = {
        combine: vi.fn().mockReturnValue('combined-format'),
        timestamp: vi.fn(),
        errors: vi.fn(),
        splat: vi.fn(),
        ms: vi.fn(),
        nestLike: vi.fn(), // nest-winston might use this
    }
    return {
        ...actual,
        default: {
            ...actual.default,
            createLogger: createLoggerSpy,
            transports: {
                Console: vi.fn(),
                File: vi.fn(),
            },
            format: formatMock,
        },
        createLogger: createLoggerSpy,
        transports: {
            Console: vi.fn(),
            File: vi.fn(),
        },
        format: formatMock,
    }
})

vi.mock('winston-daily-rotate-file', () => ({
    default: vi.fn(),
}))

vi.mock('@axiomhq/winston', () => ({
    WinstonTransport: winstonTransportSpy,
}))

vi.mock('@/utils/shared/env', () => ({
    LOG_LEVEL: 'info',
    LOGFILES: true,
    AXIOM_DATASET_NAME: '',
    AXIOM_API_TOKEN: '',
    LOG_DIR: 'logs',
}))

describe('Server Utils: Logger', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
        // Reset process.env
        process.env.NODE_ENV = 'development'
        delete process.env.VERCEL
        delete process.env.AWS_LAMBDA_FUNCTION_NAME
    })

    it('should create logger with file transports when file writing is enabled', async () => {
        // Mock fs to succeed
        const fs = await import('fs')
        vi.mocked(fs.default.existsSync).mockReturnValue(true)
        vi.mocked(fs.default.writeFileSync).mockImplementation(() => {})
        vi.mocked(fs.default.unlinkSync).mockImplementation(() => {})

        const DailyRotateFile = (await import('winston-daily-rotate-file')).default

        // Import logger
        await import('@/server/utils/logger')

        expect(createLoggerSpy).toHaveBeenCalled()
        // Check if DailyRotateFile was instantiated
        expect(DailyRotateFile).toHaveBeenCalled()
    })

    it('should disable file logging if file write check fails', async () => {
        // Mock fs to fail
        const fs = await import('fs')
        vi.mocked(fs.default.existsSync).mockReturnValue(true)
        vi.mocked(fs.default.writeFileSync).mockImplementation(() => {
            throw new Error('Permission denied')
        })

        const DailyRotateFile = (await import('winston-daily-rotate-file')).default

        // Import logger
        await import('@/server/utils/logger')

        // Should not have added file transports
        expect(DailyRotateFile).not.toHaveBeenCalled()
    })

    it('should disable file logging in serverless environment', async () => {
        process.env.VERCEL = '1'

        const fs = await import('fs')
        const DailyRotateFile = (await import('winston-daily-rotate-file')).default

        // Import logger
        await import('@/server/utils/logger')

        // Should not check file system
        expect(fs.default.writeFileSync).not.toHaveBeenCalled()
        // Should not add file transports
        expect(DailyRotateFile).not.toHaveBeenCalled()
    })

    it('should add Axiom transport if configured', async () => {
        vi.doMock('@/utils/shared/env', () => ({
            LOG_LEVEL: 'info',
            LOGFILES: false,
            AXIOM_DATASET_NAME: 'test-dataset',
            AXIOM_API_TOKEN: 'test-token',
            LOG_DIR: 'logs',
        }))

        await import('@/server/utils/logger')

        expect(winstonTransportSpy).toHaveBeenCalledWith(expect.objectContaining({
            dataset: 'test-dataset',
            token: 'test-token',
        }))
    })

    it('should mask sensitive data in security logs', async () => {
        process.env.NODE_ENV = 'production'
        // Ensure fs mocks don't crash
        const fs = await import('fs')
        vi.mocked(fs.default.existsSync).mockReturnValue(true)
        vi.mocked(fs.default.writeFileSync).mockImplementation(() => {})
        vi.mocked(fs.default.unlinkSync).mockImplementation(() => {})

        const loggerModule = await import('@/server/utils/logger')
        const logger = loggerModule.default
        const mockWinstonLogger = createLoggerSpy.mock.results[0]!.value

        const email = 'test@example.com'

        logger.security.loginSuccess({
            userId: '123',
            email,
            ip: '127.0.0.1',
        })

        expect(mockWinstonLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('[Security]'),
            expect.objectContaining({
                email: expect.stringMatching(/\*+/), // Check for masking
            }),
        )
    })

    it('should mask phone numbers in phone logs', async () => {
        process.env.NODE_ENV = 'production'
        // Ensure fs mocks don't crash
        const fs = await import('fs')
        vi.mocked(fs.default.existsSync).mockReturnValue(true)
        vi.mocked(fs.default.writeFileSync).mockImplementation(() => {})
        vi.mocked(fs.default.unlinkSync).mockImplementation(() => {})

        const loggerModule = await import('@/server/utils/logger')
        const logger = loggerModule.default
        const mockWinstonLogger = createLoggerSpy.mock.results[0]!.value

        const phone = '13800138000'

        logger.phone.sent({
            type: 'sms',
            phone,
            success: true,
        })

        expect(mockWinstonLogger.info).toHaveBeenCalledWith(
            expect.stringContaining('[Phone]'),
            expect.anything(),
        )
        // Check that the message contains the masked phone number
        const callArgs = mockWinstonLogger.info.mock.calls[0]
        const message = callArgs[0]
        expect(message).toMatch(/\*+/) // Check for masking in message
    })
})
