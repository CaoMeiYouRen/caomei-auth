import { computed, ref, type Ref } from 'vue'
import { useNuxtApp } from '#app'
import { formatDateTimeLocale } from '@/utils/shared/date'
import { useI18nText } from '@/composables/utils/use-i18n-text'

/** 当前 UI 语言（响应式）；脱离 Nuxt 上下文时回退 zh-CN。 */
function resolveLocale(): Ref<string> {
    try {
        return useNuxtApp().$i18n.locale
    } catch {
        return ref('zh-CN')
    }
}

export function useUserTable() {
    const t = useI18nText()
    const locale = resolveLocale()

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

    // 排序字段的可读标签
    const getSortFieldLabel = (field: string) => {
        const labelKeys: Record<string, string> = {
            name: 'admin.users.page.sortFields.name',
            role: 'admin.users.page.sortFields.role',
            banned: 'admin.users.page.sortFields.banned',
            createdAt: 'admin.users.page.sortFields.createdAt',
            email: 'admin.users.page.sortFields.email',
            username: 'admin.users.page.sortFields.username',
        }
        const key = labelKeys[field]
        return key ? t(key) : field
    }

    const roleOptions = computed(() => [
        { label: t('common.status.role.user'), value: 'user' },
        { label: t('common.status.role.admin'), value: 'admin' },
    ])

    const statusOptions = computed(() => [
        { label: t('common.status.normal'), value: 'active' },
        { label: t('common.status.banned'), value: 'banned' },
    ])

    // 日期按当前语言格式化（zh / en 的时间顺序不同）
    const formatDate = (date: string | Date) => {
        if (!date) {
            return '-'
        }
        return formatDateTimeLocale(date, locale.value || 'zh-CN')
    }

    const getRoleLabel = (role: string) => {
        const keys: Record<string, string> = {
            user: 'common.status.role.user',
            admin: 'common.status.role.admin',
        }
        const key = keys[role]
        return key ? t(key) : role
    }

    const getRoleSeverity = (role: string) => {
        const map: Record<string, string> = {
            user: 'info',
            admin: 'danger',
        }
        return map[role] || 'info'
    }

    return {
        getSortField,
        getSortFieldLabel,
        formatDate,
        roleOptions,
        statusOptions,
        getRoleLabel,
        getRoleSeverity,
    }
}
