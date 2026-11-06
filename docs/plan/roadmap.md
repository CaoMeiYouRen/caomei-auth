# 项目路线图 (Roadmap)

本文档概述草梅 Auth 的中长期发展方向与大颗粒度阶段规划。候选条目、优先级与验收要点见 [backlog.md](./backlog.md)；进行中阶段的原子条目见 [todo.md](./todo.md)；准入与归档规则见 [规划规范](../standards/planning.md)。

> **当前状态**：**阶段 3「caomei-ui P2–P3 迁移与 i18n 非组件面」进行中**（2026-11-06 授权）。范围与验收见 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)，原子条目见 [todo.md](./todo.md)；阶段 2 已于 2026-11-06 完成并归档，交付摘要见 [已完成工作归档 §8](../archive/completed-work.md)。

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

## 阶段 3: caomei-ui P2–P3 迁移与 i18n 非组件面（进行中，2026-11-06 授权）

_目标：启动组件库正式替换（P2 试点 → P3 认证 / 个人 / 安全 / OAuth / SSO），并并行推进不改页面文案的 i18n 前置与服务端能力。_

- **M1 迁移准备与决策**：用量快照复测、P2 视觉基线、DatePicker range 与 Toast 语气样式裁定。
- **M2 P2 登录页试点**：`/login` 整页切换 + 专用 V2 薄封装；白名单只登记已迁移路由。
- **M3 P3 认证入口**：注册、忘记 / 重置 / 修改密码、快速登录与认证页 Toast / Confirm。
- **M4 P3 个人、安全、OAuth、SSO**：`profile`、`security`、`oauth/consent`、`sso-login`；`oauth/clients` 与 Admin 数据页仍在 P4。
- **M5 i18n 非组件面**：移除 schema 级中文 message、补齐 `validation.*` 键、治理脚本与门禁、服务端错误消息试点。
- **M6 阶段收口**：白名单、包体复测、迁移记录、文档同步、回退验证。

> **不做**：P4 Admin 数据页、P5 卸载 PrimeVue、页面文案翻译、邮件与 `User.locale`、SEO 放量、体验与性能项。范围与验收见 [阶段 3 登记记录](../design/governance/2026-11-06-phase3-registration.md)。

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

- **caomei-ui 后续批次**：P4 Admin 数据页与剩余页面、P5 卸载 PrimeVue；P2–P3 已进入阶段 3。见 [backlog §2.1](./backlog.md#21-组件库迁移到-caomei-ui)。
- **i18n 后续**：i18n M2 页面文案（待 P2 试点完成后准入）、i18n M4 剩余（Admin 文案、邮件模板、`User.locale`、API 其余错误面）、i18n M5 治理与 SEO 放量。见 [backlog §1.2](./backlog.md#12-i18n-全量落地)。
- **体验与性能**：时区设置、注册控制、Admin 日志高级筛选、性能审计、Demo 数据增强。见 [backlog §2.2–§2.6](./backlog.md#2-功能性需求feature-backlog)。

---

## 里程碑时间线

```text
阶段 1（主体完成，暂停）
        │
        ▼
阶段 2（已完成 2026-11-06）：安全收口 + 迁移预备
        │  M1 安全 → M2 Zod → M3 覆盖率 → M4 caomei-ui 预备 → M5 i18n 预备
        ▼
阶段 3（进行中）：caomei-ui P2–P3 + i18n 非组件面
        │  M1 准备 → M2 登录页 → M3 认证入口 → M4 个人/安全/OAuth/SSO → M5 i18n 前置 → M6 收口
        ▼
后续方向（未授权）：P4/P5 迁移收尾 / i18n 页面与邮件 / 体验与性能 / 开发者生态 / 安全增强 / 企业级
        │
        └─ 候选详情：backlog.md
```

---

> 路线图会根据项目进展和社区反馈定期更新（建议每季度回顾一次）。阶段登记与归档规则以 [规划规范](../standards/planning.md) 为准。
