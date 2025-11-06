import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'

const navigateToMock = vi.fn()
const useFetchMock = vi.fn()

declare const navigateTo: (path: string) => void

describe('utils/navigation', () => {
    const authClientUseSession = vi.fn()

    beforeEach(async () => {
        vi.resetModules()
        navigateToMock.mockReset()
        useFetchMock.mockReset()
        authClientUseSession.mockReset()
        vi.stubGlobal('navigateTo', navigateToMock)
        vi.stubGlobal('useFetch', useFetchMock)
        vi.mock('@/lib/auth-client', () => ({
            authClient: {
                useSession: authClientUseSession,
            },
        }))
    })

    afterEach(() => {
        vi.unstubAllGlobals()
        vi.clearAllMocks()
        vi.resetModules()
        vi.useRealTimers()
    })

    it('navigates admin users to admin dashboard', async () => {
        authClientUseSession.mockResolvedValue({
            data: ref({
                user: {
                    role: ['admin', 'user'],
                },
            }),
        })

        const { navigateAfterLogin } = await import('@/utils/navigation')

        await navigateAfterLogin()

        expect(authClientUseSession).toHaveBeenCalledWith(useFetch)
        expect(navigateToMock).toHaveBeenCalledWith('/admin/users')
    })

    it('falls back to profile for non-admin users', async () => {
        authClientUseSession.mockResolvedValue({
            data: ref({
                user: {
                    role: ['user'],
                },
            }),
        })

        const { navigateAfterLogin } = await import('@/utils/navigation')

        await navigateAfterLogin()

        expect(navigateToMock).toHaveBeenCalledWith('/profile')
    })

    it('redirects to profile when session fetch fails', async () => {
        const testError = new Error('network down')
        authClientUseSession.mockRejectedValue(testError)
        const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

        const { navigateAfterLogin } = await import('@/utils/navigation')

        await navigateAfterLogin()

        expect(warnSpy).toHaveBeenCalledWith('获取用户会话失败，使用默认跳转:', testError)
        expect(navigateToMock).toHaveBeenCalledWith('/profile')
        warnSpy.mockRestore()
    })

    it('supports delayed navigation', async () => {
        authClientUseSession.mockResolvedValue({
            data: ref({
                user: {
                    role: ['admin'],
                },
            }),
        })
        vi.useFakeTimers()
        const navigationModule = await import('@/utils/navigation')
        const navigateSpy = vi.spyOn(navigationModule, 'navigateAfterLogin')

        navigationModule.navigateAfterLoginWithDelay(500)

        expect(navigateSpy).not.toHaveBeenCalled()
        vi.advanceTimersByTime(500)
        await vi.runAllTimersAsync()

        expect(navigateSpy).toHaveBeenCalled()

        vi.useRealTimers()
    })
})
