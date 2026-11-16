import { describe, expect, it, vi, beforeEach } from 'vitest'
import { dataSource } from '@/server/database'
import { getUserTimeZoneByEmail } from '@/server/utils/user-timezone'

vi.mock('@/server/database', () => ({
    dataSource: { getRepository: vi.fn() },
}))

const findOne = vi.fn()

describe('server/utils/user-timezone', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.mocked(dataSource.getRepository).mockReturnValue({ findOne } as never)
    })

    it('返回用户的合法时区', async () => {
        findOne.mockResolvedValue({ id: 'u1', timezone: 'Asia/Shanghai' })
        await expect(getUserTimeZoneByEmail('a@example.com')).resolves.toBe('Asia/Shanghai')
    })

    it('未设置或非法时区回退 UTC', async () => {
        findOne.mockResolvedValue({ id: 'u1', timezone: null })
        await expect(getUserTimeZoneByEmail('a@example.com')).resolves.toBe('UTC')

        findOne.mockResolvedValue({ id: 'u1', timezone: 'Mars/Olympus' })
        await expect(getUserTimeZoneByEmail('a@example.com')).resolves.toBe('UTC')
    })

    it('查询失败时回退 UTC', async () => {
        findOne.mockRejectedValue(new Error('db down'))
        await expect(getUserTimeZoneByEmail('a@example.com')).resolves.toBe('UTC')
    })
})
