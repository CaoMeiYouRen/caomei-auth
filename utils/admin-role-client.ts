/**
 * 管理员角色同步相关的客户端工具函数
 */

/**
 * 同步用户的管理员角色
 * @param userId 用户ID
 * @returns 操作结果
 */
export async function syncAdminRole(userId: string) {
    const response = await $fetch('/api/admin/sync-admin-role', {
        method: 'POST',
        body: {
            userId,
            action: 'sync',
        },
    })
    return response
}

/**
 * 为用户添加管理员角色
 * @param userId 用户ID
 * @returns 操作结果
 */
export async function addAdminRole(userId: string) {
    const response = await $fetch('/api/admin/sync-admin-role', {
        method: 'POST',
        body: {
            userId,
            action: 'add',
        },
    })
    return response
}

/**
 * 为用户移除管理员角色
 * @param userId 用户ID
 * @returns 操作结果
 */
export async function removeAdminRole(userId: string) {
    const response = await $fetch('/api/admin/sync-admin-role', {
        method: 'POST',
        body: {
            userId,
            action: 'remove',
        },
    })
    return response
}

/**
 * 批量同步用户的管理员角色
 * @param userIds 用户ID列表
 * @returns 操作结果列表
 */
export async function batchSyncAdminRole(userIds: string[]) {
    const results = await Promise.allSettled(
        userIds.map((userId) => syncAdminRole(userId)),
    )

    return results.map((result, index) => ({
        userId: userIds[index],
        success: result.status === 'fulfilled' && result.value.success,
        message: result.status === 'fulfilled' ? result.value.message : String(result.reason),
    }))
}
