import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readMultipartFormData } from 'h3'
import handler from '@/server/api/file/upload.post'
import { getFileStorage } from '@/server/storage/factory'
import { getFileExtension, getFileType } from '@/server/utils/file'
import { auth } from '@/lib/auth'
import { limiterStorage } from '@/server/database/storage'

// Mock dependencies
vi.mock('h3', async () => {
    const actual = await vi.importActual('h3')
    return {
        ...actual,
        readMultipartFormData: vi.fn(),
    }
})

vi.mock('@/server/storage/factory', () => ({
    getFileStorage: vi.fn(),
}))

vi.mock('@/server/utils/file', () => ({
    getFileExtension: vi.fn(),
    getFileType: vi.fn(),
}))

vi.mock('@/lib/auth', () => ({
    auth: {
        api: {
            getSession: vi.fn(),
            updateUser: vi.fn(),
        },
    },
}))

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: vi.fn(),
    },
}))

vi.mock('@/server/utils/logger', () => ({
    default: {
        error: vi.fn(),
    },
}))

// Mock env constants if needed, but they are imported values.
// If they are constants, we might need to mock the module if we want to change them,
// but for now we can assume default values or mock the module.
vi.mock('@/utils/shared/env', async () => {
    const actual = await vi.importActual('@/utils/shared/env')
    return {
        ...actual,
        MAX_UPLOAD_SIZE: 1024 * 1024 * 5, // 5MB
        MAX_UPLOAD_SIZE_TEXT: '5MB',
        UPLOAD_DAILY_LIMIT: 100,
        UPLOAD_SINGLE_USER_DAILY_LIMIT: 10,
        STORAGE_TYPE: 'local',
        BUCKET_PREFIX: 'uploads/',
    }
})

describe('server/api/file/upload.post', () => {
    const mockStorage = {
        upload: vi.fn(),
    }

    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(getFileStorage).mockReturnValue(mockStorage as any)
        vi.mocked(limiterStorage.increment).mockResolvedValue(1)
        vi.mocked(auth.api.getSession).mockResolvedValue({
            user: { id: 'user-123' },
        } as any)
    })

    it('should upload file successfully', async () => {
        const fileData = Buffer.from('test content')
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { name: 'file', filename: 'test.png', data: fileData, type: 'image/png' },
        ])
        vi.mocked(getFileType).mockResolvedValue('image/png')
        vi.mocked(getFileExtension).mockReturnValue('.png')
        mockStorage.upload.mockResolvedValue({ url: 'https://example.com/uploads/test.png' })

        const event = {
            headers: new Map([['Content-Type', 'multipart/form-data']]),
        }
        // Mock event.headers.get for the handler
        event.headers.get = vi.fn((key) => key === 'Content-Type' ? 'multipart/form-data' : undefined)

        const result = await handler(event as any)

        expect(auth.api.getSession).toHaveBeenCalled()
        expect(limiterStorage.increment).toHaveBeenCalledTimes(2)
        expect(getFileStorage).toHaveBeenCalledWith('local', expect.any(Object))
        expect(mockStorage.upload).toHaveBeenCalledWith(
            expect.anything(),
            expect.stringMatching(/^uploads\/\d{17}-[a-z0-9]{7}\.png$/),
            'image/png', // Content-Type from filePart.type
        )
        expect(result).toEqual({
            status: 200,
            success: true,
            url: 'https://example.com/uploads/test.png',
        })
    })

    it('should return 401 if not logged in', async () => {
        vi.mocked(auth.api.getSession).mockResolvedValue(null)

        const event = { headers: new Map() }
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 401,
            success: false,
            message: '未登录',
        })
    })

    it('should throw error if global limit exceeded', async () => {
        vi.mocked(limiterStorage.increment).mockResolvedValueOnce(101) // Global limit is 100

        const event = { headers: new Map() }
        await expect(handler(event as any)).rejects.toThrow('今日上传次数超出限制')
    })

    it('should throw error if user limit exceeded', async () => {
        vi.mocked(limiterStorage.increment).mockResolvedValueOnce(1) // Global ok
        vi.mocked(limiterStorage.increment).mockResolvedValueOnce(11) // User limit is 10

        const event = { headers: new Map() }
        await expect(handler(event as any)).rejects.toThrow('您今日上传次数超出限制')
    })

    it('should return 400 if no file uploaded', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue(undefined)

        const event = { headers: new Map() }
        event.headers.get = vi.fn()
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: '未找到上传文件',
        })
    })

    it('should return 400 if file part is invalid', async () => {
        vi.mocked(readMultipartFormData).mockResolvedValue([])

        const event = { headers: new Map() }
        event.headers.get = vi.fn()
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: '无效的文件上传',
        })
    })

    it('should return 400 if file size exceeds limit', async () => {
        const largeData = Buffer.alloc(1024 * 1024 * 6) // 6MB
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { name: 'file', filename: 'large.png', data: largeData, type: 'image/png' },
        ])

        const event = { headers: new Map() }
        event.headers.get = vi.fn()
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: '文件大小超出 5MB 限制',
        })
    })

    it('should handle upload errors', async () => {
        const fileData = Buffer.from('test content')
        vi.mocked(readMultipartFormData).mockResolvedValue([
            { name: 'file', filename: 'test.png', data: fileData, type: 'image/png' },
        ])
        vi.mocked(getFileType).mockResolvedValue('image/png')
        vi.mocked(getFileExtension).mockReturnValue('.png')
        
        const error = new Error('Upload failed')
        mockStorage.upload.mockRejectedValue(error)

        const event = { headers: new Map() }
        event.headers.get = vi.fn()
        
        const result = await handler(event as any)

        expect(result).toEqual({
            status: 400,
            success: false,
            message: '文件上传失败',
        })
    })
})
