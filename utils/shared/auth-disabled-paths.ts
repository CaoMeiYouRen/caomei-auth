import { OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS } from './auth-paths'
import { SSO_MANAGEMENT_AUTH_PATHS } from './sso-management-paths'

/**
 * 传给 better-auth `disabledPaths` 的禁用列表（相对 `AUTH_BASE_PATH`）。
 *
 * 该选项按路径精确匹配（去掉尾部斜杠后比较），因此新增管理端点时必须同时补充到
 * 对应来源列表（`SSO_MANAGEMENT_AUTH_PATHS` / `OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS`）。
 *
 * 当前包含两类上游端点：
 * 1. SSO 提供商管理端点：`@better-auth/sso` 只校验登录态（GHSA-785j-54p4-vxw9）。
 * 2. OAuth 客户端自助管理端点：`@better-auth/oauth-provider` 只校验登录态，
 *    `/oauth2/create-client` 可被任意会话（含匿名）用于注册攻击者 redirect_uri 的客户端
 *    （GHSA-2r7m-492j-p8xm 同源问题）。
 *
 * 本项目统一通过管理端接口维护这两类资源：
 * - SSO 提供商：`/api/admin/sso/providers`
 * - OAuth 应用：`/api/admin/oauth/applications`
 */
export const AUTH_DISABLED_PATHS: string[] = [
    ...SSO_MANAGEMENT_AUTH_PATHS,
    ...OAUTH_CLIENT_MANAGEMENT_AUTH_PATHS,
]
