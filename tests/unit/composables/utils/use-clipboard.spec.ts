import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useClipboard } from '@/composables/utils/use-clipboard'

// Mock dependencies
const mockToast = {
    add: vi.fn(),
}

vi.mock('primevue/usetoast', () => ({
    useToast: () => mockToast,
}))

describe('composables/utils/use-clipboard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Reset navigator mock
        Object.defineProperty(global.navigator, 'clipboard', {
            value: {
                writeText: vi.fn(),
            },
            writable: true,
        })
    })

    it('should copy text successfully', async () => {
        const { copy } = useClipboard()
        const text = 'test text'

    // Mock success
    ;(navigator.clipboard.writeText as any).mockResolvedValue(undefined)

        const result = await copy(text)

        expect(result).toBe(true)
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text)
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'success',
            summary: '复制成功',
        }))
    })

    it('should handle clipboard API missing', async () => {
    // Mock missing clipboard
        Object.defineProperty(global.navigator, 'clipboard', {
            value: undefined,
            writable: true,
        })

        const { copy } = useClipboard()
        const result = await copy('test')

        expect(result).toBe(false)
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'warn',
            summary: '无法复制',
        }))
    })

    it('should handle copy error', async () => {
        const { copy } = useClipboard()

    // Mock error
    ;(navigator.clipboard.writeText as any).mockRejectedValue(new Error('Failed'))

        const result = await copy('test')

        expect(result).toBe(false)
        expect(mockToast.add).toHaveBeenCalledWith(expect.objectContaining({
            severity: 'error',
            summary: '复制失败',
        }))
    })
})
