import { validateEmail } from '@/utils/shared/validate'

/**
 * Admin 用户列表搜索条件（better-auth admin `listUsers` query）。
 *
 * `filterField` 用于「从登录事件按用户 ID 直达」：只有显式 userId 参数或搜索框仍为该 ID 时
 * 才走 id 等值过滤，普通姓名 / 邮箱 / @用户名搜索语义保持不变。
 */
export interface AdminUserSearchQuery {
    searchField?: 'email' | 'name'
    searchValue?: string
    searchOperator?: 'contains'
    filterField?: 'id'
    filterValue?: string
    filterOperator?: 'eq'
}

export function buildAdminUserSearchQuery(
    searchQuery: string | null | undefined,
    pinnedUserId?: string | null,
): AdminUserSearchQuery {
    const value = searchQuery?.trim() ?? ''
    const pinnedId = pinnedUserId?.trim() ?? ''

    if (pinnedId && value === pinnedId) {
        return { filterField: 'id', filterValue: pinnedId, filterOperator: 'eq' }
    }
    if (!value) {
        return {}
    }
    if (value.startsWith('@')) {
        return { searchField: 'name', searchValue: value.slice(1), searchOperator: 'contains' }
    }
    if (validateEmail(value)) {
        return { searchField: 'email', searchValue: value, searchOperator: 'contains' }
    }
    return { searchField: 'name', searchValue: value, searchOperator: 'contains' }
}
