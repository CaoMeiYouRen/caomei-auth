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

    const roleOptions = [
        { label: '用户', value: 'user' },
        { label: '管理员', value: 'admin' },
    ]

    const statusOptions = [
        { label: '正常', value: 'active' },
        { label: '已禁用', value: 'banned' },
    ]

    const formatDate = (date: string | Date) => {
        if (!date) {
            return '-'
        }
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
        formatDate,
        roleOptions,
        statusOptions,
    }
}
