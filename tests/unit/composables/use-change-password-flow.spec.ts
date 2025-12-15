import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useChangePasswordFlow } from '@/composables/use-change-password-flow'
import { authClient } from '@/lib/auth-client'

// Mock dependencies
vi.mock('@/lib/auth-client', () => ({
    authClient: {
        changePassword: vi.fn(),
    },
}))

vi.mock('primevue/usetoast', () => ({
    useToast: () => ({
        add: vi.fn(),
    }),
}))

// Mock window.location
const mockLocation = {
    href: '',
}
vi.stubGlobal('window', {
    location: mockLocation,
})

describe('useChangePasswordFlow', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        mockLocation.href = ''
    })

    it('should initialize with default values', () => {
        const { currentPassword, newPassword, confirmPassword, revokeOtherSessions } = useChangePasswordFlow()

        expect(currentPassword.value).toBe('')
        expect(newPassword.value).toBe('')
        expect(confirmPassword.value).toBe('')
        expect(revokeOtherSessions.value).toBe(true)
    })

    it('should call authClient.changePassword on successful submission', async () => {
        const { currentPassword, newPassword, confirmPassword, changePassword } = useChangePasswordFlow()

        // Set valid values
        currentPassword.value = 'OldPass123!'
        newPassword.value = 'NewPass123!'
        confirmPassword.value = 'NewPass123!'

        // Mock successful API call
        vi.mocked(authClient.changePassword).mockResolvedValue({ data: {}, error: null } as any)

        await changePassword()

        expect(authClient.changePassword).toHaveBeenCalledWith({
            newPassword: 'NewPass123!',
            currentPassword: 'OldPass123!',
            revokeOtherSessions: true,
        })
    })

    it('should handle API errors', async () => {
        const { currentPassword, newPassword, confirmPassword, changePassword } = useChangePasswordFlow()

        // Set valid values
        currentPassword.value = 'OldPass123!'
        newPassword.value = 'NewPass123!'
        confirmPassword.value = 'NewPass123!'

        // Mock failed API call
        const error = new Error('Invalid password')
        vi.mocked(authClient.changePassword).mockRejectedValue(error)

        await changePassword()

        expect(authClient.changePassword).toHaveBeenCalled()
        // Toast should be called (mocked internally by useToast)
    })

    it('should validate matching passwords', async () => {
        const { currentPassword, newPassword, confirmPassword, changePassword, errors } = useChangePasswordFlow()

        currentPassword.value = 'OldPass123!'
        newPassword.value = 'NewPass123!'
        confirmPassword.value = 'DifferentPass123!'

        await changePassword()

        expect(authClient.changePassword).not.toHaveBeenCalled()
        expect(errors.value.confirmPassword).toBeTruthy()
    })
})
