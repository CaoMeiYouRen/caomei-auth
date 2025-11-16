import { describe, expect, it, vi } from 'vitest'

const fileTypeFromBufferMock = vi.hoisted(() => vi.fn())
vi.mock('file-type', () => ({
    fileTypeFromBuffer: fileTypeFromBufferMock,
}))

import { getFileExtension, getFileType } from '@/server/utils/file'

describe('server/utils/file', () => {
    it('detects mime type using file-type helper', async () => {
        fileTypeFromBufferMock.mockResolvedValueOnce({ mime: 'image/png' })

        const result = await getFileType(Buffer.from('1234'))
        expect(result).toBe('image/png')
        expect(fileTypeFromBufferMock).toHaveBeenCalled()
    })

    it('maps known mime types to extensions', () => {
        expect(getFileExtension('image/jpeg')).toBe('.jpg')
        expect(getFileExtension('image/webp')).toBe('.webp')
    })

    it('throws when mime type is missing and returns undefined for unsupported mime', () => {
        expect(() => getFileExtension(null)).toThrow('Content-Type is required')
        expect(getFileExtension('image/svg+xml')).toBe('.svg')
        expect(getFileExtension('application/json')).toBeUndefined()
    })
})
