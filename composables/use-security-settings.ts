import { ref, computed, onMounted, type Ref } from 'vue'
import { useToast } from 'caomei-ui'
import type { Prettify } from 'better-auth'
import { authClient } from '@/lib/auth-client'
import { generateQRCode } from '@/utils/shared/qrcode'
import { getBrowser, getOs } from '@/utils/shared/useragent'
import { formatDateLocale } from '@/utils/shared/date'
import { useI18nText } from '@/composables/utils/use-i18n-text'

/** 当前 UI 语言（响应式，`Composer.locale` 本身即 ref）；脱离 Nuxt 上下文时回退 zh-CN。 */
function resolveLocale(): Ref<string> {
    try {
        return useNuxtApp().$i18n.locale
    } catch {
        return ref('zh-CN')
    }
}

export function useSecuritySettings() {
    const toast = useToast()
    const t = useI18nText()
    const locale = resolveLocale()
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
    // 日期按当前语言格式化（zh-CN / en-US 的日期与时间顺序不同）
    const sessionList = computed(() => sessions.value.map((s) => ({
        ...s,
        createdAt: formatDateLocale(s.createdAt, locale.value || 'zh-CN'),
        updatedAt: formatDateLocale(s.updatedAt, locale.value || 'zh-CN'),
        expiresAt: formatDateLocale(s.expiresAt, locale.value || 'zh-CN'),
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
                method: 'totp',
            })

            if (error) {
                throw new Error(error.message || t('security.flow.setupFailed'))
            }

            // 1.7 起 enableTwoFactor 返回按 method 区分的联合类型，仅在 totp 分支包含密钥与备份码
            if (!data || data.method !== 'totp') {
                throw new Error(t('security.flow.totpMissing'))
            }

            totpUri.value = data.totpURI
            qrCodeUrl.value = await generateQRCode(data.totpURI)
            backupCodes.value = data.backupCodes

            showTotpSetup.value = true

            toast.info({ title: t('security.flow.hintTitle'), description: t('security.flow.scanQr'), duration: 5000 })
        } catch (error: any) {
            toast.danger({
                title: t('security.flow.errorTitle'),
                description: t('security.flow.setupFailedDetail', { message: error.message || t('security.flow.unknownError') }),
                duration: 3000,
            })
        }
    }

    const confirmDisable2FA = async () => {
        try {
            const { error } = await authClient.twoFactor.disable({
                password: password.value,
            })

            if (error) {
                throw new Error(error.message || t('security.flow.disableFailed'))
            }

            showPasswordDialog.value = false
            toast.success({ title: t('security.flow.successTitle'), description: t('security.flow.disableSuccess'), duration: 3000 })
        } catch (error: any) {
            toast.danger({
                title: t('security.flow.errorTitle'),
                description: t('security.flow.disableFailedDetail', { message: error.message || t('security.flow.unknownError') }),
                duration: 3000,
            })
        }
    }

    const onPasswordConfirm = async () => {
        if (!password.value) {
            toast.warning({ title: t('security.flow.warningTitle'), description: t('security.flow.passwordRequired'), duration: 3000 })
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
                toast.warning({ title: t('security.flow.warningTitle'), description: t('security.flow.codeRequired'), duration: 3000 })
                return
            }

            const { error } = await authClient.twoFactor.verifyTotp({
                code: verificationCode.value,
            })

            if (error) {
                throw new Error(error.message || t('security.flow.verifyFailed'))
            }

            showTotpSetup.value = false
            showBackupCodes.value = true

            toast.success({ title: t('security.flow.successTitle'), description: t('security.flow.enabledSuccess'), duration: 5000 })
        } catch (error: any) {
            toast.danger({
                title: t('security.flow.errorTitle'),
                description: t('security.flow.verifyFailedDetail', { message: error.message || t('security.flow.unknownError') }),
                duration: 3000,
            })
        }
    }

    const copyBackupCodes = () => {
        const codesText = backupCodes.value.join('\n')
        void navigator.clipboard.writeText(codesText)
        toast.success({ title: t('security.flow.successTitle'), description: t('security.flow.codesCopied'), duration: 3000 })
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
        toast.success({ title: t('security.flow.successTitle'), description: t('security.flow.codesDownloaded'), duration: 3000 })
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
            console.error('Failed to list sessions:', error)
        }
    }

    const revokeSession = async (token: string) => {
        try {
            await authClient.revokeSession({ token })
            await listSessions()
        } catch (error) {
            console.error('Failed to revoke session:', error)
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
            console.error('Failed to revoke other sessions:', error)
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
            void navigateTo('/login')
        } catch (error) {
            console.error('Failed to revoke all sessions:', error)
        }
    }

    const goProfile = () => {
        void navigateTo('/profile')
    }

    onMounted(() => {
        void listSessions()
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
