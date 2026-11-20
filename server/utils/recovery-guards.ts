import { APIError } from 'better-auth/api'
import { resolveRecoveryMessage } from './recovery-messages'
import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'

interface RequestLike {
    headers?: Headers | { get?: (name: string) => string | null }
}

/**
 * 管理员写操作边界（阶段 9 D8 / D9）。
 *
 * 在 better-auth `hooks.before` 中执行：
 * - `/admin/set-user-password` 一律拒绝；
 * - `/admin/update-user` 出现 `data.email` / `data.phoneNumber` 时拒绝。
 * 管理员只能通过 `/api/admin/users/{id}/channel-change` 发起改绑。
 */
export function assertAdminWriteAllowed(path: string, body: unknown, request?: RequestLike | null): void {
    if (path === '/admin/set-user-password') {
        throw new APIError('FORBIDDEN', {
            message: resolveRecoveryMessage(request, 'adminPasswordForbidden'),
            code: 'ADMIN_PASSWORD_FORBIDDEN',
        })
    }
    if (path === '/admin/update-user') {
        const data = (body as { data?: { email?: unknown, phoneNumber?: unknown } } | undefined)?.data
        if (data && (Object.hasOwn(data, 'email') || Object.hasOwn(data, 'phoneNumber'))) {
            throw new APIError('FORBIDDEN', {
                message: resolveRecoveryMessage(request, 'adminDirectEditForbidden'),
                code: 'ADMIN_DIRECT_EDIT_FORBIDDEN',
            })
        }
    }
}

/**
 * 强制重置密码期间拒绝创建会话（阶段 9 M11）。
 *
 * 覆盖密码、邮箱 OTP、手机 OTP、社交与 SSO 登录：这些路径最终都会创建 session。
 */
export async function assertPasswordResetCompleted(
    session: { userId?: unknown },
    request?: RequestLike | null,
    repository: Pick<ReturnType<typeof dataSource.getRepository<User>>, 'findOne'> = dataSource.getRepository(User),
): Promise<void> {
    const userId = session.userId
    if (typeof userId !== 'string' || !userId) {
        return
    }
    const user = await repository.findOne({
        where: { id: userId },
        select: ['id', 'mustResetPassword'],
    })
    if (user?.mustResetPassword) {
        throw new APIError('FORBIDDEN', {
            message: resolveRecoveryMessage(request, 'passwordResetRequired'),
            code: 'PASSWORD_RESET_REQUIRED',
        })
    }
}

/** 密码重置成功后清除强制重置标记 */
export async function clearPasswordResetRequirement(
    userId: string,
    repository: Pick<ReturnType<typeof dataSource.getRepository<User>>, 'update'> = dataSource.getRepository(User),
): Promise<void> {
    await repository.update({ id: userId }, { mustResetPassword: false })
}
