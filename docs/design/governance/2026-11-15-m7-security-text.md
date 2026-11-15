# 2026-11-15 阶段 5 M7：安全设置文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M7；[M6 记录](./2026-11-15-m6-profile-text.md)。
> **关联**：[国际化实施方案](../../standards/i18n.md) §4。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/security.vue` | 返回链接、标题、说明；`usePageMeta('security.page.title','security.page.subtitle')` |
| 组件 | `components/security/two-factor-panel.vue` | 2FA 说明、启用 / 禁用态、TOTP 三步引导、验证码输入、备份码区、密码确认对话框 |
| 组件 | `components/security/session-table.vue` | 列头、当前会话标识、撤销 tooltip、三种撤销确认对话框 |
| 组合式函数 | `composables/use-security-settings.ts` | 2FA / 会话操作的全部 Toast、错误详情与确认文案；日期列按 locale 格式化 |
| 语言包 | `i18n/locales/{zh-CN,en-US}/security.json` | **71 键**（中英同构）：page 3 / twoFactor 23 / sessions 26 / flow 19 |

## 2. 实现要点

- 组件统一 `const { t } = useI18n()`；组合式函数用 `useI18nText()`，Toast 的「设置失败：{message}」「禁用失败：{message}」「验证失败：{message}」改插值，`unknownError` 不再拼进中文句子。
- **动态列按 locale 格式化**：会话列表的创建 / 更新 / 过期时间由 `dayjs().format('YYYY-MM-DD HH:mm:ss')` 改为 `formatDateLocale(value, locale)`（`utils/shared/date`），`locale` 直接引用 `nuxtApp.$i18n.locale`（响应式），切换语言后日期列随之重排；脱离 Nuxt 上下文时回退 `zh-CN`。实测 zh：`2026/6/15 12:15:35`，en：`6/15/2026, 12:15:35 PM`；三列为视觉掩码；掩码只隐藏文字，日期串长度变化仍会改变掩码盒几何（见 §3）。
- 会话令牌 tooltip 用 `{id}` 插值；TOTP 二维码 `alt` 也纳入键（`twoFactor.qrAlt`）。
- **视觉会话归一化**：会话表的「浏览器 / 操作系统 / IP」取自登录请求，`page.request` 不继承 context 的 UA，因此 `ensureSession` 显式带 `visualSessionHeaders`（固定 UA Chrome 140 + `x-forwarded-for: 203.0.113.10`）。实测会话行为 `Chrome 140.0.0.0 / Windows 10 / 203.0.113.10`，不再随容器 Chromium 升级或 `::1` / `127.0.0.1` 差异漂移。
- 4 个对话框（2FA 密码确认 + 三种撤销确认）共用 `sessions.cancel` / `sessions.confirm`，避免 8 个重复键。
- 控制台诊断日志（`console.error('获取会话列表失败' …)`）改为英文，与 M5 的 SSO flow 口径一致。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **584 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 1,134 → **1,061 行 / 80 文件** |
| `pnpm test` | **993 passed / 130 files**；`use-security-settings` **25 例**通过（新增「日期不再是固定 `YYYY-MM-DD` 模式」与「切换 locale 后日期列重算」两例，后者经反向验证：把 locale 写死为 `en-US` 时该用例失败） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 CSS 415,165 B（累计 +3.86%，本轮无变化）、入口 JS 388,238 B、总 JS 2,214,052 B |
| `pnpm test:visual` | `security` 6 张状态重采（下表的像素数为「重采前基线 → 当前渲染」，用于归因，不代表现基线仍有差异），差异经逐像素实测归因：`dark-desktop` 3,857 px（切换器令牌 3,379 px + `浏览器` 列 UA 版本串 478 px）；`light-desktop-{enable-2fa-dialog,revoke-all-confirm}` 各 671 px（切换器字形 197 px + 同一 UA 串 474 px）；`dark-mobile` 3,978 px / `light-mobile` 2,630 px（UA 版本串由容器 Chromium 变为固定 Chrome 140，同时 IP 由 `::1` 变为固定 `203.0.113.10`；移动端折行把这两处长度变化放大成掩码盒几何变化，越阈 1,615 / 1,958）。为避免同类噪声，`ensureSession` 已显式带固定 UA 与 `x-forwarded-for`；verify 连续两次 **104 passed**（含全量 `--update-snapshots=all` 重采后无像素变化） |
| 浏览器（生产构建） | `/security`：`账号安全设置 - 草梅 Auth`、标题与说明、两段标题（双因素认证 / 会话管理）、6 个表头 + 1 个空操作列中文化、`返回个人中心`、`启用双因素认证`、`撤销其他会话`、`撤销所有会话`；`/en-US/security`：`Account security - Caomei Auth`、`Two-factor authentication` / `Session management`、`Session token` / `Browser` / `Operating system` / `IP address` / `Created` / `Expires`、`Back to profile` 等；日期列 zh `2026/6/15 12:15:35` / en `6/15/2026, 12:15:35 PM` |

## 4. 已知边界

- 会话的浏览器 / 操作系统名来自 `utils/shared/useragent`（品牌名，不翻译）。
- 备份码文件名（`<ts>-2fa-backup-codes.txt`）保持 ASCII，不随语言变化。
- 2FA 的 TOTP 二维码内容与备份码本身不含文案；`showTotpSetup` 状态需要真实 2FA 流程，未纳入视觉矩阵（阶段 3 已登记为环境限制）。
- `security` 的 `en-US` 视觉基线在 M17 统一补；本次只维护 zh 自基线。
