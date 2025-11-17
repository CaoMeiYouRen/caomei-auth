import { describe, it, expect, beforeAll, beforeEach, afterEach, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
    validateEmailMock: vi.fn(),
    validatePhoneMock: vi.fn(),
    formatPhoneNumberMock: vi.fn(),
}))

vi.mock('@/utils/validate', () => ({
    validateEmail: mocks.validateEmailMock,
    validatePhone: mocks.validatePhoneMock,
}))

vi.mock('@/utils/phone', () => ({
    formatPhoneNumber: mocks.formatPhoneNumberMock,
}))

let smartInput: typeof import('@/utils/smart-input')

beforeAll(async () => {
    smartInput = await import('@/utils/smart-input')
})

beforeEach(() => {
    mocks.validateEmailMock.mockReset()
    mocks.validatePhoneMock.mockReset()
    mocks.formatPhoneNumberMock.mockReset()
    mocks.validateEmailMock.mockReturnValue(false)
    mocks.validatePhoneMock.mockReturnValue(false)
})

afterEach(() => {
    vi.restoreAllMocks()
})

describe('utils/smart-input (logic-focused)', () => {
    describe('detectPossibleRegions', () => {
        it('prioritises mainland numbers with high probability', () => {
            const regions = smartInput.detectPossibleRegions('138-1234-5678')
            expect(regions[0]).toMatchObject({ region: 'CN', countryCode: 86 })
            expect(regions[0]?.probability).toBeGreaterThan(0.9)
        })

        it('orders US region ahead of CA for NANP numbers', () => {
            const regions = smartInput.detectPossibleRegions('12025550123')
            const usIndex = regions.findIndex((item) => item.region === 'US')
            const caIndex = regions.findIndex((item) => item.region === 'CA')

            expect(usIndex).toBeGreaterThan(-1)
            expect(caIndex).toBeGreaterThan(-1)
            expect(usIndex).toBeLessThan(caIndex)
            expect(regions[usIndex]?.probability).toBeGreaterThan(regions[caIndex]?.probability ?? 0)
        })

        it('returns an empty array when no heuristic matches', () => {
            expect(smartInput.detectPossibleRegions('000')).toEqual([])
        })
    })

    describe('detectInputType', () => {
        it('returns unknown for blank input', () => {
            expect(smartInput.detectInputType('')).toBe('unknown')
        })

        it('identifies valid email inputs via validator', () => {
            mocks.validateEmailMock.mockReturnValue(true)
            expect(smartInput.detectInputType(' user@example.com ')).toBe('email')
            expect(mocks.validateEmailMock).toHaveBeenCalledWith('user@example.com')
        })

        it('identifies valid international phone numbers via validator', () => {
            mocks.validatePhoneMock.mockReturnValue(true)
            expect(smartInput.detectInputType('+12025550123')).toBe('phone')
            expect(mocks.validatePhoneMock).toHaveBeenCalledWith('+12025550123')
        })

        it('falls back to region heuristics for local numbers', () => {
            expect(smartInput.detectInputType('13812345678')).toBe('phone')
        })

        it('returns unknown when heuristics are inconclusive', () => {
            expect(smartInput.detectInputType('7777777')).toBe('unknown')
        })
    })

    describe('getInputSuggestion', () => {
        it('returns email suggestions when detectInputType resolves to email', () => {
            mocks.validateEmailMock.mockReturnValue(true)
            const result = smartInput.getInputSuggestion('user@example.com')

            expect(result).toMatchObject({ type: 'email', needConfirm: false })
            expect(result.suggestion).toContain('邮件')
        })

        it('returns an international phone suggestion for + prefixed numbers', () => {
            mocks.validatePhoneMock.mockReturnValue(true)
            const result = smartInput.getInputSuggestion('+12025550123')

            expect(result).toMatchObject({ type: 'phone', needConfirm: false, confidence: 0.95 })
        })

        it('asks for confirmation when digits map to a likely region', () => {
            const result = smartInput.getInputSuggestion('13812345678')

            expect(result.type).toBe('phone')
            expect(result.needConfirm).toBe(true)
            expect(result.suggestion).toContain('中国大陆')
            expect(result.confidence).toBeGreaterThan(0.6)
        })

        it('warns when digit count is insufficient', () => {
            const result = smartInput.getInputSuggestion('12345')

            expect(result.type).toBe('unknown')
            expect(result.suggestion).toContain('位数不足')
            expect(result.needConfirm).toBe(false)
        })

        it('flags malformed email-like inputs missing @ symbol', () => {
            const result = smartInput.getInputSuggestion('foo.example.com')

            expect(result.type).toBe('unknown')
            expect(result.suggestion).toContain('缺少@')
        })

        it('flags inputs containing multiple @ symbols', () => {
            const result = smartInput.getInputSuggestion('foo@@bar@@example.com')

            expect(result.type).toBe('unknown')
            expect(result.suggestion).toContain('邮箱格式不正确')
        })
    })

    describe('formatAccountForVerification', () => {
        it('normalises email addresses to lowercase', () => {
            mocks.validateEmailMock.mockReturnValue(true)
            expect(smartInput.formatAccountForVerification(' User@Example.COM ')).toBe('user@example.com')
        })

        it('formats local phone numbers when region is supplied', () => {
            mocks.formatPhoneNumberMock.mockReturnValue('+86 138-1234-5678')
            const result = smartInput.formatAccountForVerification('13812345678', 'CN')

            expect(result).toBe('+86 138-1234-5678')
            expect(mocks.formatPhoneNumberMock).toHaveBeenCalledWith('13812345678', 'CN')
        })

        it('uses the fallback default region when region parameter is missing', () => {
            const originalWindow = (globalThis as any).window
            const originalNavigator = (globalThis as any).navigator
            const originalLocalStorage = (globalThis as any).localStorage

            delete (globalThis as any).window
            delete (globalThis as any).navigator
            delete (globalThis as any).localStorage

            mocks.formatPhoneNumberMock.mockReturnValue('+86 901-234-5678')

            try {
                const result = smartInput.formatAccountForVerification('9012345678')

                expect(result).toBe('+86 901-234-5678')
                expect(mocks.formatPhoneNumberMock).toHaveBeenCalledWith('9012345678', 'CN')
            } finally {
                if (originalWindow) {
                    (globalThis as any).window = originalWindow
                } else {
                    delete (globalThis as any).window
                }

                if (originalNavigator) {
                    (globalThis as any).navigator = originalNavigator
                } else {
                    delete (globalThis as any).navigator
                }

                if (originalLocalStorage) {
                    (globalThis as any).localStorage = originalLocalStorage
                } else {
                    delete (globalThis as any).localStorage
                }
            }
        })

        it('throws descriptive error when explicit region formatting fails', () => {
            mocks.formatPhoneNumberMock.mockImplementation(() => {
                throw new Error('bad input')
            })

            expect(() => smartInput.formatAccountForVerification('13812345678', 'CN')).toThrow('手机号格式化失败')
        })

        it('throws descriptive error when default region formatting fails', () => {
            const defaultRegionSpy = vi.spyOn(smartInput, 'getDefaultRegionByLocation').mockReturnValue('CN')
            mocks.formatPhoneNumberMock.mockImplementation(() => {
                throw new Error('bad input')
            })

            expect(() => smartInput.formatAccountForVerification('13812345678')).toThrow('无法确定手机号格式')
            defaultRegionSpy.mockRestore()
        })

        it('throws when detectInputType cannot identify the account', () => {
            const spy = vi.spyOn(smartInput, 'detectInputType').mockReturnValue('unknown')

            expect(() => smartInput.formatAccountForVerification('some-handle')).toThrow('无法识别的账号格式')
            spy.mockRestore()
        })
    })

    describe('validateFormattedAccount', () => {
        it('delegates to validateEmail for values containing @', () => {
            mocks.validateEmailMock.mockReturnValue(true)
            expect(smartInput.validateFormattedAccount('user@example.com')).toBe(true)
            expect(mocks.validateEmailMock).toHaveBeenCalledWith('user@example.com')
        })

        it('delegates to validatePhone for E.164 numbers', () => {
            mocks.validatePhoneMock.mockReturnValue(true)
            expect(smartInput.validateFormattedAccount('+8613812345678')).toBe(true)
            expect(mocks.validatePhoneMock).toHaveBeenCalledWith('+8613812345678')
        })

        it('returns false for unsupported formats', () => {
            expect(smartInput.validateFormattedAccount('not-valid')).toBe(false)
        })
    })
})
