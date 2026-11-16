import { defineEventHandler } from 'h3'
import { dataSource } from '@/server/database'
import { RegistrationRule } from '@/server/entities/registration-rule'
import { checkAdmin } from '@/server/utils/check-admin'
import { getServerI18n } from '@/server/utils/i18n'

export default defineEventHandler(async (event) => {
    await checkAdmin(event)
    await getServerI18n(event)
    const rules = await dataSource.getRepository(RegistrationRule).find({
        order: { type: 'ASC', mode: 'ASC', value: 'ASC' },
    })
    return {
        success: true,
        data: { rules },
    }
})
