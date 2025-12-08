import { useToast } from 'primevue/usetoast'

export function useClipboard() {
    const toast = useToast()

    const copy = async (text: string, successMessage = '已复制到剪贴板') => {
        if (!navigator?.clipboard) {
            toast.add({ severity: 'warn', summary: '无法复制', detail: '当前环境不支持剪贴板操作', life: 3000 })
            return false
        }
        try {
            await navigator.clipboard.writeText(text)
            toast.add({ severity: 'success', summary: '复制成功', detail: successMessage, life: 2000 })
            return true
        } catch (error) {
            console.error('Copy failed', error)
            toast.add({ severity: 'error', summary: '复制失败', detail: '无法访问剪贴板', life: 2000 })
            return false
        }
    }

    return { copy }
}
