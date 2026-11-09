/**
 * caomei-ui 迁移期路由白名单。
 *
 * 规则：只有路径命中白名单前缀的路由允许使用 caomei-ui 组件；未登记的路由必须继续使用 PrimeVue，
 * 避免同一路由混用两套组件库（见 docs/design/governance/2026-11-05-caomei-ui-migration-evaluation.md §8）。
 *
 * 初值：`/login`（P2 试点）、`/register`（P3 / M3-1）、`/forgot-password`、`/change-password`、`/quick-login`、`/profile`（M3-2 / M3-3 / M4-1）；P3 / P4 按批次继续登记，P5 收尾时清空并删除本文件。
 */
export const CAOMEI_UI_ROUTE_PREFIXES: readonly string[] = ['/login', '/register', '/forgot-password', '/change-password', '/quick-login', '/profile', '/security', '/oauth/consent']

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
