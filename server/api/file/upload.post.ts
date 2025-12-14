import path from 'path'
import { defineEventHandler, readMultipartFormData } from 'h3'
import dayjs from 'dayjs'
import { type FileStorageEnv, getFileStorage } from '@/server/storage/factory'
import { getFileExtension, getFileType } from '@/server/utils/file'
import { auth } from '@/lib/auth'
import { limiterStorage } from '@/server/database/storage'
import logger from '@/server/utils/logger'

import {
    MAX_UPLOAD_SIZE,
    MAX_UPLOAD_SIZE_TEXT,
    UPLOAD_LIMIT_WINDOW,
    UPLOAD_DAILY_LIMIT,
    UPLOAD_SINGLE_USER_DAILY_LIMIT,
    STORAGE_TYPE,
    BUCKET_PREFIX,
} from '@/utils/shared/env'

export default defineEventHandler(async (event): Promise<{
    status: number
    success: boolean
    message?: string
    url?: string
}> => {

    const session = await auth.api.getSession({
        headers: event.headers,
    })

    if (!session?.user) {
        return {
            status: 401,
            success: false,
            message: '未登录',
        }
    }

    const globalCount = await limiterStorage.increment(
        'upload_global_limit',
        UPLOAD_LIMIT_WINDOW,
    )

    if (globalCount > UPLOAD_DAILY_LIMIT) {
        throw new Error('今日上传次数超出限制')
    }

    const userCount = await limiterStorage.increment(
        `user_upload_limit:${session.user.id}`,
        UPLOAD_LIMIT_WINDOW,
    )

    if (userCount > UPLOAD_SINGLE_USER_DAILY_LIMIT) {
        throw new Error('您今日上传次数超出限制')
    }

    try {

        // 获取存储实例
        const storage = getFileStorage(STORAGE_TYPE, process.env as FileStorageEnv)

        // 读取表单数据
        const parts = await readMultipartFormData(event)
        if (!parts) {
            return {
                status: 400,
                success: false,
                message: '未找到上传文件',
            }
        }

        const filePart = parts.find((part) => part.name === 'file')
        if (!filePart || !filePart.filename || !filePart.data) {
            return {
                status: 400,
                success: false,
                message: '无效的文件上传',
            }
        }
        // 检查文件大小
        if (filePart.data.length > MAX_UPLOAD_SIZE) {
            return {
                status: 400,
                success: false,
                message: `文件大小超出 ${MAX_UPLOAD_SIZE_TEXT} 限制`,
            }
        }
        // 上传文件

        const fileBuffer = Buffer.from(filePart.data)
        // 优先使用文件部分自带的 Content-Type，其次尝试从 buffer 检测，最后默认为 application/octet-stream
        const contentType = filePart.type || await getFileType(fileBuffer) || 'application/octet-stream'
        // 获取文件后缀名
        const extension = getFileExtension(contentType) || path.extname(filePart.filename)
        const timestamp = dayjs().format('YYYYMMDDHHmmssSSS') // 时间戳
        const random = Math.random().toString(36).slice(2, 9) // 随机字符串，避免文件名冲突
        const key = `${BUCKET_PREFIX}${timestamp}-${random}${extension}` // 文件名

        const { url } = await storage.upload(fileBuffer, key, contentType)

        // 更新用户头像
        await auth.api.updateUser({
            headers: event.headers,
            body: {
                image: url,
            },
        })

        return {
            status: 200,
            success: true,
            url,
        }
    } catch (error) {
        logger.error('File upload failed', {
            error: error instanceof Error ? error.message : String(error),
            userId: session?.user?.id,
        })
        return {
            status: 400,
            success: false,
            message: '文件上传失败',
        }
    }
})
