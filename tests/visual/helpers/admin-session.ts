import type { Page } from '@playwright/test'
import { makeSignature } from 'better-auth/crypto'
import { visualAuthSecret, visualBaseURL } from './config'

/**
 * 管理员视觉会话。
 *
 * 为什么不在每个用例里调用登录接口：
 * 1. `/sign-in/*` 有 3 次/分钟限流，Admin 矩阵用例数远超上限；
 * 2. 每次登录都会新增 `session` 行，导致登录日志页的总数与首行随用例顺序变化。
 *
 * 因此由 `scripts/testing/visual-fixtures.mjs` 预置一条固定 token 的会话行，
 * 这里按 better-auth 的 HMAC-SHA256 规则签名后写入 cookie；全程不产生新会话。
 */

/** 与 `scripts/testing/visual-fixtures.mjs` 的 `VISUAL_ADMIN_SESSION_TOKEN` 保持一致。 */
export const VISUAL_ADMIN_SESSION_TOKEN = 'visual-admin-session-token'

/** better-auth 默认 cookie 名（http baseURL 不带 `__Secure-` 前缀）。 */
export const VISUAL_ADMIN_COOKIE_NAME = 'better-auth.session_token'

let cookiePromise: Promise<{ name: string, value: string, url: string }> | undefined

async function buildAdminCookie() {
    const signature = await makeSignature(VISUAL_ADMIN_SESSION_TOKEN, visualAuthSecret)

    return {
        name: VISUAL_ADMIN_COOKIE_NAME,
        value: `${VISUAL_ADMIN_SESSION_TOKEN}.${signature}`,
        url: visualBaseURL,
    }
}

/** 在导航前注入管理员会话 cookie。 */
export async function useAdminSession(page: Page): Promise<void> {
    cookiePromise ??= buildAdminCookie()
    await page.context().addCookies([await cookiePromise])
}
