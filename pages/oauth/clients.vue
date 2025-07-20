# coding=utf-8
<template>
    <div class="oauth-clients">
        <div class="clients-container">
            <div class="clients-header">
                <h1 class="clients-title">
                    应用管理
                </h1>
                <p class="clients-subtitle">
                    管理您的 OAuth 2.0 应用
                </p>
                <Button
                    label="创建应用"
                    icon="mdi mdi-plus"
                    @click="showCreateDialog = true"
                />
            </div>
            <div class="clients-list">
                <DataTable
                    :value="applications"
                    :paginator="true"
                    :rows="10"
                    :loading="loading"
                >
                    <Column field="name" header="应用名称">
                        <template #body="{data}">
                            <div class="application-info">
                                <img
                                    v-if="data.image"
                                    :src="data.image"
                                    :alt="data.name"
                                    class="application-logo"
                                >
                                <span class="application-name">{{ data.name }}</span>
                            </div>
                        </template>
                    </Column>
                    <Column field="clientId" header="Client ID" />
                    <Column field="createdAt" header="创建时间">
                        <template #body="{data}">
                            {{ new Date(data.createdAt).toLocaleString() }}
                        </template>
                    </Column>
                    <Column header="操作">
                        <template #body="{data}">
                            <!-- <Button
                                icon="mdi mdi-pencil"
                                class="p-button-text"
                                @click="editApplication(data)"
                            /> -->
                            <Button
                                icon="mdi mdi-delete"
                                class="p-button-danger p-button-text"
                                @click="deleteApplication(data)"
                            />
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- 创建应用对话框 -->
        <Dialog
            v-model:visible="showCreateDialog"
            :header="editing ? '编辑应用' : '创建应用'"
            :modal="true"
            class="create-dialog"
        >
            <form @submit.prevent="submitApplication">
                <div class="form-group">
                    <label for="name">应用名称</label>
                    <InputText
                        id="name"
                        v-model="formData.name"
                        required
                        class="w-full"
                    />
                </div>
                <div class="form-group">
                    <label for="description">应用简介</label>
                    <Textarea
                        id="description"
                        v-model="formData.description"
                        rows="3"
                        class="w-full"
                    />
                </div>
                <div class="form-group">
                    <label for="redirectURLs">重定向 URL</label>
                    <Chips
                        id="redirectURLs"
                        v-model="formData.redirectURLs"
                        separator=","
                        class="w-full"
                    />
                    <small class="helper-text">多个URL请用逗号分隔</small>
                </div>
            </form>
            <template #footer>
                <Button
                    label="取消"
                    class="p-button-text"
                    @click="showCreateDialog = false"
                />
                <Button
                    :label="editing ? '保存' : '创建'"
                    :loading="submitting"
                    @click="submitApplication"
                />
            </template>
        </Dialog>

        <!-- 确认删除对话框 -->
        <Dialog
            v-model:visible="showDeleteDialog"
            header="确认删除"
            :modal="true"
            class="delete-dialog"
        >
            <p>确定要删除应用 "{{ selectedApp?.name }}" 吗？此操作无法撤销。</p>
            <template #footer>
                <Button
                    label="取消"
                    class="p-button-text"
                    @click="showDeleteDialog = false"
                />
                <Button
                    label="删除"
                    severity="danger"
                    :loading="deleting"
                    @click="confirmDelete"
                />
            </template>
        </Dialog>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import { authClient } from '@/lib/auth-client'

const toast = useToast()

const applications = ref<any[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const editing = ref(false)
const submitting = ref(false)
const deleting = ref(false)
const selectedApp = ref<any>(null)

const formData = ref({
    name: '',
    description: '',
    redirectURLs: [] as string[],
})

const applicationsResponse = await useFetch('/api/oauth/applications', {})
applications.value = applicationsResponse.data.value?.data || []

async function loadApplications() {
    try {
        loading.value = true
        await applicationsResponse.refresh()
        applications.value = applicationsResponse.data.value?.data || []
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '获取应用列表失败',
            life: 3000,
        })
    } finally {
        loading.value = false
    }
}

function editApplication(app: any) {
    editing.value = true
    selectedApp.value = app
    formData.value = {
        name: app.name,
        description: app.description || '',
        redirectURLs: app.redirectURLs.split(','),
    }
    showCreateDialog.value = true
}

async function submitApplication() {
    try {
        submitting.value = true

        const redirectURLs = formData.value.redirectURLs
        const payload = {
            client_name: formData.value.name,
            description: formData.value.description,
            redirect_uris: redirectURLs,
        }

        const { data, error } = await authClient.oauth2.register(payload)

        if (error) {
            throw new Error(error.message)
        }

        toast.add({
            severity: 'success',
            summary: '成功',
            detail: editing.value ? '应用更新成功' : '应用创建成功',
            life: 3000,
        })

        showCreateDialog.value = false
        await loadApplications()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '操作失败',
            life: 3000,
        })
    } finally {
        submitting.value = false
    }
}

function deleteApplication(app: any) {
    selectedApp.value = app
    showDeleteDialog.value = true
}

async function confirmDelete() {
    try {
        deleting.value = true

        // const { error } = await authClient.oauth2.deleteApplication({
        //     clientId: selectedApp.value.clientId,
        // })

        // if (error) {
        //     throw new Error(error.message)
        // }

        toast.add({
            severity: 'success',
            summary: '成功',
            detail: '应用删除成功',
            life: 3000,
        })

        showDeleteDialog.value = false
        await loadApplications()
    } catch (error: any) {
        toast.add({
            severity: 'error',
            summary: '错误',
            detail: error.message || '删除失败',
            life: 3000,
        })
    } finally {
        deleting.value = false
    }
}
</script>

<style lang="scss" scoped>
.oauth-clients {
    padding: 2rem;
    background-color: var(--surface-ground);

    .clients-container {
        background: var(--surface-card);
        border-radius: 1rem;
        padding: 2rem;
        box-shadow: var(--card-shadow);
    }

    .clients-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2rem;

        .clients-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
        }
    }

    .clients-list {
        .application-info {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .application-logo {
                width: 32px;
                height: 32px;
                border-radius: 4px;
                object-fit: cover;
            }
        }
    }
}

.create-dialog {
    .form-group {
        margin-bottom: 1.5rem;

        label {
            display: block;
            margin-bottom: 0.5rem;
            color: var(--text-color-secondary);
        }

        .helper-text {
            display: block;
            margin-top: 0.25rem;
            color: var(--text-color-secondary);
        }
    }
}
</style>
