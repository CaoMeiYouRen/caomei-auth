import { expect, type Page } from '@playwright/test'
import { visualBaseURL, visualSessionHeaders } from './config'

/**
 * 视觉层固定账号：空库每次重建，首个用例注册，后续用例登录。
 *
 * 抽到独立 helper 是为了让多个语言矩阵（en-US / zh-TW / ja-JP / ko-KR）共用同一份
 * 会话建立逻辑，避免每个 spec 复制一份导致 jscpd 重复块增长。
 */
export const VISUAL_USER_ACCOUNT = {
    email: 'visual-baseline@example.com',
    password: 'VisualBaseline123',
    name: 'Visual Baseline',
    username: 'visualbaseline',
}

/** 普通账号会话：注册幂等，已存在时登录。 */
export async function ensureVisualUserSession(page: Page): Promise<void> {
    const signUp = await page.request.post(`${visualBaseURL}/api/auth/sign-up/email`, {
        data: VISUAL_USER_ACCOUNT,
        headers: visualSessionHeaders,
    })
    if (signUp.ok()) {
        return
    }
    const signIn = await page.request.post(`${visualBaseURL}/api/auth/sign-in/email`, {
        data: { email: VISUAL_USER_ACCOUNT.email, password: VISUAL_USER_ACCOUNT.password },
        headers: visualSessionHeaders,
    })
    expect(signIn.ok(), '视觉账号登录失败').toBeTruthy()
}
