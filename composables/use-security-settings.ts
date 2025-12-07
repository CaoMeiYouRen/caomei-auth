import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import dayjs from 'dayjs'
import type { Prettify } from 'better-auth'
import { authClient } from '@/lib/auth-client'
import { generateQRCode } from '@/utils/qrcode'
import { getBrowser, getOs } from '@/utils/useragent'

export function useSecuritySettings() {
    const toast = useToast()
    const session = authClient.useSession()
    const userSession = computed(() => session.value?.data)

    // --- 2FA State ---
    const showTotpSetup = ref(false)
    const showBackupCodes = ref(false)
    const totpUri = ref('')
    const qrCodeUrl = ref('')
    const verificationCode = ref('')
    const backupCodes = ref<string[]>([])
    const password = ref('')
    const showPasswordDialog = ref(false)
    const passwordDialogMode = ref<'enable' | 'disable'>('enable')

    // --- Session State ---
    const sessions = ref<Prettify<{
        token: string
        expiresAt: Date
        id: string
        createdAt: Date
        updatedAt: Date
        userId: string
        ipAddress?: string | null | undefined
        userAgent?: string | null | undefined
    }>[]>([])

    const showRevokeSessionConfirm = ref(false)
    const selectedSessionToken = ref('')
    const showRevokeOtherSessionsConfirm = ref(false)
    const showRevokeAllSessionsConfirm = ref(false)

    // --- Computed ---
    const sessionList = computed(() => sessions.value.map((s) => ({
        ...s,
        createdAt: dayjs(s.createdAt).format('YYYY-MM-DD HH:mm:ss'),
        updatedAt: dayjs(s.updatedAt).format('YYYY-MM-DD HH:mm:ss'),
        expiresAt: dayjs(s.expiresAt).format('YYYY-MM-DD HH:mm:ss'),
        browser: getBrowser(s.userAgent || ''),
        os: getOs(s.userAgent || ''),
    })))

    // --- 2FA Actions ---

    const onPasswordDialogHide = () => {
        password.value = ''
    }

    const enable2FA = () => {
        passwordDialogMode.value = 'enable'
        showPasswordDialog.value = true
    }

    const disable2FA = () => {
        passwordDialogMode.value = 'disable'
        showPasswordDialog.value = true
    }

    const confirmPassword = async () => {
        try {
            showPasswordDialog.value = false

            const { data, error } = await authClient.twoFactor.enable({
                password: password.value,
            })

            if (error) {
                throw error
            }

            totpUri.value = data.totpURI
            qrCodeUrl.value = await generateQRCode(data.totpURI)
            backupCodes.value = data.backupCodes

            showTotpSetup.value = true

            toast.add({
                severity: 'info',
                summary: '提示',
                detail: '请使用身份验证器应用扫描二维码',
                life: 5000,
            })
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: `设置失败：${error.message || '未知错误'}`,
                life: 3000,
            })
        }
    }

    const confirmDisable2FA = async () => {
        try {
            const { error } = await authClient.twoFactor.disable({
                password: password.value,
            })

            if (error) {
                throw error
            }

            showPasswordDialog.value = false
            toast.add({
                severity: 'success',
                summary: '成功',
                detail: '双因素认证已成功禁用',
                life: 3000,
            })
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: `禁用失败：${error.message || '未知错误'}`,
                life: 3000,
            })
        }
    }

    const onPasswordConfirm = async () => {
        if (!password.value) {
            toast.add({
                severity: 'warn',
                summary: '警告',
                detail: '请输入密码',
                life: 3000,
            })
            return
        }

        if (passwordDialogMode.value === 'enable') {
            await confirmPassword()
        } else {
            await confirmDisable2FA()
        }
    }

    const verifyAndEnable2FA = async () => {
        try {
            if (!verificationCode.value) {
                toast.add({
                    severity: 'warn',
                    summary: '警告',
                    detail: '请输入验证码',
                    life: 3000,
                })
                return
            }

            const { error } = await authClient.twoFactor.verifyTotp({
                code: verificationCode.value,
            })

            if (error) {
                throw error
            }

            showTotpSetup.value = false
            showBackupCodes.value = true

            toast.add({
                severity: 'success',
                summary: '成功',
                detail: '双因素认证已成功启用！请保存好备份码',
                life: 5000,
            })
        } catch (error: any) {
            toast.add({
                severity: 'error',
                summary: '错误',
                detail: `验证失败：${error.message || '未知错误'}`,
                life: 3000,
            })
        }
    }

    const copyBackupCodes = () => {
        const codesText = backupCodes.value.join('\n')
        navigator.clipboard.writeText(codesText)
        toast.add({
            severity: 'success',
            summary: '成功',
            detail: '备份码已复制到剪贴板',
            life: 3000,
        })
    }

    const downloadBackupCodes = () => {
        const codesText = backupCodes.value.join('\n')
        const blob = new Blob([codesText], { type: 'text/plain' })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${Date.now()}-2fa-backup-codes.txt`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.add({
            severity: 'success',
            summary: '成功',
            detail: '备份码已下载',
            life: 3000,
        })
    }

    const finishSetup = () => {
        showBackupCodes.value = false
        password.value = ''
        verificationCode.value = ''
        totpUri.value = ''
        qrCodeUrl.value = ''
        backupCodes.value = []
    }

    // --- Session Actions ---

    const listSessions = async () => {
        try {
            const response = await authClient.listSessions()
            sessions.value = response.data || []
        } catch (error) {
            console.error('获取会话列表失败:', error)
        }
    }

    const revokeSession = async (token: string) => {
        try {
            await authClient.revokeSession({ token })
            await listSessions()
        } catch (error) {
            console.error('撤销会话失败:', error)
        }
    }

    const confirmRevokeSession = (token: string) => {
        selectedSessionToken.value = token
        showRevokeSessionConfirm.value = true
    }

    const revokeSingleSession = async () => {
        await revokeSession(selectedSessionToken.value)
        showRevokeSessionConfirm.value = false
    }

    const confirmRevokeOtherSessions = () => {
        showRevokeOtherSessionsConfirm.value = true
    }

    const revokeOtherSessions = async () => {
        try {
            await authClient.revokeOtherSessions()
            await listSessions()
            showRevokeOtherSessionsConfirm.value = false
        } catch (error) {
            console.error('撤销其他会话失败:', error)
        }
    }

    const confirmRevokeAllSessions = () => {
        showRevokeAllSessionsConfirm.value = true
    }

    const revokeAllSessions = async () => {
        try {
            await authClient.revokeSessions()
            await listSessions()
            showRevokeAllSessionsConfirm.value = false
            navigateTo('/login')
        } catch (error) {
            console.error('撤销所有会话失败:', error)
        }
    }

    const goProfile = () => {
        navigateTo('/profile')
    }

    onMounted(() => {
        listSessions()
    })

    return {
        userSession,

        // 2FA State
        showTotpSetup,
        showBackupCodes,
        totpUri,
        qrCodeUrl,
        verificationCode,
        backupCodes,
        password,
        showPasswordDialog,
        passwordDialogMode,

        // 2FA Actions
        onPasswordDialogHide,
        onPasswordConfirm,
        enable2FA,
        disable2FA,
        verifyAndEnable2FA,
        copyBackupCodes,
        downloadBackupCodes,
        finishSetup,

        // Session State
        sessionList,
        showRevokeSessionConfirm,
        showRevokeOtherSessionsConfirm,
        showRevokeAllSessionsConfirm,

        // Session Actions
        confirmRevokeSession,
        revokeSingleSession,
        confirmRevokeOtherSessions,
        revokeOtherSessions,
        confirmRevokeAllSessions,
        revokeAllSessions,
        goProfile,
    }
}
