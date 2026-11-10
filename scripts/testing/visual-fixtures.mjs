/**
 * 视觉层确定性夹具（P4 Admin）。
 *
 * 目标：Admin 页面需要管理员会话、用户 / 应用 / SSO / 登录日志数据；若沿用随机种子或
 * 真实时间，基线会随每次运行漂移。这里把全部 ID、名称、时间、IP、UA 固定下来，
 * 时间以 `VISUAL_FIXED_NOW`（默认 2026-06-15T12:00:00+08:00）为锚点计算。
 *
 * 使用方：
 * - `scripts/testing/prepare-visual-db.mjs` 在视觉服务启动前写入；
 * - `tests/visual/helpers/admin-session.ts` 复用管理员会话 token 与账号约定。
 *
 * 依据：docs/design/governance/2026-11-10-p4-admin-migration-plan.md §3.5。
 */

export const DEFAULT_VISUAL_NOW = '2026-06-15T12:00:00+08:00'

/** 管理员视觉会话 token；测试用同值 + AUTH_SECRET 签名成 cookie，避免每次登录新增会话行。 */
export const VISUAL_ADMIN_SESSION_TOKEN = 'visual-admin-session-token'

/** 视觉服务固定管理员账号（仅用于展示与断言，登录走预置会话）。 */
export const VISUAL_ADMIN_EMAIL = 'visual-admin@example.com'

const DAY = 86_400_000
const HOUR = 3_600_000

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    'Mozilla/5.0 (Linux; Android 14; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
]

const IP_ADDRESSES = ['203.0.113.10', '203.0.113.24', '198.51.100.8', '192.0.2.16', '192.0.2.88']

const PEOPLE = [
    { id: 'visual-user-admin', name: '视觉管理员', email: VISUAL_ADMIN_EMAIL, username: 'visualadmin', role: 'admin', banned: 0, days: 180 },
    { id: 'visual-user-01', name: '张伟', email: 'zhang.wei@example.com', username: 'zhangwei', role: 'user', banned: 0, days: 150 },
    { id: 'visual-user-02', name: '李芳', email: 'li.fang@example.com', username: 'lifang', role: 'user', banned: 1, days: 135 },
    { id: 'visual-user-03', name: '王强', email: 'wang.qiang@example.com', username: 'wangqiang', role: 'user', banned: 0, days: 120 },
    { id: 'visual-user-04', name: '刘洋', email: 'liu.yang@example.com', username: 'liuyang', role: 'user', banned: 0, days: 105 },
    { id: 'visual-user-05', name: '陈静', email: 'chen.jing@example.com', username: 'chenjing', role: 'user', banned: 0, days: 90 },
    { id: 'visual-user-06', name: '杨磊', email: 'yang.lei@example.com', username: 'yanglei', role: 'user', banned: 0, days: 75 },
    { id: 'visual-user-07', name: '赵敏', email: 'zhao.min@example.com', username: 'zhaomin', role: 'user', banned: 0, days: 60 },
    { id: 'visual-user-08', name: '黄涛', email: 'huang.tao@example.com', username: 'huangtao', role: 'user', banned: 0, days: 48 },
    { id: 'visual-user-09', name: '周霞', email: 'zhou.xia@example.com', username: 'zhouxia', role: 'user', banned: 0, days: 36 },
    { id: 'visual-user-10', name: '吴鹏', email: 'wu.peng@example.com', username: 'wupeng', role: 'user', banned: 0, days: 24 },
    { id: 'visual-user-11', name: '徐娜', email: 'xu.na@example.com', username: 'xuna', role: 'user', banned: 0, days: 12 },
]

const OAUTH_CLIENTS = [
    {
        id: '00000000-0000-4000-8000-000000000001',
        clientId: 'visual-client',
        name: '视觉测试应用',
        description: '用于视觉基线的演示应用',
        uri: 'https://example.com',
        redirectUris: ['http://127.0.0.1:3100/callback'],
        scopes: ['openid', 'profile', 'email'],
        days: 200,
    },
    {
        id: '00000000-0000-4000-8000-000000000002',
        clientId: 'visual-blog',
        name: '草梅博客',
        description: '博客站点的第三方登录接入',
        uri: 'https://blog.example.com',
        redirectUris: ['https://blog.example.com/auth/callback'],
        scopes: ['openid', 'profile', 'email'],
        days: 120,
    },
    {
        id: '00000000-0000-4000-8000-000000000003',
        clientId: 'visual-shop',
        name: '草梅商城',
        description: '商城订单与会员中心统一登录',
        uri: 'https://shop.example.com',
        redirectUris: ['https://shop.example.com/auth/callback', 'https://shop.example.com/auth/silent'],
        scopes: ['openid', 'profile', 'email', 'phone'],
        days: 45,
    },
]

/** 解析视觉锚点时间；与 `tests/visual/helpers/config.ts` 的 `VISUAL_FIXED_NOW` 同源。 */
export function resolveVisualNow(env = process.env) {
    const raw = env.VISUAL_FIXED_NOW || DEFAULT_VISUAL_NOW
    const date = new Date(raw)

    if (Number.isNaN(date.getTime())) {
        throw new Error(`VISUAL_FIXED_NOW 不是有效时间：${raw}`)
    }
    return date
}

/** SQLite datetime 文本：TypeORM 读取时会按 UTC 解析（`YYYY-MM-DD HH:mm:ss.SSS`）。 */
function toSqliteDate(date) {
    return date.toISOString().replace('T', ' ').replace('Z', '')
}

function hoursBefore(anchor, hours) {
    return new Date(anchor.getTime() - hours * HOUR)
}

function daysBefore(anchor, days) {
    return new Date(anchor.getTime() - days * DAY)
}

function buildUsers(anchor) {
    return PEOPLE.map((person) => ({
        ...person,
        createdAt: daysBefore(anchor, person.days),
        updatedAt: daysBefore(anchor, Math.max(0, person.days - 7)),
    }))
}

function buildAccounts(users) {
    const rows = users.map((user) => ({
        id: `visual-account-credential-${user.id}`,
        userId: user.id,
        providerId: 'credential',
    }))

    const oauthAccounts = [
        ['visual-user-01', 'github'],
        ['visual-user-02', 'github'],
        ['visual-user-03', 'google'],
        ['visual-user-05', 'wechat'],
    ]
    for (const [userId, providerId] of oauthAccounts) {
        rows.push({
            id: `visual-account-${providerId}-${userId}`,
            userId,
            providerId,
        })
    }
    return rows
}

function buildSessions(anchor) {
    const rows = []
    const activityUsers = PEOPLE.filter((person) => person.role !== 'admin')

    for (let index = 0; index < 24; index++) {
        const user = activityUsers[index % activityUsers.length]
        const serial = String(index + 1).padStart(2, '0')
        const createdAt = hoursBefore(anchor, 6 + index * 27)
        const expired = index % 6 === 0

        rows.push({
            id: `visual-session-${serial}`,
            token: `visual-session-token-${serial}`,
            userId: user.id,
            createdAt,
            expiresAt: expired ? hoursBefore(anchor, 6 + index * 27 + 48) : new Date(anchor.getTime() + 20 * DAY),
            ipAddress: IP_ADDRESSES[index % IP_ADDRESSES.length],
            userAgent: USER_AGENTS[index % USER_AGENTS.length],
        })
    }

    /* 管理员会话：既作为 sid 登录态，也是一条「启用中」的登录日志 */
    rows.push({
        id: 'visual-session-admin-auth',
        token: VISUAL_ADMIN_SESSION_TOKEN,
        userId: 'visual-user-admin',
        createdAt: hoursBefore(anchor, 36),
        expiresAt: new Date('2099-01-01T00:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: USER_AGENTS[0],
    })

    return rows
}

function buildSsoProviders(anchor, adminUserId) {
    const oidcConfig = {
        clientId: 'visual-oidc-client',
        clientSecret: 'visual-oidc-secret',
        discoveryEndpoint: 'https://sso.example.com/.well-known/openid-configuration',
        authorizationEndpoint: 'https://sso.example.com/oauth/authorize',
        tokenEndpoint: 'https://sso.example.com/oauth/token',
        userInfoEndpoint: 'https://sso.example.com/oauth/userinfo',
        scopes: 'openid profile email',
    }
    const samlConfig = {
        entryPoint: 'https://hr.example.com/saml/sso',
        certificate: '-----BEGIN CERTIFICATE-----\nVISUAL-BASELINE\n-----END CERTIFICATE-----',
        audience: 'https://auth.example.com/saml/metadata',
        mapping: {
            email: 'urn:oid:1.2.840.113549.1.9.1',
            name: 'displayName',
            firstName: 'givenName',
            lastName: 'surname',
        },
    }

    return [
        {
            id: 'visual-sso-provider-oidc',
            providerId: 'visual-oidc',
            name: '企业办公系统',
            description: '内部员工办公管理系统',
            domain: 'example.com',
            issuer: 'https://sso.example.com',
            type: 'oidc',
            enabled: 1,
            oidcConfig: JSON.stringify(oidcConfig),
            samlConfig: null,
            createdAt: daysBefore(anchor, 90),
        },
        {
            id: 'visual-sso-provider-saml',
            providerId: 'visual-saml',
            name: '人力资源系统',
            description: 'HR 系统，员工信息管理',
            domain: 'hr.example.com',
            issuer: 'https://hr.example.com',
            type: 'saml',
            enabled: 0,
            oidcConfig: null,
            samlConfig: JSON.stringify(samlConfig),
            createdAt: daysBefore(anchor, 30),
        },
    ].map((provider) => ({ ...provider, userId: adminUserId, updatedAt: daysBefore(anchor, 3) }))
}

/**
 * 把确定性夹具写入已建表的空库。
 * @param {import('better-sqlite3').Database} db
 * @param {{ anchor?: Date }} [options]
 */
export function seedVisualDatabase(db, options = {}) {
    const anchor = options.anchor ?? resolveVisualNow()
    const users = buildUsers(anchor)
    const accounts = buildAccounts(users)
    const sessions = buildSessions(anchor)
    const ssoProviders = buildSsoProviders(anchor, 'visual-user-admin')

    const insertUser = db.prepare(`
        INSERT INTO caomei_auth_user
            (id, created_at, updated_at, name, email, email_verified, image, username, display_username,
             is_anonymous, phone_number, phone_number_verified, role, banned, ban_reason, ban_expires, two_factor_enabled)
        VALUES
            (@id, @createdAt, @updatedAt, @name, @email, @emailVerified, @image, @username, @displayUsername,
             0, NULL, 0, @role, @banned, @banReason, NULL, 0)
    `)
    const insertAccount = db.prepare(`
        INSERT INTO caomei_auth_account
            (id, created_at, updated_at, account_id, provider_id, user_id, password)
        VALUES
            (@id, @createdAt, @updatedAt, @accountId, @providerId, @userId, NULL)
    `)
    const insertSession = db.prepare(`
        INSERT INTO caomei_auth_session
            (id, created_at, updated_at, expires_at, token, ip_address, user_agent, user_id)
        VALUES
            (@id, @createdAt, @updatedAt, @expiresAt, @token, @ipAddress, @userAgent, @userId)
    `)
    const insertClient = db.prepare(`
        INSERT INTO caomei_auth_oauth_client
            (id, created_at, updated_at, client_id, client_secret, disabled, scopes, name, description,
             uri, redirect_uris, application_type)
        VALUES
            (@id, @createdAt, @updatedAt, @clientId, NULL, 0, @scopes, @name, @description,
             @uri, @redirectUris, 'web')
    `)
    const insertSsoProvider = db.prepare(`
        INSERT INTO caomei_auth_sso_provider
            (id, created_at, updated_at, issuer, domain, oidc_config, saml_config, provider_id, user_id,
             name, description, enabled, type)
        VALUES
            (@id, @createdAt, @updatedAt, @issuer, @domain, @oidcConfig, @samlConfig, @providerId, @userId,
             @name, @description, @enabled, @type)
    `)

    const seed = db.transaction(() => {
        for (const user of users) {
            insertUser.run({
                id: user.id,
                createdAt: toSqliteDate(user.createdAt),
                updatedAt: toSqliteDate(user.updatedAt),
                name: user.name,
                email: user.email,
                emailVerified: 1,
                image: null,
                username: user.username,
                displayUsername: user.username,
                role: user.role,
                banned: user.banned,
                banReason: user.banned ? '多次违规操作' : null,
            })
        }

        for (const account of accounts) {
            insertAccount.run({
                id: account.id,
                createdAt: toSqliteDate(anchor),
                updatedAt: toSqliteDate(anchor),
                accountId: account.userId,
                providerId: account.providerId,
                userId: account.userId,
            })
        }

        for (const session of sessions) {
            insertSession.run({
                id: session.id,
                createdAt: toSqliteDate(session.createdAt),
                updatedAt: toSqliteDate(session.createdAt),
                expiresAt: toSqliteDate(session.expiresAt),
                token: session.token,
                ipAddress: session.ipAddress,
                userAgent: session.userAgent,
                userId: session.userId,
            })
        }

        for (const client of OAUTH_CLIENTS) {
            insertClient.run({
                id: client.id,
                createdAt: toSqliteDate(daysBefore(anchor, client.days)),
                updatedAt: toSqliteDate(daysBefore(anchor, client.days - 5)),
                clientId: client.clientId,
                scopes: JSON.stringify(client.scopes),
                name: client.name,
                description: client.description,
                uri: client.uri,
                redirectUris: JSON.stringify(client.redirectUris),
            })
        }

        for (const provider of ssoProviders) {
            insertSsoProvider.run({
                id: provider.id,
                createdAt: toSqliteDate(provider.createdAt),
                updatedAt: toSqliteDate(provider.updatedAt),
                issuer: provider.issuer,
                domain: provider.domain,
                oidcConfig: provider.oidcConfig,
                samlConfig: provider.samlConfig,
                providerId: provider.providerId,
                userId: provider.userId,
                name: provider.name,
                description: provider.description,
                enabled: provider.enabled,
                type: provider.type,
            })
        }
    })

    seed()

    return {
        anchor,
        users: users.length,
        accounts: accounts.length,
        sessions: sessions.length,
        // 仅记录夹具数量，不含任何 client secret；命名避免被 CodeQL 误判为敏感字段
        // 日志字段名禁用 oauth / password / secret / token / apiKey 等触发词，否则 js/clear-text-logging 会复发
        applications: OAUTH_CLIENTS.length,
        ssoProviders: ssoProviders.length,
    }
}
