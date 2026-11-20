import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({
    logFiles: true,
    logDir: 'logs',
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
}))

vi.mock('node:fs', () => ({
    default: {
        mkdirSync: state.mkdirSync,
        appendFileSync: state.appendFileSync,
    },
    mkdirSync: state.mkdirSync,
    appendFileSync: state.appendFileSync,
}))

vi.mock('@/utils/shared/env', async (importOriginal) => {
    const actual = await importOriginal<Record<string, unknown>>()
    return {
        ...actual,
        get LOGFILES() {
            return state.logFiles
        },
        get LOG_DIR() {
            return state.logDir
        },
    }
})

const { writeAuditRecord } = await import('@/server/utils/audit-logger')

describe('server/utils/audit-logger', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        state.logFiles = true
        state.logDir = 'logs'
    })

    it('appends one JSON line per event to the audit file', () => {
        writeAuditRecord({ action: 'twoFactor.enable', actorId: 'u1' })

        expect(state.mkdirSync).toHaveBeenCalled()
        const [file, line] = state.appendFileSync.mock.calls[0] as [string, string]
        expect(file).toMatch(/audit-\d{4}-\d{2}-\d{2}\.log$/u)
        expect(JSON.parse(line.trim())).toEqual({ action: 'twoFactor.enable', actorId: 'u1' })
        expect(line.endsWith('\n')).toBe(true)
    })

    it('writes to the console when file logging is disabled', () => {
        state.logFiles = false
        const info = vi.spyOn(console, 'info').mockImplementation(() => {})
        writeAuditRecord({ action: 'password.reset' })
        expect(info).toHaveBeenCalledWith(expect.stringContaining('password.reset'))
        expect(state.appendFileSync).not.toHaveBeenCalled()
        info.mockRestore()
    })

    it('never throws when the file cannot be written', () => {
        state.appendFileSync.mockImplementationOnce(() => {
            throw new Error('disk full')
        })
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(() => writeAuditRecord({ action: 'password.reset' })).not.toThrow()
        expect(warn).toHaveBeenCalled()
        warn.mockRestore()
    })
})
