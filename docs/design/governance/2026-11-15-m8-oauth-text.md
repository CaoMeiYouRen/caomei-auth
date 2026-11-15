# 2026-11-15 阶段 5 M8：OAuth 与授权应用文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M8；[M7 记录](./2026-11-15-m7-security-text.md)。
> **关联**：[国际化实施方案](../../standards/i18n.md) §4。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/oauth/consent.vue` | 加载 / 无效请求 / 同意页三态、应用信息、权限列表、受信任标记、法律提示、拒绝 / 授权按钮；`usePageMeta('oauth.consent.title')` |
| 页面 | `pages/oauth/clients.vue` | 标题与说明、应用卡、授权时间 / 权限、撤销对话框、空态；`usePageMeta('oauth.clients.title','oauth.clients.description')` |
| 组合式函数 | `composables/use-oauth-consent.ts` | scope 描述、应用名兜底、缺失 / 404 / 403 提示、授权与拒绝成功 / 失败 |
| 组合式函数 | `composables/use-oauth-clients.ts` | scope 短标签、列表加载失败、撤销成功 / 失败 |
| 语言包 | `i18n/locales/{zh-CN,en-US}/oauth.json` | **99 键**（中英同构）：common 2 / consent 24 / clients 20 / scopes 35 / flow 18 |

## 2. 实现要点

- **两套 scope 文案**：同意页是句子（「获取您的基本身份信息」），授权列表是短标签（「基本身份信息」），分放 `oauth.scopes.describe.*` 与 `oauth.scopes.label.*`；scope id（含 `user:read` 这类带冒号的）通过字面量映射表转成 camelCase 键，既保持文案不变，也让 `audit-locale-keys` 能扫到完整键名。未知 scope 回退 `oauth.scopes.describe.fallback`（`访问 {scope} 权限`）。
- **法律提示句**：原文把一句话拆成「引言 + 服务条款链接 + 和 + 隐私政策链接 + 结尾」，英文会缺空格。改为按实际存在的链接在 `legalBoth` / `legalTerms` / `legalPrivacy` 三个完整句子里选一个，用 `<i18n-t>` + `#terms` / `#privacy` 插槽渲染；中文文案与原来逐字一致。
- 撤销确认句（「您确定要撤销对 **应用名** 的授权吗？」）同样改 `<i18n-t>` + `#name` 插槽，保留 `<strong>`。
- 应用名兜底（`第三方应用` / `未知应用`）与 scope 描述都走 `useI18nText()`；`console.warn` 改英文。
- 单测补 `use-i18n-text` 替身，并新增「已知 scope 用描述句、未知 scope 走 fallback」的断言。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **683 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 1,061 → **964 行 / 76 文件** |
| `pnpm test` | **995 passed / 130 files**（`use-oauth-consent` 12 例、`use-oauth-clients` 13 例，含新增 scope 断言） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 CSS 415,165 B（累计 +3.86%，本轮无变化）、入口 JS 388,250 B、总 JS 2,223,006 B |
| `pnpm test:visual` | `oauth-consent` 4 张强制重采后与旧基线字节一致（i18n 迁移未改渲染）；`oauth-clients` 4 张重采为同源 token 漂移（3,423 / 3,398 / 197 / 197 px，0 越阈）：差异全部落在右上语言切换器（桌面胶囊底色 `#18181b → #1e1e1e`、浅色箭头右移约 4 px），页面正文无像素变化；verify **104 passed** |
| 浏览器（生产构建） | `/oauth/consent?...` 与 `/en-US/oauth/consent?...`：标题 `授权申请` / `Authorization request`、副标题 `视觉测试应用 正在请求访问您的账户` / `... is requesting access...`、`应用信息` / `Application`、三条 scope 描述中英对应、`拒绝 / 授权` / `Deny / Authorize`；`/oauth/clients` 与 `/en-US/oauth/clients`：`已授权应用` / `Authorized apps`、说明、空态 `暂无授权应用` / `No authorized apps`、`返回个人中心` / `Back to profile`、`了解更多` / `Learn more` |

## 4. 已知边界

- scope 文案是固定映射表，第三方自定义 scope 只显示回退句（与迁移前一致）。
- 应用名 / 描述 / 官网来自数据库与后台录入，不翻译。
- 同意页的「法律提示」块仅在应用配置了 `tosUri` / `policyUri` 时渲染；视觉夹具未配置，故该分支只有单测与代码评审覆盖。
- `oauth` 模块的 `en-US` 视觉基线在 M17 统一补；本次只维护 zh 自基线。
