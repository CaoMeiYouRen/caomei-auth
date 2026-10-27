import { describe, expect, it } from 'vitest'
import {
    AUTH_BASE_PATH,
    AUTH_DISABLED_PATHS,
    SSO_MANAGEMENT_AUTH_PATHS,
    isSsoManagementAuthPath,
} from '@/utils/shared/sso-management-paths'

/**
 * 回归保护：SSO 提供商管理端点必须持续处于“关闭 + 管理员校验”状态。
 * 背景：GHSA-785j-54p4-vxw9，`trustEmailVerified: true` 配合开放的
 * `/sso/register` 可让任意登录用户接管他人账号。
 */
describe('utils/sso-management-paths', () => {
    it('覆盖所有会创建或篡改 SSO 提供商的上游端点', () => {
        expect(SSO_MANAGEMENT_AUTH_PATHS).toEqual(expect.arrayContaining([
            '/sso/register',
            '/sso/update-provider',
            '/sso/delete-provider',
            '/sso/request-domain-verification',
            '/sso/verify-domain',
        ]))
    })

    it('禁用列表与相对路径列表保持一致且不带 basePath 前缀', () => {
        expect(AUTH_DISABLED_PATHS).toEqual([...SSO_MANAGEMENT_AUTH_PATHS])
        AUTH_DISABLED_PATHS.forEach((path) => {
            expect(path.startsWith(AUTH_BASE_PATH)).toBe(false)
            expect(path.startsWith('/sso/')).toBe(true)
        })
    })

    it('命中管理端点', () => {
        expect(isSsoManagementAuthPath('/api/auth/sso/register')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/update-provider')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/delete-provider')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/verify-domain')).toBe(true)
    })

    it('容忍查询串、hash 与尾部斜杠', () => {
        expect(isSsoManagementAuthPath('/api/auth/sso/register?foo=1')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/register/')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/register/#top')).toBe(true)
    })

    it('按 WHATWG URL 规则折叠点段，与 better-auth 路由归一化保持一致', () => {
        expect(isSsoManagementAuthPath('/api/auth/x/../sso/register')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/./register')).toBe(true)
        expect(isSsoManagementAuthPath('/api/auth/sso/%2e%2e/sso/register')).toBe(true)
    })

    it('不影响登录、回调与其它 auth 端点', () => {
        expect(isSsoManagementAuthPath('/api/auth/sign-in/sso')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/callback/provider-a')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/callback')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/saml2/callback/provider-a')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/saml2/sp/acs/provider-a')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/list-providers')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/get-provider')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/oauth2/register')).toBe(false)
    })

    it('不做前缀宽松匹配，避免误伤同前缀路径', () => {
        expect(isSsoManagementAuthPath('/api/auth/sso/register-extra')).toBe(false)
        expect(isSsoManagementAuthPath('/api/auth/sso/registerevil')).toBe(false)
        expect(isSsoManagementAuthPath('/prefix/api/auth/sso/register')).toBe(false)
    })
})
