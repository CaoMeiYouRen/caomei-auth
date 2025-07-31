import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { ADMIN_USER_IDS } from '@/utils/env'

/**
 * 检查用户是否为管理员，并自动同步角色信息
 * @param userId 用户ID
 * @returns 用户是否为管理员
 */
export async function checkAndSyncAdminRole(userId: string): Promise<boolean> {
    try {
        // 获取用户信息
        const userRepo = dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { id: userId } })

        if (!user) {
            return false
        }

        return await checkAndSyncAdminRoleWithUser(user)
    } catch (error) {
        console.error('检查和同步管理员角色失败:', error)
        return false
    }
}

/**
 * 检查用户是否为管理员，并自动同步角色信息（使用已有的用户对象）
 * @param user 用户对象
 * @returns 用户是否为管理员
 */
export async function checkAndSyncAdminRoleWithUser(user: User): Promise<boolean> {
    try {
        // 检查用户是否在 adminUserIds 列表中
        const isAdminUserId = ADMIN_USER_IDS.includes(user.id)

        // 检查用户角色是否包含 admin
        const hasAdminRole = user.role?.includes('admin') || false

        // 如果用户在 adminUserIds 中但角色中没有 admin，则自动添加
        if (isAdminUserId && !hasAdminRole) {
            const currentRoles = user.role ? user.role.split(',').map((r) => r.trim()) : ['user']

            // 如果角色列表中没有 admin，则添加
            if (!currentRoles.includes('admin')) {
                currentRoles.push('admin')
                user.role = currentRoles.join(',')

                // 保存到数据库
                const userRepo = dataSource.getRepository(User)
                await userRepo.save(user)
                console.log(`自动为用户 ${user.id} 添加管理员角色`)
            }
            return true
        }

        // 如果用户不在 adminUserIds 中但角色中有 admin，可以选择是否移除（这里不移除，保持现有逻辑）
        // 因为可能有其他方式设置的管理员角色

        // 返回是否为管理员（任一条件满足即可）
        return isAdminUserId || hasAdminRole
    } catch (error) {
        console.error('检查和同步管理员角色失败:', error)
        return false
    }
}

/**
 * 检查用户是否为管理员（更轻量级的版本，不进行数据库同步）
 * @param user 用户对象
 * @param userId 用户ID
 * @returns 用户是否为管理员
 */
export function isUserAdmin(user: { role?: string | null }, userId: string): boolean {
    // 检查用户是否在 adminUserIds 列表中
    const isAdminUserId = ADMIN_USER_IDS.includes(userId)

    // 检查用户角色是否包含 admin
    const hasAdminRole = user.role?.includes('admin') || false

    // 任一条件满足即为管理员
    return isAdminUserId || hasAdminRole
}

/**
 * 为用户设置管理员角色
 * @param userId 用户ID
 * @returns 操作是否成功
 */
export async function setUserAdminRole(userId: string): Promise<boolean> {
    try {
        const userRepo = dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { id: userId } })

        if (!user) {
            return false
        }

        const currentRoles = user.role ? user.role.split(',').map((r) => r.trim()) : ['user']

        // 如果角色列表中没有 admin，则添加
        if (!currentRoles.includes('admin')) {
            currentRoles.push('admin')
            user.role = currentRoles.join(',')
            await userRepo.save(user)
            console.log(`为用户 ${userId} 设置管理员角色`)
        }

        return true
    } catch (error) {
        console.error('设置管理员角色失败:', error)
        return false
    }
}

/**
 * 为用户移除管理员角色
 * @param userId 用户ID
 * @param currentUserId 当前操作用户的ID（可选，用于防止自己移除自己的管理员权限）
 * @returns 操作是否成功
 */
export async function removeUserAdminRole(userId: string, currentUserId?: string): Promise<boolean> {
    try {
        // 防止用户移除自己的管理员权限
        if (currentUserId && userId === currentUserId) {
            console.warn(`用户 ${userId} 试图移除自己的管理员权限，操作被拒绝`)
            return false
        }

        const userRepo = dataSource.getRepository(User)
        const user = await userRepo.findOne({ where: { id: userId } })

        if (!user) {
            return false
        }

        const currentRoles = user.role ? user.role.split(',').map((r) => r.trim()) : ['user']

        // 如果角色列表中有 admin，则移除
        const newRoles = currentRoles.filter((role) => role !== 'admin')

        // 如果移除后没有角色，设置为 user
        if (newRoles.length === 0) {
            newRoles.push('user')
        }

        user.role = newRoles.join(',')
        await userRepo.save(user)
        console.log(`为用户 ${userId} 移除管理员角色`)

        return true
    } catch (error) {
        console.error('移除管理员角色失败:', error)
        return false
    }
}

