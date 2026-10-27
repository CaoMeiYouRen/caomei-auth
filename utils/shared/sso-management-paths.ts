/**
 * better-auth SSO 插件的提供商管理端点。
 *
 * 上游 `@better-auth/sso` 的 `/sso/register`、`/sso/update-provider`、
 * `/sso/delete-provider` 等端点只校验登录态，不校验管理员身份。一旦对普通用户开放，
 * 任意登录用户（包括匿名登录）都能注册攻击者自控的 IdP，再借助 `trustEmailVerified`
 * 把该 IdP 返回的受害者邮箱链接到本地已验证账号，从而接管账号
 * （GHSA-785j-54p4-vxw9 / CWE-287）。
 *
 * 因此这些端点必须满足两条约束：
 * 1. 通过 better-auth 的 `disabledPaths` 关闭，列表见 `AUTH_DISABLED_PATHS`；
 * 2. `server/middleware/2-auth.ts` 再做一次管理员校验作为纵深防御。
 *
 * 登录链路（`/sign-in/sso`、`/sso/callback*`、`/sso/saml2/*`）不在此列表中，保持可用。
 */
export const SSO_MANAGEMENT_AUTH_PATHS = [
    '/sso/register',
    '/sso/update-provider',
    '/sso/delete-provider',
    '/sso/request-domain-verification',
    '/sso/verify-domain',
] as const

/** better-auth 默认挂载前缀；`disabledPaths` 使用相对此前缀的路径。 */
export const AUTH_BASE_PATH = '/api/auth'

/**
 * 传给 better-auth `disabledPaths` 的禁用列表。
 *
 * 注意：该选项按路径精确匹配（去掉尾部斜杠后比较），因此新增管理端点时必须
 * 同时补充到 `SSO_MANAGEMENT_AUTH_PATHS`。
 */
export const AUTH_DISABLED_PATHS: string[] = [...SSO_MANAGEMENT_AUTH_PATHS]

/**
 * 判断请求路径是否命中 SSO 提供商管理端点。
 *
 * 归一化规则必须与 better-auth 路由保持一致（WHATWG URL 解析后再去尾部斜杠），
 * 否则 `/api/auth/x/../sso/register`、`/api/auth/sso/./register` 这类点段路径
 * 会在路由层命中管理端点，却绕过本判断。
 *
 * @param path 请求路径（允许包含查询串与尾部斜杠）
 * @returns 命中管理端点返回 true
 */
export function isSsoManagementAuthPath(path: string): boolean {
    let pathname: string
    try {
        pathname = new URL(path, 'http://localhost').pathname
    } catch {
        return false
    }
    const normalized = pathname.replace(/\/+$/, '') || '/'
    return SSO_MANAGEMENT_AUTH_PATHS.some(
        (managementPath) => normalized === `${AUTH_BASE_PATH}${managementPath}`,
    )
}
