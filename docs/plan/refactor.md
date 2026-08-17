# 重构总结（已归档）

本文档记录项目历史上已完成的重构工程。当前规划已迁移至 [roadmap.md](./roadmap.md)、[todo.md](./todo.md) 和 [backlog.md](./backlog.md)。

> **重要变更**：所有未完成的重构目标和 Tech Debt 已迁移至 `backlog.md`。本文档仅保留已完成工作的记录。

---

## 重构目标回顾

| 编号 | 目标 | 状态 | 说明 |
|------|------|------|------|
| G1 | 降低耦合度 | ✅ 完成 | DI 模式引入，邮件/短信/验证码模块解耦 |
| G2 | 控制文件长度（≤ 600 行） | ✅ 完成 | 6 个超大文件均已拆分至 600 行以内 |
| G3 | 提升复用率 | ✅ 完成 | 基础组件库、Composables、Zod 校验体系建立 |
| G4 | 测试覆盖率 ≥ 60% | 🚧 进行中 | 当前 ~17.65%，目标 60%；详见 backlog.md |
| G5 | 文档同步 | ✅ 完成 | 规划/规范文档体系建立并持续维护 |

---

## G1 · 副作用解耦（已完成）

| 文件 | 改造内容 | 完成日期 |
|------|----------|----------|
| `server/utils/email.ts` | 依赖注入 + 工厂模式 + 限流解耦 | 2025-11-19 |
| `server/utils/phone.ts` | Provider 抽象 + 限流逻辑抽离 | 2025-11-20 |
| `pages/login.vue` (1076 → ~300 行) | 抽取 `useLoginFlow` composable | 2025-11-20 |
| `pages/register.vue` (743 → ~300 行) | 抽取 `useRegisterFlow` composable | 2025-11-20 |
| `pages/security.vue` (1109 → ~350 行) | 抽取 `useSecuritySettings` composable | 2025-11-20 |
| `utils/code.ts` | 拆分为 `useOtpDispatcher` + `createOtpService` | 2025-11-20 |

---

## G2 · 文件瘦身（已完成）

| 文件 | 原行数 | 现状 | 完成日期 |
|------|--------|------|----------|
| `pages/admin/oauth/applications.vue` | 2121 | ✅ 已拆分 | 2025-12-03 |
| `pages/admin/users.vue` | 1868 | ✅ 已拆分 | 2025-12-03 |
| `pages/admin/sso/providers.vue` | 1753 | ✅ 已拆分 | 2025-12-03 |
| `pages/profile.vue` | 1199 | ✅ 已拆分 | 2025-12-03 |
| `pages/admin/logs.vue` | 1184 | ✅ 已拆分 | 2025-12-03 |
| `server/utils/email-template.ts` | 922 | ✅ 拆至 278 行 | 2025-12-03 |

ESLint `max-lines` 规则（600 行上限）已配置并在 CI 中执行。

---

## G3 · 复用率提升（已完成）

### 3.1 基础组件库 (`components/base`)

| 组件 | 功能 | 状态 |
|------|------|------|
| `input.vue` | 封装 Label / Error Message / v-model | ✅ |
| `password.vue` | 密码输入 + 显隐切换 | ✅ |
| `phone-input.vue` | 国际区号 + 手机号格式化 | ✅ |
| `table.vue` | 封装 PrimeVue DataTable 统一分页/Loading/空状态 | ✅ |
| `form-group.vue` | Label + Error Message 布局 | ✅ |
| `base-dialog.vue` | Header/Footer/Loading 布局 + 响应式宽度 | ✅ |
| `status-badge.vue` | 统一状态颜色与文案映射 | ✅ |

冗余 Dialog 已通过 `useConfirm()` 消除（`logout-confirm-dialog`、`delete-*-dialog` 等）。

### 3.2 通用 Composables (`composables/core` & `composables/utils`)

| Composable | 功能 | 状态 |
|------------|------|------|
| `useDataTable<T>` | 分页/排序/过滤/加载状态 | ✅ |
| `useForm<T>` | Zod 集成表单状态与校验 | ✅ |
| `useApi<T>` | `useFetch` 封装 + 全局错误处理 | ✅ |
| `useClipboard` | `navigator.clipboard` + Toast | ✅ |
| `useConfirmAction` | `useConfirm` 预设场景封装 | ✅ |
| `usePageMeta` | SEO 标题 + Open Graph | ✅ |
| `useLogout` | 登出逻辑统一封装 | ✅ |
| `useStorage` | 响应式 localStorage（VueUse） | ✅ |

### 3.3 校验规则同构（Zod）

- `utils/shared/validators.ts`：邮箱、密码、手机号等 Zod Schema，前后端共用。
- `composables/core/use-form.ts`：接入 Zod Schema。
- `useLoginFlow`、`useRegisterFlow`、`useForgotPasswordFlow`、`useQuickLoginFlow`：全部接入 Zod Schema。
- Admin 表单（创建用户、OAuth 应用、SSO 提供商）全部接入 Zod Schema。

### 3.4 utils 分层策略

```
utils/shared/**   ← 纯函数，不依赖 Nuxt/Node，前后端共用
utils/web/**      ← 仅客户端使用
server/utils/**   ← 仅服务端使用
```

通过 barrel 文件（index.ts）统一暴露，依赖方向单向（shared ← web/server，禁止反向）。

---

## G5 · 文档体系（已完成）

- `docs/plan/`: 路线图 + Todo + Backlog（本文件系归档后保留）
- `docs/standards/`: 开发规范、API 规范、测试规范、i18n 规范等
- `docs/design/`: 架构设计、数据库设计、UI/UX 设计
- `docs/archive/completed-work.md`: 已完成工作历史记录

PR 模板已包含"文档同步"复选框，Review 检查项已覆盖文档更新。

---

## 未完成项（已迁移）

| 原目标 | 当前状态 | 迁移至 |
|--------|----------|--------|
| 测试覆盖率 ≥ 60% | 🚧 进行中 | [backlog.md](./backlog.md#高优先级影响开发效率) |
| jscpd 重复代码检测 | 待启动 | [backlog.md](./backlog.md#中优先级长期可维护性) |
| Dependency Cruiser 依赖分层验证 | 待启动 | [backlog.md](./backlog.md#中优先级长期可维护性) |
| SonarQube / Codecov 集成 | 待启动 | [backlog.md](./backlog.md#低优先级基础设施完善) |
| Nx / Turborepo 调研 | 待启动 | [backlog.md](./backlog.md#低优先级基础设施完善) |

---

## 验证命令

```bash
# 文件长度检查（max-lines 规则）
pnpm lint

# 类型检查
pnpm typecheck

# 测试覆盖
pnpm test --coverage

# 代码重复检测
pnpm lint:duplicate
```
