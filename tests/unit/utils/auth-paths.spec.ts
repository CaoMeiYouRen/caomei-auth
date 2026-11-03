import { describe, expect, it } from 'vitest'
import {
    AUTH_BASE_PATH,
    OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS,
    OAUTH_REGISTRATION_AUTH_PATH,
    isOAuthClientManagementAuthPath,
    isOAuthRegistrationAuthPath,
    normalizeAuthPath,
} from '@/utils/shared/auth-paths'

/**
 * 回归保护：路径鉴权判断必须与 better-auth 的 WHATWG URL 归一化保持一致。
 * 背景：GHSA-2r7m-492j-p8xm，原始 `startsWith` 前缀门禁可被点段路径绕过。
 */
describe('utils/auth-paths', () => {
    it('挂载前缀与注册端点常量一致', () => {
        expect(AUTH_BASE_PATH).toBe('/api/auth')
        expect(OAUTH_REGISTRATION_AUTH_PATH).toBe(`${AUTH_BASE_PATH}/oauth2/register`)
    })

    it('保留普通路径，丢弃查询串、hash 与尾部斜杠', () => {
        expect(normalizeAuthPath('/api/auth/oauth2/register')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/register?foo=1')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/register#top')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/register/')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/register///')).toBe('/api/auth/oauth2/register')
    })

    it('按 WHATWG URL 规则折叠点段', () => {
        expect(normalizeAuthPath('/api/auth/oauth2/./register')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/x/../register')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/%2e/register')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/api/auth/oauth2/%2e%2e/oauth2/register')).toBe('/api/auth/oauth2/register')
        expect(normalizeAuthPath('/login/../api/auth/oauth2/register')).toBe('/api/auth/oauth2/register')
    })

    it('空路径与无法识别的输入回退到根路径', () => {
        expect(normalizeAuthPath('')).toBe('/')
        expect(normalizeAuthPath('/')).toBe('/')
    })

    it('命中注册端点', () => {
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/register')).toBe(true)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/register/')).toBe(true)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/register?foo=1')).toBe(true)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/./register')).toBe(true)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/x/../register')).toBe(true)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/%2e/register')).toBe(true)
    })

    it('不做前缀宽松匹配，避免误伤同前缀路径', () => {
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/register-extra')).toBe(false)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/register/extra')).toBe(false)
        expect(isOAuthRegistrationAuthPath('/api/auth/sso/register')).toBe(false)
        expect(isOAuthRegistrationAuthPath('/prefix/api/auth/oauth2/register')).toBe(false)
        expect(isOAuthRegistrationAuthPath('/api/auth/oauth2/authorize')).toBe(false)
    })

    it('OAuth 客户端自助管理端点覆盖创建、读取、更新、删除与轮换密钥', () => {
        expect(OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS).toEqual(expect.arrayContaining([
            '/oauth2/create-client',
            '/oauth2/get-client',
            '/oauth2/get-clients',
            '/oauth2/update-client',
            '/oauth2/delete-client',
            '/oauth2/client/rotate-secret',
        ]))
    })

    it('命中 OAuth 客户端自助管理端点（含点段变体）', () => {
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/create-client')).toBe(true)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/create-client?x=1')).toBe(true)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/./create-client')).toBe(true)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/x/../create-client')).toBe(true)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/%2e/create-client')).toBe(true)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/client/rotate-secret')).toBe(true)
    })

    it('不误伤公开客户端信息与授权同意端点', () => {
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/public-client')).toBe(false)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/public-client-prelogin')).toBe(false)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/consent')).toBe(false)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/authorize')).toBe(false)
        expect(isOAuthClientManagementAuthPath('/api/auth/oauth2/create-client-extra')).toBe(false)
    })
})
