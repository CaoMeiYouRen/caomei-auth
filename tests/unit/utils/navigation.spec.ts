import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'

const { useSessionMock } = vi.hoisted(() => ({
    useSessionMock: vi.fn(),
}))

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        useSession: useSessionMock,
    },
}))

const navigateToMock = vi.fn()
const useFetchMock = vi.fn()
let consoleWarnSpy: ReturnType<typeof vi.spyOn>
let navigation: typeof import('@/utils/navigation')

beforeAll(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

beforeAll(async () => {
    navigation = await import('@/utils/navigation')
})

afterAll(() => {
    vi.unstubAllGlobals()
    consoleWarnSpy.mockRestore()
})

beforeEach(() => {
    useSessionMock.mockReset()
    navigateToMock.mockReset()
    useFetchMock.mockReset()
    consoleWarnSpy.mockClear()

    navigation.setNavigationDependencies({
        navigate: navigateToMock,
        useFetch: useFetchMock,
    })
})

afterEach(() => {
    navigation.resetNavigationDependencies()
    vi.useRealTimers()
})

describe('utils/navigation', () => {
    describe('navigateAfterLogin', () => {
        it('redirects administrators to the admin users page', async () => {
            useSessionMock.mockResolvedValueOnce({
                data: {
                    value: {
                        user: {
                            role: 'user,admin',
                        },
                    },
                },
            })

            await navigation!.navigateAfterLogin()

            expect(useSessionMock).toHaveBeenCalled()
            expect(navigateToMock).toHaveBeenCalledTimes(1)
            expect(navigateToMock).toHaveBeenCalledWith('/admin/users')
        })

        it('falls back to profile for non-admin users', async () => {
            useSessionMock.mockResolvedValueOnce({
                data: {
                    value: {
                        user: {
                            role: 'user',
                        },
                    },
                },
            })

            await navigation!.navigateAfterLogin()

            expect(useSessionMock).toHaveBeenCalled()
            expect(navigateToMock).toHaveBeenCalledTimes(1)
            expect(navigateToMock).toHaveBeenCalledWith('/profile')
        })

        it('logs a warning and defaults to profile when session lookup fails', async () => {
            const error = new Error('network down')
            useSessionMock.mockRejectedValueOnce(error)

            await navigation!.navigateAfterLogin()

            expect(useSessionMock).toHaveBeenCalled()
            expect(navigateToMock).toHaveBeenCalledWith('/profile')
            expect(consoleWarnSpy).toHaveBeenCalledWith('获取用户会话失败，使用默认跳转:', error)
        })
    })

    describe('navigateAfterLoginWithDelay', () => {
        it('invokes navigateAfterLogin after the specified delay', async () => {
            vi.useFakeTimers()
            useSessionMock.mockResolvedValueOnce({
                data: {
                    value: {
                        user: {
                            role: 'user',
                        },
                    },
                },
            })

            navigation!.navigateAfterLoginWithDelay(500)

            expect(navigateToMock).not.toHaveBeenCalled()
            await vi.advanceTimersByTimeAsync(500)
            expect(navigateToMock).toHaveBeenCalledTimes(1)
        })
    })
})
