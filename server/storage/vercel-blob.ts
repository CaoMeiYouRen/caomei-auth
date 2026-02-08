import { put } from '@vercel/blob'
import type { Storage } from './type'

export interface VercelEnv {
    // Vercel Blob 令牌
    VERCEL_BLOB_TOKEN: string
    // Vercel Blob 读写令牌
    BLOB_READ_WRITE_TOKEN: string
}

/**
 * Vercel Blob 存储
 * 需要设置 VERCEL_BLOB_TOKEN 或 BLOB_READ_WRITE_TOKEN
 */
export class VercelBlobStorage implements Storage {
    private env: VercelEnv

    constructor(env: VercelEnv) {
        this.env = env
    }

    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // Vercel Blob 上传逻辑
        const { url } = await put(filename, buffer, {
            token: this.env.VERCEL_BLOB_TOKEN || this.env.BLOB_READ_WRITE_TOKEN,
            access: 'public',
            contentType,
            addRandomSuffix: false,
        })
        return { url }
    }
}
