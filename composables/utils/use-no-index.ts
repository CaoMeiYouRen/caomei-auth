import { useHead } from '#imports'

/**
 * 登录后页面 / 管理端 / OAuth 授权页不应被搜索引擎索引。
 *
 * 与 `robots.txt` 的 Disallow 双保险：外链或站点地图仍可能抓到这些 URL，
 * 页面级 `noindex` 才能确保不进入索引。
 */
export function useNoIndex(): void {
    useHead({
        meta: [
            { name: 'robots', content: 'noindex, nofollow' },
        ],
    })
}
