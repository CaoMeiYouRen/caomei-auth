import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/server/database', () => ({ dataSource: { getRepository: vi.fn() } }))

function listFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const full = path.join(dir, entry)
        return statSync(full).isDirectory() ? listFiles(full) : [full]
    })
}

describe('账号恢复边界（M9 / M12）', () => {
    it('does not expose any admin 2FA reset endpoint', () => {
        const files = listFiles(path.resolve(process.cwd(), 'server/api/admin'))
        const offending = files.filter((file) => {
            const content = readFileSync(file, 'utf8')
            return /two-?factor|twoFactor/i.test(content)
        })
        expect(offending).toEqual([])
    })

    it('does not expose direct email / phone / password editing in the admin user dialog', () => {
        const dialog = readFileSync(
            path.resolve(process.cwd(), 'components/admin/users/user-detail-dialog.vue'),
            'utf8',
        )
        expect(dialog).not.toContain('editEmail')
        expect(dialog).not.toContain('editPhone')
        expect(dialog).not.toContain('editPassword')
        expect(dialog).toContain('channel-change-dialog')
    })

    it('rejects administrator password setting at the better-auth boundary', async () => {
        const { assertAdminWriteAllowed } = await import('@/server/utils/recovery-guards')
        expect(() => assertAdminWriteAllowed('/admin/set-user-password', { password: 'x' })).toThrow()
    })
})
