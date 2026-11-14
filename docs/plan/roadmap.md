# 项目路线图 (Roadmap)

本文档概述草梅 Auth 的中长期发展方向与大颗粒度阶段规划。候选条目、优先级与验收要点见 [backlog.md](./backlog.md)；进行中阶段的原子条目见 [todo.md](./todo.md)；准入与归档规则见 [规划规范](../standards/planning.md)。

> **当前状态**：**阶段 5「i18n 全量落地与体验收口」已于 2026-11-14 授权启动（M1–M19，实施中）**。阶段 4「caomei-ui P4 Admin 与 P5 单库收尾」已于 2026-11-14 收口，PrimeVue 已完整下线。阶段 5 范围见 [阶段 5 范围登记](../design/governance/2026-11-14-phase5-registration.md)；阶段 4 记录见 [阶段 4 收口记录](../design/governance/2026-11-14-phase4-closure.md)，P4 摘要见 [P4 交付摘要](../design/governance/2026-11-14-p4-closure.md)；未启动候选见 [backlog.md](./backlog.md)。

---

## 阶段 1: 稳定性、规范化与核心增强（主体完成，已暂停）

_目标：通过重构和技术规范升级，打造稳健、安全的统一认证基石。_

- [x] **架构解耦 (G1)**: 邮件、短信、验证码模块完成解耦与 DI 引入。
- [x] **文件瘦身 (G2)**: 超长文件清理，逻辑下沉至 Composables。
- [x] **Zod 基础设施**: 引入 Zod 实现 Schema 驱动校验，前后端共用 Schema。

> 阶段 1 的已完成部分见 [已完成工作归档](../archive/completed-work.md)。剩余候选（i18n 全量落地、测试覆盖率达标）已迁入 backlog / 阶段 2，不在本阶段保留未完成条目。

---

## 阶段 2: 安全收口与迁移预备（已完成，2026-11-06 归档）

_目标：在进入两条大迁移前，清掉安全与质量硬债，并完成组件库与 i18n 的低风险预备。_
_2026-11-06：11 条原子条目全部完成并归档，交付摘要见 [已完成工作归档 §8](../archive/completed-work.md)。_

- **M1 安全与合规收口**：CodeQL #20 已按误报 dismiss（2026-11-05）；SSO 历史配置排查完成（2026-11-06，部署实例 0 个 provider），记录见 [SSO 排查记录](../design/governance/2026-11-06-sso-audit.md)。
- **M2 Zod 后端迁移收尾**：14 个参数校验 handlers 已全部使用 Zod（2026-11-05 收口）；测试与 API 文档同步。
- **M3 测试覆盖率第一阶段**：基线已复测（Statements 75.74%），阶段目标按范围设下限（`server/api` ≥95% / `composables` ≥80% / `components/base` ≥75%，全局不退化）；补测后 78.26%（`composables` 84.35%、`components/base` 90.11%）。
- **M4 caomei-ui 迁移预备**：用量快照 + 白名单初值 + 版本锁定 + 回退方案 + 接入基座（P0/P1），双库并存，**不替换页面**；`keyCss` +4.76%、入口 JS 0%。
- **M5 i18n 迁移预备**：`@nuxtjs/i18n@10` 技术验证 + Zod per-parse error map 验证完成，M2 准入有条件通过，**不全量翻译**。

> 交付摘要见 [已完成工作归档 §8](../archive/completed-work.md)；范围、验收、依赖与风险见 [阶段 2 登记记录](../design/governance/2026-11-05-phase2-registration.md)。

---

## 阶段 3: caomei-ui P2–P3 迁移与 i18n 非组件面（已收口 2026-11-09；含 M0 插队）

_目标：启动组件库正式替换（P2 试点 → P3 认证 / 个人 / 安全 / OAuth / SSO），并并行推进不改页面文案的 i18n 前置与服务端能力。_

- **M0 发布链路（插队，2026-11-08 授权）**：提取 `docker-build.yml` 复用工作流；`docker.yml`、`release.yml`、`docker-publish.yml` 改为调用，去 QEMU；验收见 [原生多架构评估](../design/governance/2026-11-08-native-multiarch-docker-review.md)。
- **M1 迁移准备与决策**：用量快照复测、P2 视觉基线、DatePicker range 与 Toast 语气样式裁定。
- **M2 P2 登录页试点**：`/login` 整页切换 + 专用 V2 薄封装；白名单只登记已迁移路由。
- **M3 P3 认证入口**：注册、忘记 / 重置 / 修改密码、快速登录与认证页 Toast / Confirm。
- **M4 P3 个人、安全、OAuth、SSO**：`profile`、`security`、`oauth/consent`、`sso-login`；`oauth/clients` 与 Admin 数据页仍在 P4。
- **M5 i18n 非组件面**：移除 schema 级中文 message、补齐 `validation.*` 键、治理脚本与门禁、服务端错误消息试点。
- **M6 阶段收口**：白名单、包体复测、迁移记录、文档同步、回退验证。

> **收口**：P2–P3 九条认证路由完成，白名单 9 条，视觉 50/50，入口 CSS `+2.87%`；M0-3 定时验证已移至 backlog。交付与回退证据见 [阶段 3 收口记录](../design/governance/2026-11-09-phase3-closure.md)。
> **不做**：P4 Admin 数据页、P5 卸载 PrimeVue、页面文案翻译、邮件与 `User.locale`、SEO 放量、体验与性能项。范围与验收见 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)。


---

## 阶段 4: caomei-ui P4 Admin 与 P5 单库收尾（已完成 2026-11-14）

_目标：完成剩余 Admin 数据页与共享封装迁移，建立 Admin 视觉基线，并卸载 PrimeVue。_

- **M1 P4-0 基座与视觉**：DataTable / Dialog / Select 适配决策；Admin 浅色 / 暗色 token；Admin 视觉参考态与自基线；Admin 夹具。
- **M2–M11 P4 页面迁移**：`admin/users`、`admin/oauth/applications`、`admin/sso/providers`、`admin/logs`、`oauth/clients`、`index`、`error`、`components/base/*` V1；每页按“参考态 → 迁移 → 归因 → 自基线 → 文档 → 单提交”推进。
- **M12 P4 收口**：白名单、包体、视觉、回退、文档。
- **M13–M15 P5 单库收尾**：移除 PrimeVue 依赖 / Provider / 导入 / 构建配置 / 样式 token / 测试 mock / 白名单；最终包体与视觉回归，阶段归档。

> **不做**：i18n 页面文案、邮件、`User.locale`、SEO（阶段 5）；新产品功能；UI 改版；PrimeVue 5.x 升级。范围与验收见 [阶段 4 登记记录](../design/governance/2026-11-10-phase4-registration.md)。

---

## 阶段 5: i18n 全量落地与体验收口（已授权，2026-11-14 启动）

_目标：完成 i18n 页面文案、邮件与 `User.locale`、API 错误面与 SEO 放量，建立双语质量门，并收口组件库内建文案与个人中心导航。_

- **M1 基座对齐**：caomei-ui 1.3.0 升级 + `CaomeiConfigProvider` locale 桥接 + 受影响视觉基线重采。
- **M2–M3 基础设施与门禁**：消息模块化与按需加载；扫描盲区修复；`lint:i18n` / `test:i18n`；Admin 校验键直显与 `usePageMeta` / `app.head`。
- **M4–M10 页面文案**：认证入口、SSO 与错误页、个人中心、安全设置、OAuth、首页与静态页、§2.10 导航互联。
- **M11–M14 Admin 文案**：用户、OAuth、SSO、日志四个业务域。
- **M15–M16 服务端**：邮件模板与 `User.locale`；API 错误面与内容协商。
- **M17–M19 治理 / SEO / 收口**：未用键清理与双语视觉回归；sitemap / hreflang 与 `en-US` 升 `seo-ready`；阶段收口与归档。

> **不做**：新增第三语言 / RTL、日志与内部错误翻译、UI 改版、认证流程与权限模型变更、sitemap 之外的新 SEO 平台。范围与验收见 [阶段 5 范围登记](../design/governance/2026-11-14-phase5-registration.md)。
> **检查点**：M14 完成后复核剩余容量，是否拆分由用户决策。

---

## 后续方向（未授权）

以下方向不属于当前阶段，作为中长期方向保留；候选详情与触发条件见 [backlog.md](./backlog.md)。未授权方向不构成启动授权。

### 开发者生态与集成优化

- 轻量化 Web / Node.js SDK。
- 文档中心自动化、API Playground。
- 插件 / 钩子系统。
- 飞书、企业微信、钉钉等国内办公场景社交登录。

> 候选详情见 [backlog §2.7](./backlog.md#27-开发者生态长期方向)。

### 安全增强与智能化管理

- 风险管控体系（地理位置 / 设备指纹）。
- 安全告警系统（异地登录、高频失败、异常 IP）。
- 高级审计日志（CSV / JSON 导出，SOC2 / ISO27001）。

> 候选详情见 [backlog §2.8](./backlog.md#28-安全增强长期方向)。

### 企业级特性与 SaaS

- 多租户 SaaS。
- 组织 / 部门管理、权限委派。
- LDAP / AD 集成。

> 候选详情见 [backlog §2.9](./backlog.md#29-企业级特性长期方向)。

---

## 跨阶段候选方向（未授权）

- **体验与性能**：时区设置、注册控制、Admin 日志高级筛选、性能审计、Demo 数据增强。见 [backlog §2.2–§2.6](./backlog.md#2-功能性需求feature-backlog)。
- **个人中心导航互联**已作为 [阶段 5](./todo.md) M10 启动，不再保留为候选。

---

## 里程碑时间线

```text
阶段 1（主体完成，暂停）
        │
        ▼
阶段 2（已完成 2026-11-06）：安全收口 + 迁移预备
        │  M1 安全 → M2 Zod → M3 覆盖率 → M4 caomei-ui 预备 → M5 i18n 预备
        ▼
阶段 3（已收口 2026-11-09）：caomei-ui P2–P3 + i18n 非组件面（+ M0 发布链路插队）
        │  M0 原生多架构 → M1 准备 → M2 登录页 → M3 认证入口 → M4 个人/安全/OAuth/SSO → M5 i18n 前置 → M6 收口
        ▼
阶段 4（已完成 2026-11-14）：caomei-ui P4 Admin 与 P5 单库收尾
        │  P4 基座 → Admin 页面 → P4 收口 → P5 卸载 PrimeVue
        ▼
阶段 5（已授权 2026-11-14）：i18n 全量落地与体验收口
        │  基座 1.3.0 → 模块化 / 门禁 → 页面文案 → Admin → 邮件 / API → SEO → 收口
        ▼
后续方向（未授权）：体验与性能 / 开发者生态 / 安全增强 / 企业级
        │
        └─ 候选详情：backlog.md
```

---

> 路线图会根据项目进展和社区反馈定期更新（建议每季度回顾一次）。阶段登记与归档规则以 [规划规范](../standards/planning.md) 为准。
