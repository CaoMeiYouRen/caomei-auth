/** better-auth 默认挂载前缀；`disabledPaths` 使用相对此前缀的路径。 */
export const AUTH_BASE_PATH = '/api/auth'

/** OAuth 动态客户端注册端点（绝对路径）。 */
export const OAUTH_REGISTRATION_AUTH_PATH = `${AUTH_BASE_PATH}/oauth2/register`

/**
 * 把请求路径归一化为 WHATWG URL 语义下的 pathname。
 *
 * h3 的 `event.path` 保留 `req.url` 的原始形态（只做百分号解码），而 better-auth
 * 用 `new URL(request.url).pathname` 匹配路由，两者对点段的处理不一致：
 * `/api/auth/oauth2/./register` 在中间件看来不是注册端点，在路由层却是。
 * 所有基于请求路径的鉴权判断都必须先经过本函数，再与目标路径比较。
 *
 * 归一化规则：折叠 `.` / `..` / `%2e` 点段、丢弃查询串与 hash、去掉尾部斜杠。
 *
 * @param path 请求路径（可包含查询串、hash 与尾部斜杠）
 * @returns 归一化后的 pathname；无法解析时返回 `/`
 */
export function normalizeAuthPath(path: string): string {
    let pathname: string
    try {
        pathname = new URL(path, 'http://localhost').pathname
    } catch {
        return '/'
    }
    return pathname.replace(/\/+$/, '') || '/'
}

/**
 * 判断请求路径是否命中 OAuth 动态客户端注册端点。
 *
 * 背景：GHSA-2r7m-492j-p8xm。`server/middleware/2-auth.ts` 早期用
 * `event.path.startsWith('/api/auth/oauth2/register')` 做管理员门禁，点段路径
 * （如 `/api/auth/oauth2/./register`）会在路由层归一化后命中注册端点，却绕过门禁。
 *
 * @param path 请求路径（允许包含查询串与尾部斜杠）
 * @returns 命中注册端点返回 true
 */
export function isOAuthRegistrationAuthPath(path: string): boolean {
    return normalizeAuthPath(path) === OAUTH_REGISTRATION_AUTH_PATH
}

/**
 * OAuth 客户端自助管理端点（相对 `AUTH_BASE_PATH`）。
 *
 * 上游 `@better-auth/oauth-provider` 的这些端点只挂 `sessionMiddleware`；未配置
 * `clientPrivileges` 时，任意会话（包括匿名会话）都能创建、读取、更新、删除客户端，
 * 其中 `/oauth2/create-client` 与动态注册影响面相同：可注册攻击者自控 `redirect_uris`
 * 的客户端。
 *
 * 注意：`/admin/oauth2/create-client`、`/admin/oauth2/update-client` 标记为
 * `SERVER_ONLY`，不会挂载到 HTTP 路由，因此不在此列表中。
 *
 * 本项目只允许通过 `/api/admin/oauth/applications` 管理应用，因此这些端点必须
 * 加入 `AUTH_DISABLED_PATHS`，并由中间件追加管理员校验作为纵深防御。
 */
export const OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS = [
    '/oauth2/create-client',
    '/oauth2/get-client',
    '/oauth2/get-clients',
    '/oauth2/update-client',
    '/oauth2/delete-client',
    '/oauth2/client/rotate-secret',
] as const

/**
 * 判断请求路径是否命中 OAuth 客户端自助管理端点。
 *
 * @param path 请求路径（允许包含查询串与尾部斜杠）
 * @returns 命中管理端点返回 true
 */
export function isOAuthClientManagementAuthPath(path: string): boolean {
    const normalized = normalizeAuthPath(path)
    return OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS.some(
        (managementPath) => normalized === `${AUTH_BASE_PATH}${managementPath}`,
    )
}
