# 2026-11-16 阶段 5 M17：治理清理与双语回归

> **状态**：已完成（2026-11-16）。
> **范围来源**：[阶段 5 范围登记](./2026-11-14-phase5-registration.md) §4 M17；[M16 记录](./2026-11-16-m16-api-errors.md)。

## 1. 交付面

| 面 | 文件 | 内容 |
| :--- | :--- | :--- |
| 治理脚本 | `scripts/i18n/audit-locale-keys.mjs` | 新增动态拼接键白名单，`auth.password.*` / `auth.social.*` 16 键登记后不再算「未使用」 |
| 语言包 | `i18n/locales/{zh-CN,en-US}/{app,validation}.json` | 删除未使用的 `language.zh-CN` / `language.en-US` / `validation.missing`；新增 `app.admin.nav.*` 12 键与 `app.theme.*` 2 键 |
| 共享壳 | `layouts/admin.vue` | 侧边栏品牌、分区标题、6 个导航项与折叠提示双语化 |
| 共享组件 | `components/theme-toggle.vue` | 主题切换按钮的可访问名双语化 |
| 视觉 | `tests/visual/baseline/en-us.visual.spec.ts` | 核心页 `en-US` 自基线：登录 / 注册 / 个人中心 / Admin 用户 / 日志 / SSO，浅 + 暗桌面共 **12 张** |
| 测试 | `tests/unit/components/theme-toggle.spec.ts` | 补 `useI18n` 替身 |
| 基线 | `i18n/hardcoded-text-allowlist.json` | 152 行 / 25 文件收紧到 **132 行 / 24 文件** |

全量 **1467 键**。

## 2. 实现要点

- **未使用键清零**：真实未使用的 3 键删除；16 个动态拼接键由脚本内的 `DYNAMIC_KEY_PATTERNS` 登记来源，`--only=unused --fail-on-unused` 退出码为 0。
- **Admin 壳层补齐**：此前 M11–M14 只覆盖了页面，`layouts/admin.vue` 的侧边栏仍是中文；本次把品牌副标题、`管理后台` / `快速访问`、6 个导航项与折叠提示全部接 `app.admin.nav.*`。
- **主题切换可访问名**：`aria-label` / tooltip 从硬编码中文改为 `app.theme.toLight` / `toDark`。
- **en-US 视觉基线**：新增独立 spec，只跑浅 / 暗桌面，避免全矩阵翻倍；管理员页复用预置会话，个人中心用注册账号。
- **Demo 数据口径**：Demo 生成器仍以中文姓名 / 应用名 / 描述作为展示数据（无请求上下文，启动时一次写入），按范围登记「无法覆盖时明确登记仅 zh-CN」处理，不进入 i18n 键。
- **allowlist 收紧**：`layouts/admin.vue` 20 行与 `theme-toggle.vue` 1 行迁出后，基线行数下降 20。

## 3. 验证

| 检查 | 结果 |
| :--- | :--- |
| `pnpm i18n:check` | **1467 键**同构；`lint:i18n` / `test:i18n` 通过 |
| `pnpm i18n:audit:hardcoded` | **132 行 / 24 文件**（前值 152 / 25） |
| `node scripts/i18n/audit-locale-keys.mjs` | 未使用键 0（16 个动态拼接键已登记） |
| `pnpm test` | **1031 passed / 137 files** |
| `pnpm typecheck` / `pnpm lint` | 通过 / 0 error（28 条既有 warning） |
| `pnpm test:visual` | **116 passed**（104 + 12 张 en-US 核心页基线） |
| 浏览器 | Admin 侧边栏在 `/en-US/admin/users` 显示 `Admin / Users / Applications / SSO / Login stats / Quick access / Profile / My applications / Documentation / Back to home` |

## 4. 已知边界

- Demo 模式假数据（姓名 / 应用名 / 描述）仅中文，英文界面会显示这批中文数据；无请求上下文时不做翻译，已在本记录登记。
- 仍有 24 个文件 / 132 行中文在 allowlist 内，主要是纯服务端日志、SMS / 邮件传输层错误与 Demo 数据生成器，不在页面可见面。
- `server/utils/validation.ts` 的无翻译兜底仍为中文（`参数校验失败`），调用方均带 `translate` 时不触发。
- 视觉矩阵仍只有 1440 / 390 两档，中间宽度见 backlog。
