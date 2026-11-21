import { writeAuditEvent } from './audit-log'
import { emailService } from './email/service'
import { maskEmail } from './privacy'

/**
 * 改绑生命周期通知（阶段 10 M3.2）。
 *
 * 申请 / 撤销 / 生效三类事件都通知旧邮箱；旧邮箱不可投递时回落到新邮箱，
 * 失败原因写入审计，不静默丢弃。
 */
export type ChannelChangeLifecycleEvent = 'request' | 'cancel' | 'apply'

const EVENT_LABEL: Record<ChannelChangeLifecycleEvent, string> = {
    request: 'change requested',
    cancel: 'change cancelled',
    apply: 'change effective',
}

export async function notifyChannelChangeLifecycle(input: {
    userId: string
    event: ChannelChangeLifecycleEvent
    oldEmail: string | null
    newEmail: string
}): Promise<boolean> {
    const detail = `email: ${maskEmail(input.newEmail)} (${EVENT_LABEL[input.event]})`
    const targets = [input.oldEmail, input.newEmail].filter((value): value is string => Boolean(value))
    const failures: string[] = []
    for (const target of targets) {
        try {
            await emailService.sendChannelChangeNotification(target, detail)
            writeAuditEvent({
                action: 'channel.change.notify',
                targetUserId: input.userId,
                after: { channel: 'email', event: input.event },
                source: 'system',
            })
            return true
        } catch (error) {
            failures.push(`${target === input.oldEmail ? 'old' : 'new'}-email: ${error instanceof Error ? error.message : String(error)}`)
        }
    }
    writeAuditEvent({
        action: 'channel.change.notify',
        targetUserId: input.userId,
        result: 'failure',
        reason: failures.join('; ') || 'no-deliverable-channel',
        source: 'system',
    })
    return false
}
