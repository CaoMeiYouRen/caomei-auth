import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

await setup({
    dev: true,
    port: 3001,
    env: {
        DATABASE_TYPE: 'sqlite',
        DATABASE_PATH: ':memory:',
        LOGFILES: 'false',
        LOG_LEVEL: 'error',
        AUTH_SECRET: 'test-secret-key-for-vitest',
        NODE_ENV: 'test',
    },
})

describe('GET /api', () => {
    it('should expose service metadata', async () => {
        const res = await $fetch<{
            statusCode: number
            statusMessage: string
            message: string
            data: {
                version: string
            }
        }>('/api')

        expect(res).toMatchObject({
            statusCode: 200,
            statusMessage: 'OK',
            message: 'Hello, Caomei Auth!',
        })

        expect(res.data).toMatchObject({
            version: expect.any(String),
        })
        expect(res.data.version.length).toBeGreaterThan(0)
    })
})
