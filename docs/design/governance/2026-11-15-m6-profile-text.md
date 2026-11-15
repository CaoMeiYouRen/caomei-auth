# 2026-11-15 阶段 5 M6：个人中心文案

> **状态**：已完成（2026-11-15）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M6；[M5 记录](./2026-11-15-m5-sso-error-reset.md)。
> **关联**：[国际化实施方案](../../standards/i18n.md) §4。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 页面 | `pages/profile.vue` | `AuthLeft` 标题 / 副标题、`usePageMeta('profile.page.title','profile.page.subtitle')` |
| 组件 | `profile-header` / `profile-footer-actions` / `user-basic-info` / `user-contact-info` / `social-accounts` / `user-avatar`（6 个） | 标题、按钮与 tooltip、字段标签、隐私模式文案对、未绑定 / 已验证状态、社交账号绑定与解绑提示 |
| 对话框 | `edit-email-dialog` / `edit-phone-dialog` / `set-username-dialog`（3 个） | 标题（修改 / 绑定）、输入提示、占位符、提交按钮与全部 Toast |
| 组合式函数 | `composables/use-profile-flow.ts` | 账号加载 / 绑定 / 解绑 / 保存 / 登出错误与确认文案，全部走 `useI18nText()` |
| 语言包 | `i18n/locales/{zh-CN,en-US}/profile.json` | **116 键**（中英同构）：page 2 / header 12 / basic 11 / contact 21 / social 4 / avatar 6 / actions 4 / emailDialog 13 / phoneDialog 13 / usernameDialog 8 / flow 22 |

第三方登录提供商的名称、域名与账号 ID 来自服务端与用户数据，不做翻译；`{name}` / `{provider}` / `{accountId}` / `{size}` 等动态值走命名插值。

## 2. 实现要点

- 组件与对话框统一 `const { t } = useI18n()`；flow 用 `useI18nText()`（与 M4 的 composable 口径一致，单测通过 `tests/mocks/i18n-text.ts` 断言真实中文）。
- 隐私模式的两组文案（开启 / 关闭提示、按钮「隐私模式 / 显示详情」）与邮箱 / 手机号的「已隐藏」提示分别建键，避免用模板字符串拼接。
- 头像上传的「文件大小不能超过 {size}」改用插值，`MAX_UPLOAD_SIZE_TEXT` 不再拼进中文句子。
- 社交账号按钮与 tooltip 的「绑定 / 解绑 + provider 名称 + 账号 ID」全部改插值；确认解绑与退出登录的 `confirm.open` 标题 / 描述同步。
- 删除页面里重复的「个人中心 / 管理您的账号信息」硬编码，标题统一由 `usePageMeta` 输出（`个人中心 - 草梅 Auth` / `Profile - Caomei Auth`）。
- 三个对话框的 tooltip 与按钮文案分键（`submitTip` / `submit`）；邮箱对话框补 `submitTip`，保持与手机号 / 用户名对话框对称。
- 移除手机号「绑定」按钮上不可达的 toast 分支（按钮 `disabled` 时不会派发 click），原因统一由 tooltip 解释；头像改为装饰性 `alt=""`，可访问名由按钮 `label` 承担。
- 审计口径：本批 20 个文件属「单模块同型机械抽取」，与 `todo.md` M6 单原子条目一一对应（语言包成对、无逻辑分支变化），按模块级 i18n 抽取豁免，不再拆分。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **513 键**同构；`lint:i18n` / `test:i18n` 通过；硬编码基线 1,250 → **1,134 行 / 84 文件** |
| `pnpm test` | **993 passed / 130 files**（`use-profile-flow` 18 例通过语言包替身断言真实中文） |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（25 条既有 warning） |
| `pnpm build` / 预算 | 通过；入口 CSS 415,165 B（相对 P0 累计 +3.86%，本轮无变化）、入口 JS 388,274 B（较 M5 +6 B）、总 JS 2,207,008 B（较 M5 +11,544 B，全部来自新增语言包） |
| `pnpm test:visual` | `profile` 默认态 4 张与隐私态 1 张强制重采；差异只有 3 / 12 / 22 px 的子像素抗锯齿（0 个越阈像素），文案与布局未变；verify **104 passed** |
| 浏览器（生产构建） | `/profile`：标题 `个人中心 - 草梅 Auth`、`个人资料`、邮箱 / 手机号 / 第三方账号标签、`保存修改`、隐私模式切换为「隐私模式」；`/en-US/profile`：`Profile - Caomei Auth`、`Show details`、`Authorized apps`、`Security`、`Sign out`、`Email` / `Phone` / `Linked accounts`、`Save changes`；邮箱对话框 `绑定邮箱` / `Link email`（按钮 `发送验证链接` / `Send verification link`、占位符一致）；手机号对话框 `绑定手机号` / `Link phone`；隐私模式按钮切换后文案同步 |

## 4. 已知边界

- 第三方提供商名称来自 `/api/social/providers`（服务端配置字段），本轮不翻译；服务端文案面在 M16 统一。
- 手机号国家 / 地区名沿用 `phone-input-v2` 的内建文案（M1 已接 caomei-ui locale 桥接）。
- 隐私模式偏好存 `localStorage`（`caomei-auth-privacy-mode`），与文案无关，键名不变。
- `profile` 的 `en-US` 视觉基线在 M17 统一补；本次只维护 zh 自基线。
