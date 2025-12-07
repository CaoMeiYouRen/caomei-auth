import { S3Client, PutObjectCommand, type PutObjectCommandInput } from '@aws-sdk/client-s3'
import type { Storage } from './type'

export type S3Env = {
    // S3 基础 URL
    S3_BASE_URL?: string
    // S3 区域
    S3_REGION: string
    // S3 存储桶名称
    S3_BUCKET_NAME: string
    // S3 访问密钥 ID
    S3_ACCESS_KEY_ID: string
    // S3 秘密访问密钥
    S3_SECRET_ACCESS_KEY: string
    // S3 端点
    S3_ENDPOINT?: string
}

/**
 * S3 存储
 * 需要设置 S3_BUCKET_NAME, S3_REGION, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY，可选 S3_BASE_URL
 */
export class S3Storage implements Storage {
    private s3Client: S3Client
    private env: S3Env

    constructor(env: S3Env) {
        this.env = env
        this.env.S3_BASE_URL = env.S3_BASE_URL || `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com`
        this.env.S3_ENDPOINT = env.S3_ENDPOINT || `https://${env.S3_BUCKET_NAME}.s3.${env.S3_REGION}.amazonaws.com`
        this.s3Client = new S3Client({
            region: env.S3_REGION,
            endpoint: this.env.S3_ENDPOINT,
            credentials: {
                accessKeyId: env.S3_ACCESS_KEY_ID,
                secretAccessKey: env.S3_SECRET_ACCESS_KEY,
            },
        })
    }

    async upload(buffer: Buffer, filename: string, contentType?: string): Promise<{ url: string }> {
        // S3 上传逻辑
        const params: PutObjectCommandInput = {
            Bucket: this.env.S3_BUCKET_NAME,
            Key: filename,
            Body: buffer,
            ContentType: contentType,
        }

        const command = new PutObjectCommand(params)
        await this.s3Client.send(command)
        const url = new URL(filename, this.env.S3_BASE_URL)
        return { url: url.toString() }
    }
}
