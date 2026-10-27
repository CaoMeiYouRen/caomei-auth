import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { betterAuth } from 'better-auth'
import { sso } from '@better-auth/sso'
import { beforeAll, describe, expect, it } from 'vitest'
import { AUTH_BASE_PATH, AUTH_DISABLED_PATHS } from '@/utils/shared/sso-management-paths'

/**
 * 契约测试：确认真实 better-auth 路由层确实会按 `AUTH_DISABLED_PATHS`
 * 关闭 SSO 提供商管理端点，并确认 `lib/auth.ts` 仍接线到该列表。
 *
 * 背景：GHSA-785j-54p4-vxw9。上游这些端点只校验登录态，普通用户可注册
 * 攻击者自控 IdP；一旦 `disabledPaths` 丢失或路径格式写错（上游按相对
 * basePath 的精确路径匹配），漏洞即复活。
 */

const BASE_URL = 'http://localhost:3000'
const SECRET = 'test-secret-test-secret-test-secret-1234'

function createAuth(options: { disabledPaths?: string[], providersLimit?: number } = {}) {
    return betterAuth({
        appName: 'sso-management-contract',
        baseURL: BASE_URL,
        secret: SECRET,
        database: new Database(':memory:'),
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 6,
        },
        ...(options.disabledPaths ? { disabledPaths: options.disabledPaths } : {}),
        plugins: [
            sso({
                trustEmailVerified: true,
                providersLimit: options.providersLimit ?? 10,
            }),
        ],
    })
}

function post(auth: ReturnType<typeof createAuth>, pathname: string, body = '{}') {
    return auth.handler(new Request(`${BASE_URL}${pathname}`, {
        method: 'POST',
        headers: {
            origin: BASE_URL,
            'content-type': 'application/json',
        },
        body,
    }))
}

const repoRoot = process.cwd()

/**
 * `request-domain-verification` / `verify-domain` 只在 `domainVerification.enabled`
 * 为 true 时才会被插件注册，因此在默认配置下即使不写 disabledPaths 也会返回 404。
 * 它们仍必须留在管理端点列表里：一旦未来启用域名验证，必须同样处于关闭状态。
 */
const DOMAIN_VERIFICATION_PATHS = [
    '/sso/request-domain-verification',
    '/sso/verify-domain',
]
const ALWAYS_REGISTERED_PATHS = AUTH_DISABLED_PATHS.filter(
    (item) => !DOMAIN_VERIFICATION_PATHS.includes(item),
)

describe('SSO 管理端点禁用契约', () => {
    let hardened: ReturnType<typeof createAuth>
    let baseline: ReturnType<typeof createAuth>

    beforeAll(() => {
        hardened = createAuth({ disabledPaths: AUTH_DISABLED_PATHS })
        baseline = createAuth()
    })

    it.each(ALWAYS_REGISTERED_PATHS)('禁用后 %s 返回 404', async (disabledPath) => {
        const response = await post(hardened, `/api/auth${disabledPath}`)
        expect(response.status).toBe(404)
        expect(await response.text()).toBe('Not Found')
    })

    it('管理端点列表包含域名验证端点，避免启用域名验证后重新暴露', () => {
        DOMAIN_VERIFICATION_PATHS.forEach((managementPath) => {
            expect(AUTH_DISABLED_PATHS).toContain(managementPath)
        })
    })

    it('未禁用时同样的请求不会 404（证明断言有意义）', async () => {
        const response = await post(baseline, '/api/auth/sso/register')
        expect(response.status).not.toBe(404)
    })

    it('providersLimit: 0 时即使端点未禁用也返回 403', async () => {
        const limited = createAuth({ providersLimit: 0 })
        const context = await limited.$context
        await context.runMigrations()
        const { headers } = await limited.api.signUpEmail({
            body: { email: 'limit-test@evil.test', password: 'Passw0rd!', name: 'limit-test' },
            returnHeaders: true,
        })
        const cookie = headers.getSetCookie()[0]?.split(';')[0] ?? ''
        // 注意：vitest 的 happy-dom 环境会忽略 Request init 中的 headers，必须在构造后手动设置
        const request = new Request(`${BASE_URL}/api/auth/sso/register`, {
            method: 'POST',
            body: JSON.stringify({
                providerId: 'limit-test-provider',
                issuer: 'https://idp.example',
                domain: 'example.com',
                oidcConfig: {
                    clientId: 'client',
                    clientSecret: 'secret',
                    authorizationEndpoint: 'https://idp.example/authorize',
                    tokenEndpoint: 'https://idp.example/token',
                    jwksEndpoint: 'https://idp.example/jwks',
                    skipDiscovery: true,
                    pkce: false,
                },
            }),
        })
        request.headers.set('origin', BASE_URL)
        request.headers.set('cookie', cookie)
        request.headers.set('content-type', 'application/json')
        const response = await limited.handler(request)
        expect(response.status).toBe(403)
        const body = await response.json() as { message?: string }
        expect(body.message).toContain('registration is disabled')
    })

    it('登录链路 /sign-in/sso 仍然可达', async () => {
        const response = await post(hardened, '/api/auth/sign-in/sso')
        expect(response.status).not.toBe(404)
        expect(response.status).toBe(400)
    })

    it('AUTH_BASE_PATH 与 better-auth 实际挂载前缀一致', async () => {
        const context = await hardened.$context
        expect(new URL(context.baseURL).pathname).toBe(AUTH_BASE_PATH)
    })

    it('lib/auth.ts 仍接线 disabledPaths 与 providersLimit: 0', () => {
        const source = fs.readFileSync(path.join(repoRoot, 'lib/auth.ts'), 'utf8')
        expect(source).toMatch(/disabledPaths:\s*AUTH_DISABLED_PATHS/)
        expect(source).toMatch(/providersLimit:\s*0\b/)
    })
})
