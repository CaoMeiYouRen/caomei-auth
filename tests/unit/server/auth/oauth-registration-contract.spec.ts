import fs from 'node:fs'
import path from 'node:path'
import Database from 'better-sqlite3'
import { betterAuth } from 'better-auth'
import { anonymous, jwt } from 'better-auth/plugins'
import { oauthProvider } from '@better-auth/oauth-provider'
import { describe, expect, it } from 'vitest'
import { AUTH_DISABLED_PATHS } from '@/utils/shared/auth-disabled-paths'

/**
 * 契约测试：OAuth 客户端创建入口必须保持关闭。
 *
 * 背景：GHSA-2r7m-492j-p8xm。`/oauth2/register` 只校验登录态，管理员门禁又被点段
 * 路径绕过；同一插件还挂着 `/oauth2/create-client`，同样只校验登录态，任意会话
 * （含匿名会话）都能注册攻击者自控 redirect_uri 的客户端。
 * 产品上应用统一由 `/api/admin/oauth/applications` 创建，因此这些端点必须关闭。
 */

const BASE_URL = 'http://localhost:3000'
const SECRET = 'test-secret-test-secret-test-secret-1234'

const CREATE_CLIENT_PATHS = ['/api/auth/oauth2/create-client']

const MANAGED_CLIENT_PATHS = [
    '/api/auth/oauth2/create-client',
    '/api/auth/oauth2/get-client',
    '/api/auth/oauth2/get-clients',
    '/api/auth/oauth2/update-client',
    '/api/auth/oauth2/delete-client',
    '/api/auth/oauth2/client/rotate-secret',
]

function createAuth(options: {
    allowDynamicClientRegistration: boolean
    disabledPaths?: string[]
}) {
    return betterAuth({
        appName: 'oauth-registration-contract',
        baseURL: BASE_URL,
        secret: SECRET,
        database: new Database(':memory:'),
        emailAndPassword: {
            enabled: true,
            minPasswordLength: 6,
        },
        ...(options.disabledPaths ? { disabledPaths: options.disabledPaths } : {}),
        plugins: [
            anonymous(),
            oauthProvider({
                loginPage: '/login',
                consentPage: '/oauth/consent',
                allowDynamicClientRegistration: options.allowDynamicClientRegistration,
            }),
            jwt({
                jwt: {
                    issuer: BASE_URL,
                },
            }),
        ],
    })
}

async function createReadyAuth(options: {
    allowDynamicClientRegistration: boolean
    disabledPaths?: string[]
}) {
    const auth = createAuth(options)
    const context = await auth.$context
    await context.runMigrations()
    return auth
}

function post(
    auth: ReturnType<typeof createAuth>,
    pathname: string,
    body: Record<string, unknown>,
    cookie?: string,
) {
    const request = new Request(`${BASE_URL}${pathname}`, {
        method: 'POST',
        body: JSON.stringify(body),
    })
    request.headers.set('origin', BASE_URL)
    request.headers.set('content-type', 'application/json')
    if (cookie) {
        request.headers.set('cookie', cookie)
    }
    return auth.handler(request)
}

async function anonymousCookie(auth: ReturnType<typeof createAuth>) {
    const { headers } = await auth.api.signInAnonymous({ returnHeaders: true })
    return headers.getSetCookie()[0]?.split(';')[0] ?? ''
}

const CLIENT_BODY = {
    client_name: 'evil',
    redirect_uris: ['https://attacker.example/callback'],
}

describe('OAuth 动态客户端注册禁用契约', () => {
    it('关闭后即使请求合法也返回 403 access_denied', async () => {
        const auth = await createReadyAuth({ allowDynamicClientRegistration: false })
        const response = await post(auth, '/api/auth/oauth2/register', CLIENT_BODY)
        expect(response.status).toBe(403)
        const body = await response.json() as { error?: string }
        expect(body.error).toBe('access_denied')
    })

    it('开启时同样的请求不会返回 403 access_denied（证明断言有意义）', async () => {
        const auth = await createReadyAuth({ allowDynamicClientRegistration: true })
        const response = await post(auth, '/api/auth/oauth2/register', CLIENT_BODY)
        // 端点存在且未被禁用：无会话时按上游逻辑返回 401（而不是 access_denied）
        expect(response.status).toBe(401)
        const body = await response.json() as { error?: string }
        expect(body.error).not.toBe('access_denied')
    })
})

describe('OAuth 客户端自助管理端点禁用契约', () => {
    it.each(CREATE_CLIENT_PATHS)(
        '未加固时匿名会话可通过 %s 创建客户端（漏洞复现）',
        async (pathname) => {
            const auth = await createReadyAuth({ allowDynamicClientRegistration: false })
            const cookie = await anonymousCookie(auth)
            expect(cookie).not.toBe('')
            const response = await post(auth, pathname, CLIENT_BODY, cookie)
            expect(response.status).toBe(201)
        },
    )

    it.each(MANAGED_CLIENT_PATHS)(
        '加入 AUTH_DISABLED_PATHS 后 %s 返回 404',
        async (pathname) => {
            const auth = await createReadyAuth({
                allowDynamicClientRegistration: false,
                disabledPaths: AUTH_DISABLED_PATHS,
            })
            const cookie = await anonymousCookie(auth)
            const response = await post(auth, pathname, CLIENT_BODY, cookie)
            expect(response.status).toBe(404)
        },
    )
})

describe('配置契约', () => {
    it('lib/auth.ts 仍接线 allowDynamicClientRegistration: false 与管理员 clientPrivileges', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'lib/auth.ts'), 'utf8')
        expect(source).toMatch(/allowDynamicClientRegistration:\s*false/)
        expect(source).not.toMatch(/allowDynamicClientRegistration:\s*true/)
        expect(source).toMatch(/clientPrivileges:\s*\(\{\s*user\s*\}\)/)
    })

    it('lib/auth.ts 使用合并后的 AUTH_DISABLED_PATHS', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'lib/auth.ts'), 'utf8')
        expect(source).toMatch(/from '@\/utils\/shared\/auth-disabled-paths'/)
        expect(source).toMatch(/disabledPaths:\s*AUTH_DISABLED_PATHS/)
    })

    it('2-auth 中间件用归一化路径判断注册端点与客户端管理端点', () => {
        const source = fs.readFileSync(path.join(process.cwd(), 'server/middleware/2-auth.ts'), 'utf8')
        expect(source).toMatch(/isOAuthRegistrationAuthPath\(normalizedPath\)/)
        expect(source).toMatch(/isOAuthClientManagementAuthPath\(normalizedPath\)/)
        expect(source).not.toMatch(/event\.path\.startsWith\('\/api\/auth\/oauth2\/register'\)/)
    })
})
