# 2026-11-06 阶段 3 范围登记：caomei-ui P2–P3 迁移与 i18n 非组件面

> **状态**：已授权启动（2026-11-06 用户选择方向 A「组件库 P2–P3」，并补充「可以先处理组件之外的国际化」；2026-11-08 用户授权插队 M0「发布链路原生多架构」，方案 C 复用工作流）。
> **单一事实源**：阶段范围与原子条目见 [todo.md](../../plan/todo.md)；交付摘要收口后归档至 [已完成工作归档](../../archive/completed-work.md)；候选详情见 [backlog.md](../../plan/backlog.md)；阶段方向见 [roadmap.md](../../plan/roadmap.md)。
> **准入规则**：[规划规范](../../standards/planning.md)。迁移批次依据 [caomei-ui 迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §8；i18n 依据 [国际化实施方案](../../standards/i18n.md) §8。

## 1. 阶段目标

1. **启动 caomei-ui 正式替换（P2–P3）**：以登录页为试点完成整页切换，再按业务域迁移认证入口、个人、安全、OAuth 与 SSO 页面，每个路由整页切换、独立提交、独立回滚。
2. **并行推进 i18n 非组件面**：只处理与页面组件无文件交集的国际化前置与能力（Zod 错误本地化、校验错误键、治理脚本、服务端错误消息），不改 `.vue` 页面文案，避免与组件迁移在同一批文件上二次改写。
3. **插队修复发布链路（M0）**：将 Docker 多架构构建统一到复用工作流，`release.yml` 去 QEMU，`docker-publish.yml` 的 `mode=build` 改用原生 matrix + merge。触发依据见 §2.1。

**排序依据**：迁移评估 §8.2 明确建议组件迁移先行；本阶段把 i18n 中不触碰页面的部分并行推进，既不违反该结论，也不阻塞后续 i18n M2。

## 2. 阶段构成（6 条主线 / 16 条原子条目 + M0 插队批次 4 条）

| 主线 | 原子条目 | 交付面 |
| :--- | :--- | :--- |
| **M0 发布链路插队（不计入主线）** | M0-1 新增 `docker-build.yml` 复用工作流；M0-2 `docker.yml` 改为调用；M0-3 `release.yml` 去 QEMU；M0-4 `docker-publish.yml` build 路径修复 | 4 个 workflow、[评估记录](./2026-11-08-native-multiarch-docker-review.md)、验证与回滚说明 |
| **M1 迁移准备与决策** | M1-1 用量快照复测、白名单与包体基线复核（含 1.0.0 → 1.2.0 升级验证） | `pnpm migration:usage` 快照、`CAOMEI_UI_ROUTE_PREFIXES`、`keyCss` / entry chunk / 总 JS 基线、[1.2.0 复核记录](./2026-11-08-caomei-ui-1.2.0-revaluation.md) |
| | M1-2 P2 视觉基线采集与差异清单（`/login`） | 浅色 / 暗色 × 桌面 / 移动 × 默认 / 校验错误 / 2FA / 验证码状态；差异清单 |
| | M1-3 DatePicker range 与 Toast 语气样式决策裁定（2026-11-08 按 1.2.0 修订） | 回写迁移评估 §6.3 / §7.3；更新 §12 上收条件 |
| **M2 P2 登录页试点** | M2-1 登录页整页迁移 + login 专用 V2 薄封装 | `pages/login.vue`、按需 V2 封装、白名单 `/login` |
| | M2-2 试点回归与白名单登记 | 测试 mock 改写、视觉差异归因、SSR / hydration、定向测试 |
| **M3 P3 认证入口页** | M3-1 注册页迁移 | `pages/register.vue` 及消费者封装 |
| | M3-2 忘记密码 / 重置密码 / 修改密码迁移 | `forgot-password.vue`、`change-password.vue` 及相关组件 |
| | M3-3 快速登录迁移与认证页 Toast / Confirm 切换 | `quick-login.vue`、认证相关 `useToast` / `useConfirm` 显式 import |
| **M4 P3 个人、安全、OAuth、SSO** | M4-1 个人资料页迁移 | `pages/profile.vue` 及消费者封装 |
| | M4-2 安全设置页迁移（2FA / 会话 / 账号绑定） | `pages/security.vue`；超阈值时按 2FA、会话、绑定拆条 |
| | M4-3 OAuth 同意页迁移 | `pages/oauth/consent.vue`（`oauth/clients` 仍在 P4） |
| | M4-4 SSO 登录页迁移 | `pages/sso-login.vue` |
| **M5 i18n 非组件面** | M5-1 Zod 错误本地化前置 | 移除 74 处（评估口径）schema 级中文 `message`；补齐 `validation.*` 全量键（`zh-CN` / `en-US` 同构） |
| | M5-2 i18n 治理脚本与门禁 | `scripts/i18n/audit-*.mjs`、`i18n:audit:*`、`i18n:check-*`、CI 与 `lint-staged` 接入 |
| | M5-3 服务端错误消息接入（认证类试点） | `errors.*` 键、`useTranslation(event)`、`Content-Language` / `Vary`；不可用时回退并登记 |
| **M6 阶段收口** | M6-1 批次收口与质量门 | 白名单、包体复测、迁移记录、文档同步、回退验证 |

## 3. 已裁定决策项

| 决策项 | 结论 | 理由与后续 |
| :--- | :--- | :--- |
| `DatePicker` 范围选择 | 使用 **1.2.0 `selectionMode="range"`**（2026-11-08 复核后修订，替代双日期选择器方案） | 上游已实现 range，避免双选择器 UX 与额外状态；`admin/logs` 在 P4 迁移时改用 `@update:model-value` 触发筛选；无 `showClear` / `manualInput`，清空交互纳入 P4 视觉 / 交互回归 |
| Toast 逐语气样式 | **token 映射** `success` / `warning` / `danger` 的 bg / border / text / shadow；`info` 走 `neutral` 默认；不建薄封装 | 1.2.0 的 16 个 token 已覆盖实际用色；圆角 / 内边距 / 标题字号 / 描述色不可覆盖，登记为有意差异；`secondary` / `contrast` 无调用点，随迁移删除 |
| 表单布局 | 已迁移路由可用 `CaomeiFormItem` 替换 `BaseFormGroup`；`CaomeiForm` 仅在需要原生 submit 编排时使用 | 1.1.0 提供布局 / aria 组合层，无 rules 引擎；`useForm` + Zod 校验契约不变 |
| DataTable 密度 | 用 1.2.0 的 cell padding / selection width token 覆盖，不等待 `size` prop | 1.2.0 未新增 `size` prop；逐表视觉登记 |

> 依据：[1.2.0 复核记录](./2026-11-08-caomei-ui-1.2.0-revaluation.md)｜[迁移评估](./2026-11-05-caomei-ui-migration-evaluation.md) §6.3 / §7.3。

### 2.1 M0 为何插队

- **依据**：[AGENTS.md §5.1.2](../../../AGENTS.md#51-迭代中途发现事项处理规则) 的「阻塞当前交付 / 明确功能回归」。
- **证据**：`release.yml` 最近一次运行（[42371386469](https://github.com/CaoMeiYouRen/caomei-auth/actions/runs/42371386469)）在 `Build and push Docker images` 触 90 分钟上限被取消，semantic-release 已成功但镜像未发布；`docker-publish.yml` 的 `mode=build` 无 QEMU，arm64 阶段无法执行 Dockerfile `RUN`。
- **方案**：用户 2026-11-08 选择方案 C（提取 reusable workflow）。`docker-build.yml` 承担 matrix + digest + merge；`docker.yml`、`release.yml`、`docker-publish.yml` 只保留触发、tag 策略与部署差异。`docker.yml` 的架构 matrix / digest / merge 语义保持不变。
- **范围外**：不改 Dockerfile、不改 `retag` 默认路径、不涉及其他仓库。

## 4. 验收标准

- **M1**：用量快照可复现；白名单与包体基线与阶段 2 记录一致或有归因；P2 视觉基线覆盖矩阵，差异清单可逐项对照。
- **M0**：`release.yml` 主路径无 `setup-qemu-action`，`build` matrix 为 amd64 / arm64 原生 runner；`docker-publish.yml` `mode=build` 不再单 runner 构建双架构，`mode=retag` 行为不变；`docker.yml` 行为不变；`imagetools inspect` 显示 amd64 + arm64，版本 / `latest` / 日期 / `sha-*` 指向同一 manifest；各架构缓存 scope 独立；全量 lint / typecheck / test / build 通过。工作流改动只能在推送后由 `workflow_dispatch` / push 验证，未验证前不得标记完成。**2026-11-08 进展**：`docker-build.yml`、`docker.yml` 构建 / merge、`docker-publish` rebuild / retag 均已跑通；`docker.yml` deploy 的 README 缺失已修复并复跑通过（README + Jenkins 两步）；`release.yml` 未单独运行，下一次定时（2026-11-14 20:00 UTC+8）或手动 dispatch 会正式发版并完成验证。证据见 [复核记录](./2026-11-08-native-multiarch-docker-review.md) §5.2。
- **M2**：`/login` 无 PrimeVue 在册组件族残留；浅色 / 暗色视觉差异全部归因，「待修」清零；定向测试、SSR / hydration 通过；白名单只登记已迁移路由。
- **M3 / M4**：每个迁移路由内无两套组件混用；表单校验、提交、2FA、Toast / Confirm、OAuth 同意、SSO 登录行为与迁移前一致；a11y 与暗色通过；每批独立提交并可单独回滚。
- **M5**：0 处 schema 级中文 `message`；`validation.*` 键 parity 100%；审计脚本可运行并接入 CI / `lint-staged`；认证类 API 在 `en-US` 下返回英文错误并带 `Content-Language`，不可用时显式登记回退。
- **全阶段**：`pnpm lint` / `pnpm lint:css` / `pnpm typecheck` / `pnpm test` / `pnpm build` 通过；无未关闭 blocker 进入提交。

## 5. 依赖与风险

| 项 | 说明 |
| :--- | :--- |
| caomei-ui 版本 | 精确锁定 `1.2.0`（2026-11-08 由 1.0.0 升级并复测 typecheck / build），Dependabot `ignore` 同步为 `>1.2.0`；后续升级仍走人工批次并重跑回归 |
| 视觉基线 | 两层：参考态（迁移前，`tests/visual/reference/`）+ 自基线（当前接受态，`tests/visual/__screenshots__/`），见 [视觉参考态基座](./2026-11-08-visual-baseline-harness.md)；CI 门禁已接入（容器固定，自基线阻断 / 参考态报告） |
| DatePicker / Toast | 决策已按 1.2.0 修订（range 直接迁移、Toast token 映射）；上游 #28 中 DataTable 密度 / 选择列宽度已交付，Paginator 报表仍为自渲染 |
| Toast / Confirm 双 Provider | 认证页 6 个 composable 已切到 caomei `useToast`（`app.vue` 双挂载，PrimeVue 侧保留给未迁移页）；其余页面仍用 PrimeVue，P4/P5 逐批切换；`migration:check-imports` 守卫 |
| 安全设置页体量 | 596 行，含 2FA / 会话 / 绑定；若超出原子条目阈值（10 文件 / 800 行新增）必须拆条 |
| i18n 服务端 | `useTranslation(event)` 属 experimental；若 Nuxt 4.6.3 下不稳定，保留中文兜底并登记，不阻塞组件迁移 |
| M0 复用工作流 | `docker-build.yml` 需 `packages: write`，调用方显式映射 4 个 secrets（Docker Hub / ACR）。工作流语义只能在推送后验证，本地仅做 YAML / 表达式静态检查与项目质量门 |
| M0 arm runner | `ubuntu-24.04-arm` 已在 `docker.yml` 稳定使用；若 runner 不可用，构建失败并暴露，不静默只发 amd64 |
| M0 多 registry | Docker Hub 作为 digest 源，merge 用 `imagetools create` 跨 registry 复制；ACR 保持 `provenance:false` / `sbom:false` |
| 混语言窗口 | 本阶段不翻译页面文案；`en-US` 下认证类 API 错误（试点；`useTranslation` 不可用时中文兜底并登记）与表单校验错误为英文，页面静态文案仍为中文。`en-US` 保持 `ui-ready`，不进入 sitemap / SEO 放量 |
| 并行冲突 | i18n 主线只改 `utils/shared`、`i18n/`、`scripts/`、`server/api`、`server/utils`，以及新增脚本所需的 `package.json`、`lint-staged` 与 `.github/workflows`；不改 `.vue` 页面文案 |

## 6. 明确不做

- P4 Admin 数据页与剩余页面迁移、P5 卸载 PrimeVue。
- 页面 / 组件文案翻译（i18n M2）、邮件模板与 `User.locale`（i18n M4）、SEO / sitemap 放量（i18n M5）。
- 修改 Dockerfile 构建阶段 / 依赖安装方式；修改其他仓库的发布链；新增统一 action。
- 时区设置、注册控制、Admin 日志高级筛选、性能审计、Demo 数据增强。
- UI 改版、交互重设计、PrimeVue 5.x 升级。
