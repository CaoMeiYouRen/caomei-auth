export function useUserTable() {
    // 排序字段映射（前端 field -> 后端 field）
    const getSortField = (field: string) => {
        const fieldMap: Record<string, string> = {
            name: 'name',
            role: 'role',
            banned: 'banned',
            createdAt: 'createdAt',
            email: 'email',
            username: 'username',
        }
        return fieldMap[field] || field
    }

    // 获取排序字段的中文标签
    const getSortFieldLabel = (field: string) => {
        const labelMap: Record<string, string> = {
            name: '姓名',
            role: '角色',
            banned: '状态',
            createdAt: '注册时间',
            email: '邮箱',
            username: '用户名',
        }
        return labelMap[field] || field
    }

    const getRoleLabel = (role: string) => {
        const roleMap: Record<string, string> = {
            user: '用户',
            admin: '管理员',
        }
        return roleMap[role] || role
    }

    const getRoleSeverity = (role: string) => {
        const severityMap: Record<string, string> = {
            user: 'info',
            admin: 'danger',
        }
        return severityMap[role] || 'secondary'
    }

    const roleOptions = [
        { label: '用户', value: 'user' },
        { label: '管理员', value: 'admin' },
    ]

    const statusOptions = [
        { label: '正常', value: 'active' },
        { label: '已禁用', value: 'banned' },
    ]

    const getStatusLabel = (banned: boolean) => banned ? '已禁用' : '正常'

    const getStatusSeverity = (banned: boolean) => banned ? 'danger' : 'success'

    const formatDate = (date: string | Date) => {
        if (!date) { return '-' }
        return new Date(date).toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return {
        getSortField,
        getSortFieldLabel,
        getRoleLabel,
        getRoleSeverity,
        getStatusLabel,
        getStatusSeverity,
        formatDate,
        roleOptions,
        statusOptions,
    }
}
