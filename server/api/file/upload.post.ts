import path from 'path'
import { defineEventHandler, readMultipartFormData } from 'h3'
import { parse } from 'better-bytes'
import dayjs from 'dayjs'
import ms from 'ms'
import { getFileStorage } from '@/server/storage/factory'
import { getFileExtension, getFileType } from '@/server/utils/file'
import { auth } from '@/lib/auth'
import { limiterStorage } from '@/server/database/storage'

const VITE_MAX_UPLOAD_SIZE = process.env.VITE_MAX_UPLOAD_SIZE || '4.5MiB'
const MAX_UPLOAD_SIZE = Number(parse(VITE_MAX_UPLOAD_SIZE))

// 上传次数限制窗口
const UPLOAD_LIMIT_WINDOW = Number(process.env.UPLOAD_LIMIT_WINDOW || ms('1d') / 1000)
// 文件上传每日限制
const UPLOAD_DAILY_LIMIT = Number(process.env.UPLOAD_DAILY_LIMIT || '1000')

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
        `user_${session.user.id}_upload_limit`,
        UPLOAD_LIMIT_WINDOW,
    )

    if (globalCount > UPLOAD_DAILY_LIMIT) {
        throw new Error('上传次数超出限制')
    }

    try {

        // 获取运行时配置
        const config = useRuntimeConfig()
        const storageType = config.STORAGE_TYPE
        const bucketPrefix = config.BUCKET_PREFIX || ''
        const env = {
            S3_BASE_URL: config.S3_BASE_URL,
            S3_REGION: config.S3_REGION,
            S3_BUCKET_NAME: config.S3_BUCKET_NAME,
            S3_ACCESS_KEY_ID: config.S3_ACCESS_KEY_ID,
            S3_SECRET_ACCESS_KEY: config.S3_SECRET_ACCESS_KEY,
            S3_ENDPOINT: config.S3_ENDPOINT,
            VERCEL_BLOB_TOKEN: config.VERCEL_BLOB_TOKEN,
            BLOB_READ_WRITE_TOKEN: config.BLOB_READ_WRITE_TOKEN,
        }

        // 获取存储实例
        const storage = getFileStorage(storageType, env)

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
                message: `文件大小超出 ${VITE_MAX_UPLOAD_SIZE} 限制`,
            }
        }
        // 上传文件

        const fileBuffer = Buffer.from(filePart.data)
        // 如果没有Content-Type头，尝试从body中检测
        const contentType = event.headers.get('Content-Type') || await getFileType(fileBuffer) || 'application/octet-stream'
        // 获取文件后缀名
        const extension = getFileExtension(contentType) || path.extname(filePart.filename)
        const timestamp = dayjs().format('YYYYMMDDHHmmssSSS') // 时间戳
        const random = Math.random().toString(36).slice(2, 9) // 随机字符串，避免文件名冲突
        const key = `${bucketPrefix}${timestamp}-${random}.${extension}` // 文件名

        const { url } = await storage.upload(fileBuffer, key, contentType)

        return {
            status: 200,
            success: true,
            url,
        }
    } catch (error) {
        console.error('文件上传失败:', error)
        return {
            status: 400,
            success: false,
            message: '文件上传失败',
        }
    }
})
