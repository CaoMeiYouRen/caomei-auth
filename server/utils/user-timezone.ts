import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { DEFAULT_TIME_ZONE, isValidTimeZone } from '@/utils/shared/timezone'

/**
 * 读取用户时区偏好（按邮箱）。
 * 未注册 / 未设置 / 非法值统一回退 UTC，邮件等异步场景不依赖请求上下文。
 */
export async function getUserTimeZoneByEmail(email: string): Promise<string> {
    try {
        const user = await dataSource.getRepository(User).findOne({ where: { email }, select: ['id', 'timezone'] })
        const timezone = user?.timezone
        return isValidTimeZone(timezone) ? timezone : DEFAULT_TIME_ZONE
    } catch {
        return DEFAULT_TIME_ZONE
    }
}
