import { createError, defineEventHandler, isError, readBody } from 'h3'
import { dataSource } from '@/server/database'
import { RegistrationRule } from '@/server/entities/registration-rule'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema, registrationRuleUpdateSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { invalidateRegistrationRuleCache, normalizeRuleValue } from '@/server/utils/registration-policy'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    try {
        const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
        if (!params.success) {
            throw createError({ statusCode: 400, message: params.error.message })
        }
        const body = await readBody(event)
        const result = registrationRuleUpdateSchema.safeParse(body, { error: createZodErrorMap(t) })
        if (!result.success) {
            throw createError({
                statusCode: 400,
                message: result.error.issues[0]?.message ?? t('errors.admin.paramsInvalid'),
            })
        }

        const repo = dataSource.getRepository(RegistrationRule)
        const rule = await repo.findOne({ where: { id: params.data.id } })
        if (!rule) {
            throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.registrationRuleNotFound' })
        }

        if (result.data.type !== undefined) {
            rule.type = result.data.type
        }
        if (result.data.mode !== undefined) {
            rule.mode = result.data.mode
        }
        if (result.data.value !== undefined) {
            rule.value = normalizeRuleValue(result.data.value)
        }
        if (result.data.enabled !== undefined) {
            rule.enabled = result.data.enabled
        }
        if (result.data.note !== undefined) {
            rule.note = result.data.note ?? null
        }
        const conflict = await repo.findOne({ where: { type: rule.type, mode: rule.mode, value: rule.value } })
        if (conflict && conflict.id !== rule.id) {
            throw await createLocalizedError(event, { statusCode: 409, key: 'errors.admin.registrationRuleExists' })
        }
        await repo.save(rule)
        invalidateRegistrationRuleCache()
        logger.info('Registration rule updated', {
            adminId: auth.data.userId,
            ruleId: rule.id,
            type: rule.type,
            mode: rule.mode,
            value: rule.value,
            enabled: rule.enabled,
        })
        return { success: true, data: { rule } }
    } catch (error) {
        if (isError(error)) {
            throw error
        }
        throw await createLocalizedError(event, { statusCode: 500, key: 'errors.admin.registrationRuleUpdateFailed' })
    }
})
