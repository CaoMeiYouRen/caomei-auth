# 项目待办 (Todo List)

本文档只承载已获授权启动的当前阶段原子条目；准入、流转与归档规则见 [规划规范](../standards/planning.md)。已完成工作见 [已完成工作归档](../archive/completed-work.md)，未完成候选统一见 [backlog.md](./backlog.md)。

## 当前状态

**当前进行中阶段：阶段 3「caomei-ui P2–P3 迁移与 i18n 非组件面」**（2026-11-06 用户选择方向 A，并补充「可以先处理组件之外的国际化」；2026-11-08 授权插队 M0 发布链路修复）。

- 范围与验收口径的单一事实源：[阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)
- 构成：**6 条主线 / 16 条原子条目 + M0 插队批次 4 条**（迁移准备 3 / P2 试点 2 / 认证入口 3 / 个人与安全 4 / i18n 非组件面 3 / 收口 1；M0 不计入主线）
- 边界：**只做 P2–P3 页面替换、非组件 i18n 与发布链路修复**，不翻译页面文案、不做 P4 Admin、不卸载 PrimeVue、不做体验与性能项。

## 阶段 3 原子条目

### M0 发布链路插队（2026-11-08 授权，不计入主线）

| 编号 | 条目 | 交付面 | 状态 |
| :--- | :--- | :--- | :--- |
| M0-1 | 新增 `docker-build.yml` 复用工作流 | matrix + digest + merge、参数化 ref / tags / registry / cache scope | 已验证（release 路径除外；`docker.yml` 42460267112、`docker-publish` 42461119392 / 42461601204） |
| M0-2 | `docker.yml` 改为调用复用工作流 | 保持 latest / 日期 / `sha-*`、README 同步与 Jenkins 顺序 | 已验证（42468248687：构建 / merge / README 同步 / Jenkins 两步全部通过） |
| M0-3 | `release.yml` 去 QEMU | `release` 输出 tag → `docker` 调用复用工作流；保留 semver / latest / 日期 / `sha-*` | 待验证（定时 2026-11-14 20:00 UTC+8 或手动 dispatch 会正式发版） |
| M0-4 | `docker-publish.yml` build 路径修复 | `prepare` / `retag` / `docker` / `verify` 拆分；retag 默认路径不变 | 已验证（rebuild 42461119392、retag 42461601204 显式 source；prepare 自动判定未单独跑） |

### 主线原子条目

| 编号 | 条目 | 交付面 | 状态 |
| :--- | :--- | :--- | :--- |
| M1-1 | 用量快照复测、白名单与包体基线复核（含 1.0.0 → 1.2.0 升级验证） | `pnpm migration:usage` 快照、`CAOMEI_UI_ROUTE_PREFIXES`、`keyCss` / entry chunk / 总 JS 基线 | 已完成（2026-11-08：30 族 / 301 标签 / 50 文件；entry JS 431,270 B、keyCss 399,733 B；白名单空集） |
| M1-2 | P2 视觉基线采集与差异清单（`/login`） | 浅色 / 暗色 × 桌面 / 移动 × 默认 / 校验错误 / 2FA / 验证码；差异清单 | 部分完成（2026-11-08：参考态 + 自基线各 14 张入库，首轮差异已归因；2FA / 验证码待环境，见临时待办 V-3） |
| M1-3 | DatePicker range 与 Toast 语气样式决策裁定 | 回写迁移评估 §6.3 / §7.3；更新 §12 上收条件 | 已完成（2026-11-08 按 1.2.0 修订：range 直接迁移；Toast token 映射） |
| M2-1 | 登录页整页迁移 + login 专用 V2 薄封装 | `pages/login.vue`、按需 V2 封装、白名单 `/login` | 已完成（2026-11-08：页面 PrimeVue 节点 0；三 Tab / 校验 / 密码显隐 / 明暗回归通过） |
| M2-2 | 试点回归与白名单登记 | 测试 mock 改写、视觉差异归因、SSR / hydration、定向测试 | 部分完成（白名单 / 三 Tab / 校验 / 密码显隐 / 明暗 / 移动 / 2FA mock 通过；2FA 视觉与 captcha 渲染待环境） |
| M3-1 | 注册页迁移 | `pages/register.vue` 及消费者封装 | 已完成（2026-11-08：PrimeVue 节点 0；明暗 / 移动 / 错误 / 手机号 / 密码强度回归通过；captcha 待环境） |
| M3-2 | 忘记密码 / 重置密码 / 修改密码迁移 | `forgot-password.vue`、`change-password.vue` 及相关组件 | 已完成（2026-11-09：两页 PrimeVue 节点 0；明暗 / 移动 / 校验错误 / Tab 回归通过；参考态 11 张、自基线 25 张入库） |
| M3-3 | 快速登录迁移与认证页 Toast / Confirm 切换 | `quick-login.vue`、认证相关 `useToast` / `useConfirm` 显式 import | 已完成（2026-11-09：快速登录 PrimeVue 节点 0；6 个认证 composable 切到 caomei `useToast`；参考态 6 张、自基线 31 张） |
| M4-1 | 个人资料页迁移 | `pages/profile.vue` 及消费者封装 | 已完成（2026-11-09：6 个展示组件 + 3 个对话框迁移；profile flow 切到 caomei Toast / Confirm；参考态 5 张、自基线 36 张） |
| M4-2 | 安全设置页迁移（2FA / 会话 / 账号绑定） | `pages/security.vue`；超阈值时按 2FA、会话、绑定拆条 | 已完成（2026-11-09：页面 + 2FA 面板 + 会话表 + 10 处 Toast 迁移；参考态 6 张、自基线 42 张） |
| M4-3 | OAuth 同意页迁移 | `pages/oauth/consent.vue`（`oauth/clients` 仍在 P4） | 已完成（2026-11-09：同意页按钮与 7 处 Toast 迁移；参考态 4 张、自基线 46 张） |
| M4-4 | SSO 登录页迁移 | `pages/sso-login.vue` | 已完成（2026-11-09：4 个登录表单 + Provider 卡片 + 6 处 Toast 迁移；参考态 4 张、自基线 50 张） |
| M5-1 | Zod 错误本地化前置 | 移除 74 处（评估口径）schema 级中文 `message`；补齐 `validation.*` 全量键（`zh-CN` / `en-US` 同构） | 待开始 |
| M5-2 | i18n 治理脚本与门禁 | `scripts/i18n/audit-*.mjs`、`i18n:audit:*`、`i18n:check-*`、CI 与 `lint-staged` 接入 | 待开始 |
| M5-3 | 服务端错误消息接入（认证类试点） | `errors.*` 键、`useTranslation(event)`、`Content-Language` / `Vary`；不可用时回退并登记 | 待开始 |
| M6-1 | 批次收口与质量门 | 白名单、包体复测、迁移记录、文档同步、回退验证 | 待开始 |

## 阶段 3 临时待办（视觉基线产出）

> 来源：2026-11-08 视觉参考态首轮比对（[视觉参考态基座](../design/governance/2026-11-08-visual-baseline-harness.md) §6.1）。仅登记本轮发现、当前阶段内闭环的事项。

| 编号 | 条目 | 来源 | 状态 |
| :--- | :--- | :--- | :--- |
| V-1 | 认证页表单字号 / 密度回归修复：标签 12→16px、输入 14→16px / 40→50px、字段间距 0→24px、错误文案 12→16px | 首轮参考态比对 | 已完成（2026-11-08，`styles/_form.scss` token 桥接；parity 差异 4.4 万 → 2.5 万像素） |
| V-2 | 认证页两层视觉基线入仓：参考态 14 张（迁移前）+ 自基线 14 张（当前接受态） | 同上 | 已完成（2026-11-08，`pnpm test:visual` 14/14 通过） |
| V-3 | 2FA 弹窗、验证码启用态、提交中 / Toast 状态补入视觉矩阵 | 覆盖缺口 | 待环境（需已启用 2FA 的测试账号与 captcha provider） |
| V-4 | P3 其余路由参考态随批次采集：忘记 / 重置 / 修改密码、快速登录、profile、security、oauth/consent、sso | 矩阵扩展 | 待随批次（每批迁移前采集，与迁移提交同批入库） |
| V-5 | 视觉基线接入 CI 门禁（固定渲染容器） | 用户要求 | 已完成（2026-11-09：`test.yml` 新增 `visual` job；自基线阻断，参考态审计仅出报告） |

## 说明

- 阶段 3 的验收、依赖与风险以 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md) 为准；本表只登记状态，不重复条款。
- 每个迁移路由整页切换、独立提交、独立回滚；未登记路由继续使用 PrimeVue。
- 完成态不得早于 Review Gate 结论；未完成事项的登记口径见 [规划规范 §5](../standards/planning.md#5-状态同步)。
- 阶段收口时按 [规划规范](../standards/planning.md) 归档到 [已完成工作归档](../archive/completed-work.md)。
