import { useConfirm } from 'primevue/useconfirm'

export function useConfirmAction() {
    const confirm = useConfirm()

    const requireDelete = (message: string, onAccept: () => void | Promise<void>) => {
        confirm.require({
            message,
            header: '确认删除',
            icon: 'mdi mdi-alert-circle',
            rejectLabel: '取消',
            acceptLabel: '删除',
            rejectClass: 'p-button-secondary p-button-outlined',
            acceptClass: 'p-button-danger',
            accept: onAccept,
        })
    }

    const requireLogout = (onAccept: () => void | Promise<void>) => {
        confirm.require({
            message: '确定要退出登录吗？退出后需要重新登录才能访问您的账户。',
            header: '确认退出',
            icon: 'mdi mdi-logout',
            rejectLabel: '取消',
            acceptLabel: '退出',
            rejectClass: 'p-button-secondary p-button-outlined',
            acceptClass: 'p-button-primary',
            accept: onAccept,
        })
    }

    // 通用确认
    const requireConfirm = (options: {
        message: string
        header?: string
        icon?: string
        acceptLabel?: string
        acceptClass?: string
        onAccept: () => void | Promise<void>
    }) => {
        confirm.require({
            header: '确认操作',
            icon: 'mdi mdi-help-circle',
            rejectLabel: '取消',
            rejectClass: 'p-button-secondary p-button-outlined',
            ...options,
            accept: options.onAccept,
        })
    }

    return { requireDelete, requireLogout, requireConfirm }
}
