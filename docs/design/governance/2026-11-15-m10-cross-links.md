# 2026-11-15 阶段 5 M10：个人中心 ↔ 授权应用 / 安全设置互联

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M10；[backlog §2.10](../../plan/backlog.md)（已上收，条目已移出候选表）；[M9 记录](./2026-11-15-m9-static-text.md)。

## 1. 交付面

| 页面 | 入口 | 返回 |
| :--- | :--- | :--- |
| `/profile` | 头部 `授权应用`、`安全设置`（既有） | — |
| `/security` | 头部新增 `授权应用` | `返回个人中心`（既有） |
| `/oauth/clients` | 头部新增 `安全设置` | `返回个人中心`（既有） |

- 三个子页互达只需一步：`安全设置 → 授权应用 → 安全设置`；每个子页都能一步回到个人中心。
- 两页头部按钮组在基础规则补 `display:flex` / `flex-wrap` / `gap`（全视口生效，移动端列方向下自然换行）；`/profile` 的 `profile-header-actions` 同时补 `flex-wrap`，修复 390 px 下四按钮逐字换行。
- 文案复用现有键：`security.page.back/oauthClients`、`oauth.clients.backProfile/security`，新增 2 键（`security.page.oauthClients`、`oauth.clients.security`）。

## 2. 实现要点

- `useSecuritySettings()` 新增 `goOAuthClients()`（`navigateTo('/oauth/clients')`），`useOAuthClients()` 新增 `goSecurity()`（`navigateTo('/security')`），与既有 `goProfile()` 同构。
- 无认证 / 权限变更：三页仍在 `auth.global.ts` 的登录态保护下，白名单未扩大。
- 按钮样式沿用各页既有头部按钮（`variant="ghost"` / `secondary` + 图标），不引入新组件；`/security` 去掉遗留 `btn` 类（全局 `.btn { width:100% }` 会把按钮撑成 180 px 定宽），改由页面作用域 `btn-link` 控制。
- 跨模块同值文案（`security.page.oauthClients` ↔ `profile.header.oauth`、`oauth.clients.security` ↔ `profile.header.security`）沿用「各自建键」口径：页面只加载自己的模块，跨模块引用会让懒加载缺键。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | 846 键同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 823 行 / 69 文件不变 |
| `pnpm test` | **1000 passed / 131 files**（新增两个导航方法断言） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error |
| `pnpm build` / 预算 | 通过；入口 JS 388,609 B、总 JS 2,242,008 B（CSS 1,470,147 B，含新增按钮组样式） |
| `pnpm test:visual` | `profile` / `security` / `oauth-clients` 共 15 个状态以 `--update-snapshots=all` 重采（头部新增按钮、按钮组换行与 `/security` 按钮宽度修正），15 张全部变化；verify **104 passed** |
| 浏览器（生产构建，登录态，1440 与 390） | `/profile` 头部 `显示详情 / 授权应用 / 安全设置 / 退出登录`；`/security` 头部 `返回个人中心 / 授权应用`；`/oauth/clients` 头部 `返回个人中心 / 安全设置`；点击 `安全设置 → 授权应用 → 安全设置` 均一步跳转且标题正确（`账号安全设置 - 草梅 Auth` ↔ `已授权应用 - 草梅 Auth`） |

## 4. 已知边界

- 「一步返回」指向个人中心；子页之间不提供返回上一页按钮（避免与浏览器返回语义重复）。
- `/security` 的修改密码入口仍从个人中心底部进入（M10 只收口三个页面的互联）。
- `/profile` 头部在 1440 px 为 3+1 两行（容器宽 480 px），`/security`、`/oauth/clients` 为单行；`600–1439` 中间宽度的换行行为无基线覆盖，已登记 backlog「视觉矩阵补中间宽度（768 / 1024）」。
- `en-US` 视觉基线在 M17 统一补。
