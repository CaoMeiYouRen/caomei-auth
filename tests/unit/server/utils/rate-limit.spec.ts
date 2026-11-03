import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { limiterStorage } from '@/server/database/storage'
import { rateLimit } from '@/server/utils/rate-limit'

vi.mock('@/server/database/storage', () => ({
    limiterStorage: {
        increment: vi.fn(),
    },
}))

function createEvent(path: string) {
    return {
        path,
        node: {
            req: {
                headers: {},
                socket: { remoteAddress: '203.0.113.10' },
            },
        },
    } as any
}

describe('server/utils/rate-limit', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // rate-limit.ts 依赖 Nuxt 自动导入的 getRequestIP / createError，测试环境需手动注入
        vi.stubGlobal('getRequestIP', () => '203.0.113.10')
        vi.stubGlobal('createError', (options: { statusCode?: number, message?: string }) => Object.assign(new Error(options.message), options))
        vi.mocked(limiterStorage.increment).mockResolvedValue(1)
    })

    afterEach(() => {
        vi.unstubAllGlobals()
    })

    it('点段与查询串共用同一计数桶，避免拆分限流', async () => {
        await rateLimit(createEvent('/api/file/./upload?x=1'), { window: 60, max: 5 })
        await rateLimit(createEvent('/api/file/upload'), { window: 60, max: 5 })

        const keys = vi.mocked(limiterStorage.increment).mock.calls.map((call) => call[0])
        expect(keys[0]).toBe('ratelimit:203.0.113.10:/api/file/upload')
        expect(keys[0]).toBe(keys[1])
    })

    it('超过阈值时抛出 429', async () => {
        vi.mocked(limiterStorage.increment).mockResolvedValue(6)

        await expect(rateLimit(createEvent('/api/file/upload'), { window: 60, max: 5 }))
            .rejects.toMatchObject({ statusCode: 429 })
    })
})
