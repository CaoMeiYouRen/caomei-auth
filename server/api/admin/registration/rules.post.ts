import { createError, defineEventHandler, readBody } from 'h3'
import { dataSource } from '@/server/database'
import { RegistrationRule } from '@/server/entities/registration-rule'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { registrationRuleSchema } from '@/utils/shared/api-schemas'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { invalidateRegistrationRuleCache, normalizeRuleValue } from '@/server/utils/registration-policy'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    const body = await readBody(event)
    const result = registrationRuleSchema.safeParse(body, { error: createZodErrorMap(t) })
    if (!result.success) {
        throw createError({
            statusCode: 400,
            message: result.error.issues[0]?.message ?? t('errors.admin.paramsInvalid'),
        })
    }

    const repo = dataSource.getRepository(RegistrationRule)
    const value = normalizeRuleValue(result.data.value)
    const existing = await repo.findOne({ where: { type: result.data.type, mode: result.data.mode, value } })
    if (existing) {
        throw await createLocalizedError(event, { statusCode: 409, key: 'errors.admin.registrationRuleExists' })
    }

    const rule = repo.create({
        type: result.data.type,
        mode: result.data.mode,
        value,
        enabled: result.data.enabled ?? true,
        note: result.data.note ?? null,
    })
    try {
        await repo.save(rule)
    } catch {
        throw await createLocalizedError(event, { statusCode: 500, key: 'errors.admin.registrationRuleUpdateFailed' })
    }
    invalidateRegistrationRuleCache()
    logger.info('Registration rule created', {
        adminId: auth.data.userId,
        ruleId: rule.id,
        type: rule.type,
        mode: rule.mode,
        value: rule.value,
    })
    return { success: true, data: { rule } }
})
