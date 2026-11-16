import { dataSource } from '@/server/database'
import { User } from '@/server/entities/user'
import { isValidTimeZone } from '@/utils/shared/timezone'

/**
 * 读取用户时区偏好（按邮箱）。
 * 未注册 / 未设置 / 非法值返回 null：异步邮件没有浏览器上下文，不猜测用户时区。
 */
export async function getUserTimeZoneByEmail(email: string): Promise<string | null> {
    try {
        const user = await dataSource.getRepository(User).findOne({ where: { email }, select: ['id', 'timezone'] })
        return isValidTimeZone(user?.timezone) ? user.timezone : null
    } catch {
        return null
    }
}
