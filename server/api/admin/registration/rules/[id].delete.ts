import { createError, defineEventHandler, isError } from 'h3'
import { dataSource } from '@/server/database'
import { RegistrationRule } from '@/server/entities/registration-rule'
import { checkAdmin } from '@/server/utils/check-admin'
import logger from '@/server/utils/logger'
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'
import { createZodErrorMap } from '@/utils/shared/zod-error-map'
import { createLocalizedError, getServerI18n } from '@/server/utils/i18n'
import { invalidateRegistrationRuleCache } from '@/server/utils/registration-policy'

export default defineEventHandler(async (event) => {
    const auth = await checkAdmin(event)
    const { t } = await getServerI18n(event)
    try {
        const params = await validateParamsSafe(event, idParamSchema, { errorMap: createZodErrorMap(t), translate: t })
        if (!params.success) {
            throw createError({ statusCode: 400, message: params.error.message })
        }
        const repo = dataSource.getRepository(RegistrationRule)
        const rule = await repo.findOne({ where: { id: params.data.id } })
        if (!rule) {
            throw await createLocalizedError(event, { statusCode: 404, key: 'errors.admin.registrationRuleNotFound' })
        }
        await repo.remove(rule)
        invalidateRegistrationRuleCache()
        logger.info('Registration rule deleted', {
            adminId: auth.data.userId,
            ruleId: rule.id,
            type: rule.type,
            mode: rule.mode,
            value: rule.value,
        })
        return { success: true, data: null }
    } catch (error) {
        if (isError(error)) {
            throw error
        }
        throw await createLocalizedError(event, { statusCode: 500, key: 'errors.admin.registrationRuleDeleteFailed' })
    }
})
