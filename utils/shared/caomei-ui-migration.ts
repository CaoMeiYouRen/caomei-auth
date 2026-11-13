/**
 * caomei-ui 迁移期路由白名单。
 *
 * 规则：只有路径命中白名单前缀的路由允许使用 caomei-ui 组件；未登记的路由必须继续使用 PrimeVue，
 * 避免同一路由混用两套组件库（见 docs/design/governance/2026-11-05-caomei-ui-migration-evaluation.md §8）。
 *
 * 阶段 3 最终白名单（P2–P3）：`/login`（M2-1）、`/register`（M3-1）、`/forgot-password`、
 * `/change-password`（M3-2）、`/quick-login`（M3-3）、`/profile`（M4-1）、`/security`（M4-2）、
 * `/oauth/consent`（M4-3）、`/sso-login`（M4-4）。
 * 阶段 4（P4）：`/admin/users`（M2 页面 + M3 对话框）、`/admin/oauth/applications`
 * （M4 页面 + M5 对话框）、`/admin/sso/providers`（M6 页面 + M7 表单 + M8 对话框，均整路由切齐后登记）；
 * 其余 Admin 路由与 `/oauth/clients` 未登记；P5 收尾时清空并删除本文件。
 */
export const CAOMEI_UI_ROUTE_PREFIXES: readonly string[] = ['/login', '/register', '/forgot-password', '/change-password', '/quick-login', '/profile', '/security', '/oauth/consent', '/sso-login', '/admin/users', '/admin/oauth/applications', '/admin/sso/providers']

/**
 * 判断路径是否命中 caomei-ui 白名单。
 *
 * 前缀按路径段匹配：`/login` 命中 `/login` 与 `/login/xxx`，不命中 `/login-extra`。
 */
export function isCaomeiUiRoute(path: string, prefixes: readonly string[] = CAOMEI_UI_ROUTE_PREFIXES): boolean {
    const pathname = path.split(/[?#]/u)[0] || '/'

    return prefixes.some((prefix) => {
        const normalized = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix
        if (!normalized) {
            return false
        }
        return pathname === normalized || pathname.startsWith(`${normalized}/`)
    })
}
