import { S3Env, S3Storage } from './s3'
import { VercelBlobStorage, VercelEnv } from './vercel-blob'
import { Storage } from './type'

export type Bindings = S3Env & VercelEnv

/**
 * 获取文件存储实例。支持 s3 和 vercel-blob
 *
 * @author CaoMeiYouRen
 * @date 2025-07-15
 * @export
 * @param type
 * @param env
 */
export function getFileStorage(type: string, env: Bindings): Storage {
    switch (type) {
        case 's3':
            return new S3Storage(env)
        case 'vercel-blob':
            return new VercelBlobStorage(env)
        default:
            throw new Error('Unsupported storage type')
    }
}
