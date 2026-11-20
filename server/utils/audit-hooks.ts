import { requestAuditMeta, writeAuditEvent } from './audit-log'

/**
 * better-auth 生命周期回调中的审计接线。
 *
 * 独立成模块的原因：`lib/auth.ts` 在单测里难以实例化，把回调逻辑抽成纯函数后
 * 可以直接断言「哪条路径写了哪些字段」，同时避免在 auth 配置里散落日志细节。
 */

interface RequestLike {
    headers?: Headers | { get?: (name: string) => string | null }
}

interface UserLike {
    id?: string | null
    email?: string | null
}

type EndpointContextLike = { request?: RequestLike | null } | null | undefined

/** 邮箱 / 手机改绑请求（用户自助改邮箱、管理员发起改绑统一口径） */
export function auditChannelChangeRequested(input: {
    user: UserLike
    channel: 'email' | 'phone'
    newValue: string
    actorId?: string | null
    source?: 'web' | 'admin'
    request?: RequestLike | null
}): void {
    const meta = requestAuditMeta(input.request)
    writeAuditEvent({
        action: 'channel.change.request',
        actorId: input.actorId ?? input.user.id ?? null,
        targetUserId: input.user.id ?? null,
        before: input.channel === 'email' ? { email: input.user.email ?? null } : null,
        after: input.channel === 'email' ? { email: input.newValue } : { phone: input.newValue },
        source: input.source ?? 'web',
        ...meta,
    })
}

/** 用户自助改邮箱：better-auth `sendChangeEmailConfirmation` 回调 */
export function auditEmailChangeRequested(
    data: { user: UserLike, newEmail: string },
    request?: RequestLike | null,
): void {
    auditChannelChangeRequested({
        user: data.user,
        channel: 'email',
        newValue: data.newEmail,
        request,
    })
}

/** 手机号绑定 / 换绑：`callbackOnVerification` 回调 */
export function auditPhoneBound(
    data: { phoneNumber: string, user: UserLike },
    context?: EndpointContextLike,
): void {
    const meta = requestAuditMeta(context?.request)
    writeAuditEvent({
        action: 'phone.bind',
        actorId: data.user.id ?? null,
        targetUserId: data.user.id ?? null,
        after: { phone: data.phoneNumber },
        ...meta,
    })
}

/** 第三方账号绑定：`databaseHooks.account.create.after` */
export function auditSocialAccountLinked(
    account: { userId?: string | null, providerId?: string | null },
    context?: EndpointContextLike,
): void {
    const provider = account.providerId ?? ''
    /* credential / email-otp / phone-number 等非社交渠道不产生绑定事件 */
    if (!provider || NON_SOCIAL_PROVIDERS.has(provider)) {
        return
    }
    const meta = requestAuditMeta(context?.request)
    writeAuditEvent({
        action: 'social.bind',
        actorId: account.userId ?? null,
        targetUserId: account.userId ?? null,
        after: { provider },
        ...meta,
    })
}

const NON_SOCIAL_PROVIDERS = new Set(['credential', 'email-otp', 'phone-number', 'anonymous'])

/** 密码重置验证码请求（邮箱 / 短信） */
export function auditPasswordResetRequested(
    data: {
        email?: string | null
        phoneNumber?: string | null
        type?: string | null
        result?: 'success' | 'failure'
        reason?: string | null
    },
    context?: EndpointContextLike,
): void {
    if (data.type && data.type !== 'forget-password' && data.type !== 'reset-password') {
        return
    }
    const meta = requestAuditMeta(context?.request)
    writeAuditEvent({
        action: 'password.reset.request',
        targetUserId: null,
        after: data.phoneNumber ? { phone: data.phoneNumber } : { email: data.email ?? null },
        result: data.result ?? 'success',
        reason: data.reason ?? null,
        ...meta,
    })
}

/** 密码重置完成：`emailAndPassword.onPasswordReset` 回调 */
export function auditPasswordReset(data: { user: UserLike }, request?: RequestLike | null): void {
    const meta = requestAuditMeta(request)
    writeAuditEvent({
        action: 'password.reset',
        actorId: data.user.id ?? null,
        targetUserId: data.user.id ?? null,
        after: { passwordReset: true },
        ...meta,
    })
}
