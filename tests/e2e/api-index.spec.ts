import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('GET /api', async () => {
    await setup({
        // run nuxt in dev mode
        dev: true,
        // or specify a different port or host
        port: 3001,
        // 使用测试模式，避免连接生产数据库
        env: {
            // 使用内存数据库进行测试
            DATABASE_TYPE: 'sqlite',
            DATABASE_PATH: ':memory:',
            // 禁用日志文件写入
            LOGFILES: 'false',
            LOG_LEVEL: 'error',
            // 设置测试用的密钥
            AUTH_SECRET: 'test-secret-key-for-vitest',
            NODE_ENV: 'test',
        },
    })
    it('should return API service info', async () => {
        const res = await $fetch('/api')
        expect(res).toHaveProperty('statusCode', 200)
        expect(res).toHaveProperty('message', 'Hello, Caomei Auth!')
        expect(res).toHaveProperty('data')
        expect(res.data).toHaveProperty('version')
    })
})
