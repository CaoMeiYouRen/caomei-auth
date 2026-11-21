import { defineEventHandler } from 'h3'
import { getUserSession } from '@/server/utils/get-user-session'
import { countRemainingRecoveryCodes, listRecoveryCodes, RECOVERY_CODE_COUNT } from '@/server/utils/recovery-code'

/**
 * 恢复码状态（阶段 10 M1.2）。
 *
 * 只返回剩余数量与元信息，任何情况下都不返回明文或哈希。
 */
export default defineEventHandler(async (event) => {
    const { userId } = await getUserSession(event)
    const [remaining, codes] = await Promise.all([
        countRemainingRecoveryCodes(userId),
        listRecoveryCodes(userId),
    ])
    return {
        status: true,
        data: {
            remaining,
            total: codes.length || RECOVERY_CODE_COUNT,
            codes,
        },
    }
})
