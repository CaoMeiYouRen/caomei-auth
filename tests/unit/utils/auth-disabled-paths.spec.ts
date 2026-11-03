import { describe, expect, it } from 'vitest'
import { AUTH_BASE_PATH, OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS } from '@/utils/shared/auth-paths'
import { AUTH_DISABLED_PATHS } from '@/utils/shared/auth-disabled-paths'
import { SSO_MANAGEMENT_AUTH_PATHS } from '@/utils/shared/sso-management-paths'

/**
 * 回归保护：所有"只校验登录态"的上游管理端点都必须处于 disabledPaths 关闭状态。
 * 背景：GHSA-785j-54p4-vxw9（SSO）与 GHSA-2r7m-492j-p8xm（OAuth 客户端创建）。
 */
describe('utils/auth-disabled-paths', () => {
    it('包含全部 SSO 提供商管理端点', () => {
        SSO_MANAGEMENT_AUTH_PATHS.forEach((path) => {
            expect(AUTH_DISABLED_PATHS).toContain(path)
        })
    })

    it('包含全部 OAuth 客户端自助管理端点', () => {
        OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS.forEach((path) => {
            expect(AUTH_DISABLED_PATHS).toContain(path)
        })
    })

    it('disabledPaths 使用相对 basePath 的路径且无重复', () => {
        AUTH_DISABLED_PATHS.forEach((path) => {
            expect(path.startsWith('/')).toBe(true)
            expect(path.startsWith(AUTH_BASE_PATH)).toBe(false)
        })
        expect(new Set(AUTH_DISABLED_PATHS).size).toBe(AUTH_DISABLED_PATHS.length)
    })
})
