import { computed, onScopeDispose, ref, type Ref } from 'vue'

/**
 * 换邮箱流程的客户端状态（阶段 10 M5.2）。
 *
 * 与页面解耦：组件可注入 `api` 便于单测；默认实现走 Nuxt `$fetch`。
 * 倒计时只用于展示，服务端以 `resolveRequestState` 为准。
 */

export type ChannelChangeState = 'none' | 'pending' | 'confirmed' | 'expired' | 'cancelled'

export interface ChannelChangeStatus {
    state: ChannelChangeState
    requestId?: string
    maskedTarget?: string
    createdAt?: string
    scheduledAt?: string | null
    cancelledAt?: string | null
    remainingMs?: number | null
    proofFactor?: string | null
}

export interface ChannelChangeRequestPayload {
    newEmail: string
    password: string
    factor: 'recovery-code' | 'phone-otp' | 'totp' | 'backup-code'
    code: string
}

export interface ChannelChangeRequestResult {
    requestId: string
    maskedTarget: string
    factor: string
    requiresVerify: boolean
}

export interface ChannelChangeConfirmResult {
    status: 'pending'
    scheduledAt: string
    remainingMs: number
    coolingOffHours: number
}

export interface ChannelChangeApi {
    status: () => Promise<ChannelChangeStatus>
    request: (payload: ChannelChangeRequestPayload) => Promise<ChannelChangeRequestResult>
    confirm: (code: string) => Promise<ChannelChangeConfirmResult>
    cancel: () => Promise<{ state: string }>
    sendProofOtp: () => Promise<{ channel: string, expiresInSeconds: number }>
}

interface ApiEnvelope<T> { status: boolean, data: T }

/** 默认实现：Nuxt `$fetch`（同源、携带 Cookie） */
export function createChannelChangeApi(): ChannelChangeApi {
    return {
        status: async () => (await $fetch<ApiEnvelope<ChannelChangeStatus>>('/api/security/email/change-with-proof')).data,
        request: async (payload) => (await $fetch<ApiEnvelope<ChannelChangeRequestResult>>('/api/security/email/change-with-proof', {
            method: 'POST',
            body: payload,
        })).data,
        confirm: async (code) => (await $fetch<ApiEnvelope<ChannelChangeConfirmResult>>('/api/security/email/change-with-proof/confirm', {
            method: 'POST',
            body: { code },
        })).data,
        cancel: async () => (await $fetch<ApiEnvelope<{ state: string }>>('/api/security/email/change-with-proof/cancel', {
            method: 'POST',
        })).data,
        sendProofOtp: async () => (await $fetch<ApiEnvelope<{ channel: string, expiresInSeconds: number }>>('/api/security/proof-otp', {
            method: 'POST',
        })).data,
    }
}

/** 剩余毫秒拆成小时 / 分钟（向上取整到分钟） */
export function splitRemainingMs(ms: number): { hours: number, minutes: number } {
    const total = Math.max(0, Math.ceil(ms / 60000))
    return { hours: Math.floor(total / 60), minutes: total % 60 }
}

export function useChannelChange(options: { api?: ChannelChangeApi } = {}) {
    const api = options.api ?? createChannelChangeApi()
    const status: Ref<ChannelChangeStatus> = ref({ state: 'none' })
    const loading = ref(false)
    const submitting = ref(false)
    const remainingMs = ref(0)
    let timer: ReturnType<typeof setInterval> | null = null

    const isPending = computed(() => status.value.state === 'pending')
    const isConfirmed = computed(() => status.value.state === 'confirmed')
    const canCancel = computed(() => isPending.value && remainingMs.value > 0)

    function stopCountdown(): void {
        if (timer) {
            clearInterval(timer)
            timer = null
        }
    }

    function startCountdown(): void {
        stopCountdown()
        if (!isPending.value || remainingMs.value <= 0) {
            return
        }
        timer = setInterval(() => {
            remainingMs.value = Math.max(0, remainingMs.value - 1000)
            if (remainingMs.value === 0) {
                stopCountdown()
            }
        }, 1000)
    }

    function applyStatus(next: ChannelChangeStatus): void {
        status.value = next
        remainingMs.value = Math.max(0, Number(next.remainingMs ?? 0))
        startCountdown()
    }

    async function refresh(): Promise<void> {
        loading.value = true
        try {
            applyStatus(await api.status())
        } finally {
            loading.value = false
        }
    }

    async function requestChange(payload: ChannelChangeRequestPayload): Promise<ChannelChangeRequestResult> {
        submitting.value = true
        try {
            return await api.request(payload)
        } finally {
            submitting.value = false
        }
    }

    async function confirmOwnership(code: string): Promise<ChannelChangeConfirmResult> {
        submitting.value = true
        try {
            const result = await api.confirm(code)
            await refresh()
            return result
        } finally {
            submitting.value = false
        }
    }

    async function cancel(): Promise<void> {
        submitting.value = true
        try {
            await api.cancel()
            await refresh()
        } finally {
            submitting.value = false
        }
    }

    async function sendProofOtp(): Promise<{ channel: string, expiresInSeconds: number }> {
        return api.sendProofOtp()
    }

    onScopeDispose(stopCountdown)

    return {
        status,
        loading,
        submitting,
        remainingMs,
        isPending,
        isConfirmed,
        canCancel,
        refresh,
        requestChange,
        confirmOwnership,
        cancel,
        sendProofOtp,
        stopCountdown,
    }
}
