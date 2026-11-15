import logger from '../logger'
import { getRequestLocaleFromRequest, resolveEmailLocale, type RequestLike } from './i18n'
import { matchDetectedLocale, type LocaleCode } from '@/i18n/config/locale-registry'

/**
 * 按邮箱读取用户的语言偏好。
 *
 * 用动态 import 避免 `database` → `auth` → `email` 的初始化循环；查不到或数据库未就绪时回退 `null`。
 */
export async function getUserLocaleByEmail(email: string): Promise<string | null> {
    try {
        const [{ dataSource }, { User }] = await Promise.all([
            import('@/server/database'),
            import('@/server/entities/user'),
        ])
        const user = await dataSource.getRepository(User).findOne({ where: { email } })
        return user?.locale ?? null
    } catch (error) {
        /* 表结构未升级（缺 locale 列）或数据库暂不可用时按「无偏好」处理，但保留可观测信号 */
        logger.warn('Failed to read user locale, falling back to default', {
            email,
            error: error instanceof Error ? error.message : String(error),
        })
        return null
    }
}

/**
 * 旧用户惰性回填：只在用户偏好为空且本次已确定语言时写入，失败不影响邮件发送。
 */
export async function backfillUserLocale(email: string, locale: LocaleCode): Promise<void> {
    try {
        const [{ dataSource }, { User }] = await Promise.all([
            import('@/server/database'),
            import('@/server/entities/user'),
        ])
        await dataSource.getRepository(User).update({ email }, { locale })
    } catch (error) {
        logger.warn('Failed to backfill user locale', {
            email,
            error: error instanceof Error ? error.message : String(error),
        })
    }
}

/**
 * 解析邮件语言：显式覆盖 > 请求语言 > 用户偏好 > 默认语言（阶段 5 范围登记 §5.4）。
 *
 * 供不需要惰性回填信息的调用方使用；需要回填时用 `resolveEmailLocaleWithBackfill`。
 *
 * - 同步邮件：拿得到请求语言时以请求语言为准；
 * - 异步邮件（无 request）：使用用户偏好；旧用户 `null` 时回退默认语言。
 */
export async function resolveEmailLocaleForAddress(
    email: string,
    options?: { request?: Request | RequestLike | null, locale?: LocaleCode | string | null },
): Promise<LocaleCode> {
    const explicitLocale = matchDetectedLocale(options?.locale)
    if (explicitLocale) {
        return explicitLocale
    }

    const requestLocale = getRequestLocaleFromRequest(options?.request)
    if (requestLocale) {
        return requestLocale
    }

    const storedLocale = await getUserLocaleByEmail(email)
    return resolveEmailLocale({ userLocale: storedLocale })
}

export interface EmailLocaleResolution {
    locale: LocaleCode
    /** 是否为旧用户（库内无偏好）且本次解析出了可回填的语言 */
    shouldBackfill: boolean
}

/**
 * 同上，但额外返回是否需要惰性回填（旧用户 + 有请求语言）。
 */
export async function resolveEmailLocaleWithBackfill(
    email: string,
    options?: { request?: Request | RequestLike | null, locale?: LocaleCode | string | null },
): Promise<EmailLocaleResolution> {
    const explicitLocale = matchDetectedLocale(options?.locale)
    if (explicitLocale) {
        return { locale: explicitLocale, shouldBackfill: false }
    }

    const requestLocale = getRequestLocaleFromRequest(options?.request)
    const storedLocale = await getUserLocaleByEmail(email)

    if (requestLocale) {
        /* 旧用户按请求语言发送，并惰性回填偏好（不阻塞邮件） */
        return { locale: requestLocale, shouldBackfill: !storedLocale }
    }

    return { locale: resolveEmailLocale({ userLocale: storedLocale }), shouldBackfill: false }
}
