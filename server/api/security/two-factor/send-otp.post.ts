import { defineEventHandler } from 'h3'
import { auth } from '@/lib/auth'
import { consumeLatestTwoFactorDelivery } from '@/server/utils/recovery-channels'
import { createLocalizedError } from '@/server/utils/i18n'
import logger from '@/server/utils/logger'
import { rateLimit } from '@/server/utils/rate-limit'
import { requireCaptcha } from '@/server/utils/captcha-guard'

/**
 * 两步验证验证码发送（阶段 9 M6）。
 *
 * 上游 `/two-factor/send-otp` 会吞掉 `sendOTP` 回调和异常并以 200 返回，
 * 前端无法判断「邮件 / 短信到底有没有发出去」。本端点调用上游后读取投递结果：
 * - 邮件成功 → `channel=email`
 * - 邮件失败、手机成功 → `channel=phone`，`fallback=true`
 * - 全部失败 → 502 `SEND_FAILED`，由前端展示本地化失败提示
 */
export default defineEventHandler(async (event) => {
    /* 与上游 `/two-factor/*` 一致的 3 次/分钟；包装端点不再经过 better-auth 限流 */
    await rateLimit(event, { window: 60, max: 3 })
    /* 验证码服务端校验（阶段 17 D60）：校验失败时不调用上游、不产生投递记录 */
    await requireCaptcha(event)
    await auth.api.sendTwoFactorOTP({
        headers: event.headers,
    })

    const record = consumeLatestTwoFactorDelivery()
    if (record?.error) {
        logger.warn('Two-factor OTP delivery failed', { error: record.error })
        throw await createLocalizedError(event, {
            statusCode: 502,
            key: 'errors.recovery.sendFailed',
            data: { code: 'SEND_FAILED' },
        })
    }

    return {
        status: true,
        channel: record?.delivery?.channel ?? null,
        fallback: record?.delivery?.fallback ?? false,
    }
})
