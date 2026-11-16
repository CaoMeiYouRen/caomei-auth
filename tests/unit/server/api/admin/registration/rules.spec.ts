import { describe, it, expect, vi, beforeEach } from 'vitest'
import { readBody, getValidatedRouterParams } from 'h3'
import listHandler from '@/server/api/admin/registration/rules.get'
import createHandler from '@/server/api/admin/registration/rules.post'
import updateHandler from '@/server/api/admin/registration/rules/[id].put'
import deleteHandler from '@/server/api/admin/registration/rules/[id].delete'
import { dataSource } from '@/server/database'
import { checkAdmin } from '@/server/utils/check-admin'
import { invalidateRegistrationRuleCache } from '@/server/utils/registration-policy'

vi.mock('h3', async (importOriginal) => {
    const actual = await importOriginal<typeof import('h3')>()
    return { ...actual, readBody: vi.fn(), getValidatedRouterParams: vi.fn() }
})
vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))
vi.mock('@/server/utils/check-admin', () => ({ checkAdmin: vi.fn() }))
vi.mock('@/server/utils/logger', () => ({ default: { info: vi.fn(), error: vi.fn() } }))

const repo = {
    find: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn((data) => data),
    save: vi.fn(async (data) => data),
    remove: vi.fn(async () => undefined),
}

describe('admin registration rules API', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        invalidateRegistrationRuleCache()
        vi.mocked(checkAdmin).mockResolvedValue({ data: { userId: 'admin-1' } } as never)
        vi.mocked(dataSource.getRepository).mockReturnValue(repo as never)
    })

    it('lists rules ordered', async () => {
        repo.find.mockResolvedValue([{ id: 'r1', type: 'email-domain', mode: 'deny', value: 'a.com', enabled: true, note: null }])
        const result = await listHandler({ path: '/api/admin/registration/rules' } as never)
        expect(result.data.rules).toHaveLength(1)
        expect(repo.find).toHaveBeenCalledWith({ order: { type: 'ASC', mode: 'ASC', value: 'ASC' } })
    })

    it('creates normalized rule and rejects duplicates', async () => {
        const event = { path: '/api/admin/registration/rules', context: {} } as never
        vi.mocked(readBody).mockResolvedValue({ type: 'email-domain', mode: 'deny', value: ' Example.COM ' } as never)
        repo.findOne.mockResolvedValue(null)

        const result = await createHandler(event)
        expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ value: 'example.com', enabled: true }))
        expect(result.success).toBe(true)

        repo.findOne.mockResolvedValue({ id: 'exists' })
        await expect(createHandler({ ...(event as object), path: '/api/admin/registration/rules' } as never)).rejects.toMatchObject({ statusCode: 409 })
    })

    it('updates enabled flag and deletes', async () => {
        const rule = { id: 'r1', type: 'email-domain', mode: 'deny', value: 'a.com', enabled: true, note: null }
        repo.findOne.mockResolvedValue(rule)
        vi.mocked(readBody).mockResolvedValue({ enabled: false } as never)
        vi.mocked(getValidatedRouterParams).mockResolvedValue({ success: true, data: { id: 'r1' } } as never)

        const updated = await updateHandler({ path: '/api/admin/registration/rules/r1', context: { params: { id: 'r1' } } } as never)
        expect(updated.data.rule.enabled).toBe(false)
        expect(repo.save).toHaveBeenCalled()

        const deleted = await deleteHandler({ path: '/api/admin/registration/rules/r1', context: { params: { id: 'r1' } } } as never)
        expect(deleted.success).toBe(true)
        expect(repo.remove).toHaveBeenCalled()
    })

    it('returns 404 for missing rule on update/delete', async () => {
        repo.findOne.mockResolvedValue(null)
        vi.mocked(getValidatedRouterParams).mockResolvedValue({ success: true, data: { id: 'nope' } } as never)
        vi.mocked(readBody).mockResolvedValue({ enabled: false } as never)

        await expect(updateHandler({ path: '/api/admin/registration/rules/nope', context: { params: { id: 'nope' } } } as never))
            .rejects.toMatchObject({ statusCode: 404 })
        await expect(deleteHandler({ path: '/api/admin/registration/rules/nope', context: { params: { id: 'nope' } } } as never))
            .rejects.toMatchObject({ statusCode: 404 })
    })
})
