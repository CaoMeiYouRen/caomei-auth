import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useConfirmAction } from '@/composables/utils/use-confirm-action'

// Mock dependencies
const mockConfirm = {
    require: vi.fn(),
}

vi.mock('primevue/useconfirm', () => ({
    useConfirm: () => mockConfirm,
}))

describe('composables/utils/use-confirm-action', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('should call confirm.require with correct args for requireDelete', () => {
        const { requireDelete } = useConfirmAction()
        const onAccept = vi.fn()
        const message = 'Delete this?'

        requireDelete(message, onAccept)

        expect(mockConfirm.require).toHaveBeenCalledWith(expect.objectContaining({
            message,
            header: '确认删除',
            accept: onAccept,
            acceptClass: 'p-button-danger',
        }))
    })

    it('should call confirm.require with correct args for requireLogout', () => {
        const { requireLogout } = useConfirmAction()
        const onAccept = vi.fn()

        requireLogout(onAccept)

        expect(mockConfirm.require).toHaveBeenCalledWith(expect.objectContaining({
            header: '确认退出',
            accept: onAccept,
            acceptClass: 'p-button-primary',
        }))
    })

    it('should call confirm.require with correct args for requireConfirm', () => {
        const { requireConfirm } = useConfirmAction()
        const onAccept = vi.fn()
        const options = {
            message: 'Confirm this?',
            header: 'Custom Header',
            onAccept,
        }

        requireConfirm(options)

        expect(mockConfirm.require).toHaveBeenCalledWith(expect.objectContaining({
            message: options.message,
            header: options.header,
            accept: onAccept,
        }))
    })
})
