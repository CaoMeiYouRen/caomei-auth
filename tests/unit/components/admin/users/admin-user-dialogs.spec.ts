import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mockNuxtImport } from '@nuxt/test-utils/runtime'
import { useI18nText } from '@/tests/mocks/i18n-text'
import BanUserDialog from '@/components/admin/users/ban-user-dialog.vue'
import CreateUserDialog from '@/components/admin/users/create-user-dialog.vue'
import UserDetailDialog from '@/components/admin/users/user-detail-dialog.vue'
import UserSessionsDialog from '@/components/admin/users/user-sessions-dialog.vue'
import type { AdminUserProfile } from '@/types/admin'

interface AuthResponse {
    data?: unknown
    error?: { message?: string } | null
}

const { toast, confirmOpen, banUser, createUser, listUserSessions, revokeUserSessions, revokeUserSession } = vi.hoisted(() => ({
    toast: { success: vi.fn(), danger: vi.fn() },
    confirmOpen: vi.fn(async () => true),
    banUser: vi.fn(async (): Promise<AuthResponse> => ({ data: {} })),
    createUser: vi.fn(async (): Promise<AuthResponse> => ({ data: {} })),
    listUserSessions: vi.fn(async (): Promise<AuthResponse> => ({ data: { sessions: [] } })),
    revokeUserSessions: vi.fn(async (): Promise<AuthResponse> => ({ data: {} })),
    revokeUserSession: vi.fn(async (): Promise<AuthResponse> => ({ data: {} })),
}))

vi.mock('caomei-ui', async (importOriginal) => {
    const actual = await importOriginal<typeof import('caomei-ui')>()
    return {
        ...actual,
        useToast: () => toast,
        useConfirm: () => ({ open: confirmOpen }),
    }
})

vi.mock('@/lib/auth-client', () => ({
    authClient: {
        admin: {
            banUser,
            createUser,
            listUserSessions,
            revokeUserSessions,
            revokeUserSession,
        },
        useSession: () => ({ value: { data: null } }),
    },
}))

vi.mock('@/composables/admin/use-user-table', () => ({
    useUserTable: () => ({ roleOptions: [{ label: '用户', value: 'user' }, { label: '管理员', value: 'admin' }] }),
}))

mockNuxtImport('useI18n', () => () => ({ t: useI18nText(), locale: { value: 'zh-CN' } }))

const ButtonStub = {
    props: ['label'],
    emits: ['click'],
    template: '<button v-bind="$attrs" @click="$emit(\'click\')"><slot /></button>',
}

const DialogStub = {
    template: '<div><slot /></div>',
}

const DataTableStub = {
    props: ['data'],
    template: '<div><div v-for="row in data" :key="row.token"><slot name="cell-actions" :row="row" /></div></div>',
}

const mountOptions = {
    global: {
        renderStubDefaultSlot: true,
        stubs: {
            BaseDialogV2: DialogStub,
            CaomeiButton: ButtonStub,
            CaomeiDataTable: DataTableStub,
        },
    },
}

const user: AdminUserProfile = {
    id: 'user-1',
    name: '测试用户',
    email: 'user@example.com',
    role: 'user',
    banned: false,
    emailVerified: true,
    createdAt: '2026-01-01T00:00:00',
} as unknown as AdminUserProfile

function findButtonByText(wrapper: ReturnType<typeof mount>, text: string) {
    return wrapper.findAll('button').find((button) => button.text().includes(text))
}

describe('admin 用户对话框', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        confirmOpen.mockResolvedValue(true)
    })

    it('封禁时长 0 换算为永久（banExpiresIn 为 undefined）', async () => {
        const wrapper = mount(BanUserDialog, {
            props: { visible: true, user },
            ...mountOptions,
        })

        await wrapper.setProps({ visible: false })
        await wrapper.setProps({ visible: true })
        const submit = findButtonByText(wrapper, '确认禁用')
        expect(submit).toBeTruthy()
        await submit!.trigger('click')
        await vi.waitFor(() => expect(banUser).toHaveBeenCalled())

        expect(banUser).toHaveBeenCalledWith({
            userId: 'user-1',
            banReason: undefined,
            banExpiresIn: undefined,
        })
    })

    it('详情对话框对当前用户展示不可操作状态', () => {
        const wrapper = mount(UserDetailDialog, {
            props: { visible: true, user: { ...user, role: 'admin' } as unknown as AdminUserProfile, currentUserId: 'user-1' },
            ...mountOptions,
        })

        expect(wrapper.text()).toContain('不能移除自己的管理员权限')
        expect(wrapper.text()).toContain('不能操作自己的账户')
        expect(findButtonByText(wrapper, '禁用用户')).toBeUndefined()
    })

    it('会话对话框撤销全部会调用接口并关闭对话框', async () => {
        const wrapper = mount(UserSessionsDialog, {
            props: { visible: false, user },
            ...mountOptions,
        })

        await wrapper.setProps({ visible: true })
        await vi.waitFor(() => expect(listUserSessions).toHaveBeenCalled())
        const revokeAll = findButtonByText(wrapper, '撤销所有会话')
        expect(revokeAll).toBeTruthy()
        await revokeAll!.trigger('click')
        await vi.waitFor(() => expect(revokeUserSessions).toHaveBeenCalled())

        expect(confirmOpen).toHaveBeenCalled()
        expect(revokeUserSessions).toHaveBeenCalledWith({ userId: 'user-1' })
        expect(wrapper.emitted('update:visible')?.at(-1)).toEqual([false])
    })

    it('封禁失败时弹出错误提示且不误报成功', async () => {
        banUser.mockResolvedValueOnce({ error: { message: '目标用户不存在' } })
        const wrapper = mount(BanUserDialog, {
            props: { visible: true, user },
            ...mountOptions,
        })

        await findButtonByText(wrapper, '确认禁用')!.trigger('click')
        await vi.waitFor(() => expect(banUser).toHaveBeenCalled())

        expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '目标用户不存在' }))
        expect(toast.success).not.toHaveBeenCalled()
        expect(wrapper.emitted('banned')).toBeUndefined()
        expect(wrapper.emitted('update:visible')).toBeUndefined()
    })

    it('创建用户成功时提示并通知父组件', async () => {
        const wrapper = mount(CreateUserDialog, {
            props: { visible: true },
            ...mountOptions,
        })

        await wrapper.find('#createName').setValue('新用户')
        await wrapper.find('#createEmail').setValue('new-user@example.com')
        await wrapper.find('#createPassword').setValue('secret123')
        await wrapper.find('form').trigger('submit')
        await vi.waitFor(() => expect(createUser).toHaveBeenCalled())

        expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ email: 'new-user@example.com', role: 'user' }))
        expect(toast.success).toHaveBeenCalled()
        expect(wrapper.emitted('created')).toEqual([[]])
    })

    it('创建用户失败时弹出错误提示且不误报成功', async () => {
        createUser.mockResolvedValueOnce({ error: { message: '邮箱已被占用' } })
        const wrapper = mount(CreateUserDialog, {
            props: { visible: true },
            ...mountOptions,
        })

        await wrapper.find('#createName').setValue('新用户')
        await wrapper.find('#createEmail').setValue('new-user@example.com')
        await wrapper.find('#createPassword').setValue('secret123')
        await wrapper.find('form').trigger('submit')
        await vi.waitFor(() => expect(createUser).toHaveBeenCalled())

        expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '邮箱已被占用' }))
        expect(toast.success).not.toHaveBeenCalled()
        expect(wrapper.emitted('created')).toBeUndefined()
    })

    it('撤销单个会话失败时弹出错误提示且不误报成功', async () => {
        listUserSessions.mockResolvedValueOnce({ data: { sessions: [{ token: 'token-1' }] } })
        revokeUserSession.mockResolvedValueOnce({ error: { message: '会话不存在' } })
        const wrapper = mount(UserSessionsDialog, {
            props: { visible: false, user },
            ...mountOptions,
        })

        await wrapper.setProps({ visible: true })
        await vi.waitFor(() => expect(listUserSessions).toHaveBeenCalled())
        const revokeButton = wrapper.findAll('button').find((button) => button.text().trim() === '撤销')
        expect(revokeButton).toBeTruthy()
        await revokeButton!.trigger('click')
        await vi.waitFor(() => expect(revokeUserSession).toHaveBeenCalledWith({ sessionToken: 'token-1' }))

        expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '会话不存在' }))
        expect(toast.success).not.toHaveBeenCalled()
    })

    it('撤销全部会话失败时弹出错误提示且不关闭对话框', async () => {
        revokeUserSessions.mockResolvedValueOnce({ error: { message: '无权限撤销' } })
        const wrapper = mount(UserSessionsDialog, {
            props: { visible: false, user },
            ...mountOptions,
        })

        await wrapper.setProps({ visible: true })
        await vi.waitFor(() => expect(listUserSessions).toHaveBeenCalled())
        await findButtonByText(wrapper, '撤销所有会话')!.trigger('click')
        await vi.waitFor(() => expect(revokeUserSessions).toHaveBeenCalled())

        expect(toast.danger).toHaveBeenCalledWith(expect.objectContaining({ description: '无权限撤销' }))
        expect(toast.success).not.toHaveBeenCalled()
        expect(wrapper.emitted('update:visible')).toBeUndefined()
    })
})
