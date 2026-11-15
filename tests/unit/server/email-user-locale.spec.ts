import { describe, expect, it, vi } from 'vitest'

const findOne = vi.hoisted(() => vi.fn())
const update = vi.hoisted(() => vi.fn())

vi.mock('@/server/database', () => ({
    dataSource: {
        getRepository: () => ({ findOne, update }),
    },
}))

import {
    backfillUserLocale,
    getUserLocaleByEmail,
    resolveEmailLocaleForAddress,
    resolveEmailLocaleWithBackfill,
} from '@/server/utils/email/user-locale'

describe('server/utils/email/user-locale', () => {
    it('reads the stored locale by email', async () => {
        findOne.mockResolvedValue({ locale: 'en-US' })

        await expect(getUserLocaleByEmail('user@example.com')).resolves.toBe('en-US')
        expect(findOne).toHaveBeenCalledWith({ where: { email: 'user@example.com' } })
    })

    it('returns null when the user is missing or the lookup fails', async () => {
        findOne.mockResolvedValueOnce(null)
        await expect(getUserLocaleByEmail('nobody@example.com')).resolves.toBeNull()

        findOne.mockRejectedValueOnce(new Error('db down'))
        await expect(getUserLocaleByEmail('user@example.com')).resolves.toBeNull()
    })

    it('resolves explicit override > request locale > stored locale > default', async () => {
        findOne.mockResolvedValue({ locale: 'en-US' })

        await expect(resolveEmailLocaleForAddress('user@example.com', { locale: 'zh-CN' })).resolves.toBe('zh-CN')

        const request = new Request('https://example.com/api', { headers: { 'accept-language': 'zh-CN' } })
        await expect(resolveEmailLocaleForAddress('user@example.com', { request })).resolves.toBe('zh-CN')

        await expect(resolveEmailLocaleForAddress('user@example.com')).resolves.toBe('en-US')

        findOne.mockResolvedValue({ locale: null })
        await expect(resolveEmailLocaleForAddress('user@example.com')).resolves.toBe('zh-CN')
    })

    it('flags old users for lazy backfill when a request locale is known', async () => {
        const request = new Request('https://example.com/api', { headers: { 'accept-language': 'en-US' } })

        findOne.mockResolvedValueOnce({ locale: null })
        await expect(resolveEmailLocaleWithBackfill('old@example.com', { request }))
            .resolves.toEqual({ locale: 'en-US', shouldBackfill: true })

        findOne.mockResolvedValueOnce({ locale: 'zh-CN' })
        await expect(resolveEmailLocaleWithBackfill('known@example.com', { request }))
            .resolves.toEqual({ locale: 'en-US', shouldBackfill: false })

        findOne.mockResolvedValueOnce({ locale: null })
        await expect(resolveEmailLocaleWithBackfill('old@example.com'))
            .resolves.toEqual({ locale: 'zh-CN', shouldBackfill: false })
    })

    it('writes the backfilled locale without throwing on failure', async () => {
        update.mockResolvedValue({ affected: 1 })
        await backfillUserLocale('old@example.com', 'en-US')
        expect(update).toHaveBeenCalledWith({ email: 'old@example.com' }, { locale: 'en-US' })

        update.mockRejectedValueOnce(new Error('db down'))
        await expect(backfillUserLocale('old@example.com', 'en-US')).resolves.toBeUndefined()
    })
})
