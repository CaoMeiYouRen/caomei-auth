import { describe, it, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

describe('GET /api', async () => {
    await setup({
        // run nuxt in dev mode
        dev: true,
        // or specify a different port or host
        port: 3001,
    })

    it('should return API service info', async () => {
        const res = await $fetch('/api')
        expect(res).toHaveProperty('statusCode', 200)
        expect(res).toHaveProperty('message', 'Hello, Caomei Auth!')
        expect(res).toHaveProperty('data')
        expect(res.data).toHaveProperty('version')
    })
})
