import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { useChangePasswordFlow } from '../../../composables/use-change-password-flow'
import { authClient } from '../../../lib/auth-client'

// Mock dependencies
vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: vi.fn(),
    }),
}))

vi.mock('../../../lib/auth-client', () => ({
    authClient: {
        changePassword: vi.fn(),
    },
}))

// Mock useForm to execute callback immediately
vi.mock('../../../composables/core/use-form', () => ({
    useForm: ({ initialValues }: any) => {
        const values = ref({ ...initialValues })
        return {
            values,
            errors: ref({}),
            submitting: ref(false),
            handleSubmit: async (fn: (vals: any) => Promise<void>) => {
                await fn(values.value)
            },
            setField: (field: string, val: any) => {
                values.value[field] = val
            },
        }
    },
}))

describe('useChangePasswordFlow', () => {
    const originalLocation = window.location

    beforeEach(() => {
        vi.clearAllMocks()
        vi.useFakeTimers()

        // Mock window.location
        // Note: In JSDOM, window.location is not configurable by default, but we can try to modify href
        // Or use Object.defineProperty if needed.
        // For now, let's try to just spy on it if possible, or assume JSDOM allows setting href.
        // Actually, JSDOM throws if we try to navigate.
        // A better way is to mock the assignment.

        Object.defineProperty(window, 'location', {
            writable: true,
            value: { href: '' },
        })
    })

    afterEach(() => {
        vi.useRealTimers()
        Object.defineProperty(window, 'location', {
            writable: true,
            value: originalLocation,
        })
    })

    it('should initialize with empty values', () => {
        const { currentPassword, newPassword, confirmPassword } = useChangePasswordFlow()
        expect(currentPassword.value).toBe('')
        expect(newPassword.value).toBe('')
        expect(confirmPassword.value).toBe('')
    })

    it('should call authClient.changePassword on submit', async () => {
        const { changePassword, currentPassword, newPassword, confirmPassword, revokeOtherSessions } = useChangePasswordFlow()

        currentPassword.value = 'oldPass'
        newPassword.value = 'newPass'
        confirmPassword.value = 'newPass'
        revokeOtherSessions.value = true

        await changePassword()

        expect(authClient.changePassword).toHaveBeenCalledWith({
            currentPassword: 'oldPass',
            newPassword: 'newPass',
            revokeOtherSessions: true,
        })
    })

    it('should redirect on success', async () => {
        const { changePassword } = useChangePasswordFlow()

        vi.mocked(authClient.changePassword).mockResolvedValue({} as any)

        await changePassword()

        vi.advanceTimersByTime(1500)
        expect(window.location.href).toBe('/login')
    })

    it('should handle error', async () => {
        const { changePassword } = useChangePasswordFlow()

        vi.mocked(authClient.changePassword).mockRejectedValue(new Error('Change failed'))

        await changePassword()

        // Should not redirect
        vi.advanceTimersByTime(1500)
        expect(window.location.href).toBe('')
    })
})
