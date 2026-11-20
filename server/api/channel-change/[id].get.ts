import { defineEventHandler } from 'h3'
import { dataSource } from '@/server/database'
import { ChannelChangeRequest } from '@/server/entities/channel-change-request'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { isChannelChangeExpired, maskChannelValue } from '@/server/utils/channel-change'

/**
 * 改绑确认页只读信息（阶段 9 M10）。
 *
 * 链接只携带不透明请求 ID，GET 不消费令牌，避免邮件网关预取导致验证码失效。
 * 只返回脱敏后的目标值，不暴露用户 ID / 完整邮箱 / 完整手机号。
 */
export default defineEventHandler(async (event) => {
    const { t } = await getServerI18n(event)
    const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
    if (!params.success) {
        throw await createLocalizedError(event, { statusCode: 400, key: 'errors.admin.paramsInvalid' })
    }

    const repository = dataSource.getRepository(ChannelChangeRequest)
    const request = await repository.findOne({ where: { id: params.data.id } })
    if (!request) {
        throw await createLocalizedError(event, { statusCode: 404, key: 'errors.recovery.requestNotFound' })
    }
    if (request.status === 'pending' && isChannelChangeExpired(request)) {
        request.status = 'expired'
        await repository.save(request)
    }

    return {
        status: true,
        data: {
            id: request.id,
            channel: request.channel,
            maskedTarget: maskChannelValue(request.channel, request.newValue),
            status: request.status,
            expiresAt: request.expiresAt,
        },
    }
})
