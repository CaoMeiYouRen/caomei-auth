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
        errors: vi.fn(),
        splat: vi.fn(),
        ms: vi.fn(),
    }
    const mockLogger = {
        add: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        debug: vi.fn(),
        http: vi.fn(),
        verbose: vi.fn(),
        silly: vi.fn(),
    }
    return {
        default: {
            createLogger: () => mockLogger,
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

vi.mock('@/server/utils/privacy', () => ({
    createSafeLogData: (data: any) => data,
    maskEmail: (email: string) => email,
    maskPhone: (phone: string) => phone,
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
        expect(typeof logger.info).toBe('function')
        expect(typeof logger.error).toBe('function')
    })

    it('should have all log level methods', async () => {
        const loggerModule = await import('@/server/utils/logger')
        const logger = loggerModule.default

        expect(typeof logger.debug).toBe('function')
        expect(typeof logger.info).toBe('function')
        expect(typeof logger.warn).toBe('function')
        expect(typeof logger.error).toBe('function')
        expect(typeof logger.http).toBe('function')
        expect(typeof logger.verbose).toBe('function')
        expect(typeof logger.silly).toBe('function')
    })

    describe('Security Logging', () => {
        it('should have security logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.security).toBeDefined()
            expect(typeof logger.security.loginAttempt).toBe('function')
            expect(typeof logger.security.loginSuccess).toBe('function')
            expect(typeof logger.security.loginFailure).toBe('function')
            expect(typeof logger.security.passwordReset).toBe('function')
            expect(typeof logger.security.accountLocked).toBe('function')
            expect(typeof logger.security.permissionDenied).toBe('function')
        })

        it('should call security logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.security.loginAttempt({
                userId: 'user-1',
                email: 'test@example.com',
                ip: '127.0.0.1',
                success: true,
            })).not.toThrow()

            expect(() => logger.security.loginSuccess({
                userId: 'user-1',
                email: 'test@example.com',
                ip: '127.0.0.1',
                provider: 'email',
            })).not.toThrow()

            expect(() => logger.security.loginFailure({
                email: 'test@example.com',
                ip: '127.0.0.1',
                reason: 'User not found',
            })).not.toThrow()

            expect(() => logger.security.passwordReset({
                userId: 'user-1',
                email: 'test@example.com',
                ip: '127.0.0.1',
            })).not.toThrow()

            expect(() => logger.security.accountLocked({
                userId: 'user-1',
                email: 'test@example.com',
                reason: 'Too many failed attempts',
            })).not.toThrow()

            expect(() => logger.security.permissionDenied({
                userId: 'user-1',
                resource: 'admin-panel',
                action: 'delete-user',
            })).not.toThrow()
        })
    })

    describe('API Logging', () => {
        it('should have API logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.api).toBeDefined()
            expect(typeof logger.api.request).toBe('function')
            expect(typeof logger.api.response).toBe('function')
            expect(typeof logger.api.error).toBe('function')
        })

        it('should call API logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.api.request({
                method: 'GET',
                path: '/api/users',
                ip: '127.0.0.1',
                userId: 'user-1',
            })).not.toThrow()

            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/users',
                statusCode: 200,
                responseTime: 100,
            })).not.toThrow()

            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/users',
                statusCode: 400,
                responseTime: 50,
            })).not.toThrow()

            expect(() => logger.api.response({
                method: 'GET',
                path: '/api/users',
                statusCode: 500,
                responseTime: 1000,
            })).not.toThrow()

            expect(() => logger.api.error({
                method: 'POST',
                path: '/api/users',
                error: 'Database connection failed',
                stack: 'Error: ...',
            })).not.toThrow()
        })
    })

    describe('Database Logging', () => {
        it('should have database logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.database).toBeDefined()
            expect(typeof logger.database.query).toBe('function')
            expect(typeof logger.database.error).toBe('function')
            expect(typeof logger.database.migration).toBe('function')
        })

        it('should call database logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.database.error({
                error: 'Connection failed',
                query: 'SELECT * FROM users',
            })).not.toThrow()

            expect(() => logger.database.migration({
                name: 'add-users-table',
                direction: 'up',
                duration: 500,
            })).not.toThrow()
        })
    })

    describe('System Logging', () => {
        it('should have system logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.system).toBeDefined()
            expect(typeof logger.system.startup).toBe('function')
            expect(typeof logger.system.shutdown).toBe('function')
            expect(typeof logger.system.healthCheck).toBe('function')
        })

        it('should call system logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.system.startup({
                port: 3000,
                env: 'development',
                dbType: 'postgres',
            })).not.toThrow()

            expect(() => logger.system.shutdown({
                reason: 'SIGTERM',
                graceful: true,
            })).not.toThrow()

            expect(() => logger.system.healthCheck({
                status: 'healthy',
                checks: { database: true, redis: true },
            })).not.toThrow()

            expect(() => logger.system.healthCheck({
                status: 'unhealthy',
                checks: { database: false },
            })).not.toThrow()
        })
    })

    describe('Business Logging', () => {
        it('should have business logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.business).toBeDefined()
            expect(typeof logger.business.userRegistered).toBe('function')
            expect(typeof logger.business.userDeleted).toBe('function')
            expect(typeof logger.business.oauthAppCreated).toBe('function')
            expect(typeof logger.business.fileUploaded).toBe('function')
        })

        it('should call business logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.business.userRegistered({
                userId: 'user-1',
                email: 'test@example.com',
                provider: 'email',
            })).not.toThrow()

            expect(() => logger.business.userDeleted({
                userId: 'user-1',
                email: 'test@example.com',
                adminId: 'admin-1',
            })).not.toThrow()

            expect(() => logger.business.oauthAppCreated({
                appId: 'app-1',
                name: 'Test App',
                createdBy: 'user-1',
            })).not.toThrow()

            expect(() => logger.business.fileUploaded({
                fileName: 'test.pdf',
                size: 1024,
                userId: 'user-1',
                type: 'document',
            })).not.toThrow()
        })
    })

    describe('Email Logging', () => {
        it('should have email logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.email).toBeDefined()
            expect(typeof logger.email.sent).toBe('function')
            expect(typeof logger.email.failed).toBe('function')
            expect(typeof logger.email.rateLimited).toBe('function')
        })

        it('should call email logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.email.sent({
                type: 'verification',
                email: 'test@example.com',
            })).not.toThrow()

            expect(() => logger.email.failed({
                type: 'verification',
                email: 'test@example.com',
                error: 'SMTP connection failed',
            })).not.toThrow()

            expect(() => logger.email.rateLimited({
                email: 'test@example.com',
                limitType: 'user',
                remainingTime: 60,
            })).not.toThrow()
        })
    })

    describe('Phone Logging', () => {
        it('should have phone logging methods', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(logger.phone).toBeDefined()
            expect(typeof logger.phone.sent).toBe('function')
            expect(typeof logger.phone.failed).toBe('function')
            expect(typeof logger.phone.rateLimited).toBe('function')
        })

        it('should call phone logging methods without error', async () => {
            const loggerModule = await import('@/server/utils/logger')
            const logger = loggerModule.default

            expect(() => logger.phone.sent({
                type: 'verification',
                phone: '+8613800138000',
                channel: 'twilio',
                status: 'delivered',
            })).not.toThrow()

            expect(() => logger.phone.failed({
                type: 'verification',
                phone: '+8613800138000',
                error: 'Invalid number',
                channel: 'twilio',
            })).not.toThrow()

            expect(() => logger.phone.rateLimited({
                phone: '+8613800138000',
                limitType: 'global',
                remainingTime: 120,
            })).not.toThrow()
        })
    })
})
