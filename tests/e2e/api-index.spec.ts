import { describe, it, expect, beforeAll } from 'vitest'
import { setup, fetch } from '@nuxt/test-utils/e2e'

describe('GET /api', async () => {

    beforeAll(async () => {
        await setup({
        })
    })

    it('should return API service info', async () => {
        const res = await (await fetch('/api')).json()
        expect(res).toHaveProperty('statusCode', 200)
    })
})
