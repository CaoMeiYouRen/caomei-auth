import { ref, computed } from 'vue'
import { useToast } from 'primevue/usetoast'

export function useApplicationManagement() {
    const toast = useToast()
    const searchQuery = ref('')

    const { data: applicationsResponse, pending: loading, refresh: refreshApplications } = useFetch('/api/admin/oauth/applications', {
        default: () => ({ success: false, data: [] }),
        transform: (response: any) => response,
    })

    const applications = computed(() => (applicationsResponse.value?.success ? applicationsResponse.value.data : []))

    const filteredApplications = computed(() => {
        if (!searchQuery.value) {
            return applications.value
        }

        const query = searchQuery.value.toLowerCase()
        return applications.value.filter((app: any) => app.name?.toLowerCase().includes(query)
            || app.description?.toLowerCase().includes(query)
            || app.clientId?.toLowerCase().includes(query))
    })

    const handleRefreshApplications = () => {
        searchQuery.value = ''
        refreshApplications()
    }

    const toggleApplicationStatus = async (app: any) => {
        try {
            await $fetch(`/api/admin/oauth/applications/${app.id}`, {
                method: 'PUT',
                body: {
                    disabled: !app.disabled,
                },
            })

            toast.add({
                severity: 'success',
                summary: '成功',
                detail: `应用已${app.disabled ? '启用' : '禁用'}`,
                life: 3000,
            })

            await refreshApplications()
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: error.message || '操作失败',
                life: 3000,
            })
        }
    }

    const deleteApplication = async (id: string) => {
        try {
            await $fetch(`/api/admin/oauth/applications/${id}`, {
                method: 'DELETE',
            })

            toast.add({
                severity: 'success',
                summary: '删除成功',
                detail: '应用已删除',
                life: 3000,
            })

            await refreshApplications()
            return true
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '删除失败',
                detail: error.message || '删除失败',
                life: 3000,
            })
            return false
        }
    }

    return {
        loading,
        applications,
        filteredApplications,
        searchQuery,
        refreshApplications,
        handleRefreshApplications,
        toggleApplicationStatus,
        deleteApplication,
    }
}
