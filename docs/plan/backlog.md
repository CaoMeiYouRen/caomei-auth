# 产品 backlog（待办池）

本文档记录中长期功能性需求、技术债务和已归档的专项规划。对应短期任务见 [todo.md](./todo.md)，阶段规划见 [roadmap.md](./roadmap.md)。

> 所有条目默认为"提案"状态，仅在确认实现意图后才标记为"计划中"或"进行中"。

---

## 一、专项子规划（子 Plan）

这些条目已有独立详细规划文档，在此作概要索引。

### 1.1 Zod 后端迁移

_详情见 [zod-migration.md](./zod-migration.md)。_

**当前状态**：6/14 handlers 已完成（约 43%）。

**待迁移清单**：

| 优先级 | 文件 | 校验类型 | 状态 |
|--------|------|----------|------|
| P1 | `oauth/client/[id].get.ts` | 路径参数 | ⬜ |
| P1 | `admin/oauth/applications/[id].delete.ts` | 路径参数 | ⬜ |
| P1 | `admin/sso/providers/[id].get.ts` | 路径参数 | ⬜ |
| P1 | `admin/sso/providers/[id].delete.ts` | 路径参数 | ⬜ |
| P2 | `admin/oauth/applications/index.get.ts` | 分页查询参数 | ⬜ |
| P2 | `admin/sso/providers/index.get.ts` | 分页+筛选查询参数 | ⬜ |
| P3 | `admin/logs/sessions.get.ts` | 复杂查询参数 | ⬜ |
| P3 | `social/providers.get.ts` | 简单查询参数 | ⬜ |

**依赖文件**：

- `utils/shared/api-schemas.ts` — 共享 Schema 定义（`idParamSchema`、`paginationQuerySchema` 等）
- `server/utils/validation.ts` — 校验工具函数（`validateParams`、`validateQuery` 等）

---

## 二、功能性需求（Feature Backlog）

### 阶段 2 · 开发者生态

- [ ] **轻量化 SDK（Web）**: 提供 `auth-client` npm 包，封装登录/注册/OAuth 流程，开箱即用。
- [ ] **轻量化 SDK（Node.js）**: 服务端专用 SDK，支持 Headless 认证、Token 管理。
- [ ] **文档中心自动化**: Swagger / OpenAPI 在线调试，API Playground。
- [ ] **插件/钩子系统**: 在认证关键节点（`beforeAuth`、`afterLogin`、`beforeSessionCreate`）注入自定义逻辑。
- [ ] **社交登录扩展**: 飞书、企业微信、钉钉（国内办公场景）。

### 阶段 3 · 安全增强

- [ ] **风险管控体系**: 基于地理位置、设备指纹的登录风险评分与拦截。
- [ ] **安全告警系统**: 异地登录、高频失败、异常 IP 的实时告警（邮件/钉钉/飞书）。
- [ ] **高级审计日志**: 企业级合规审计日志导出（CSV/JSON），满足 SOC2/ISO27001 要求。

### 阶段 4 · 企业级特性

- [ ] **多租户 SaaS**: 单实例支持管理多个独立组织租户，租户数据隔离。
- [ ] **组织/部门管理**: 多级组织架构、角色委派、权限矩阵。
- [ ] **LDAP/AD 集成**: 与传统企业目录服务对接，支持同步企业用户。

### 体验优化（长期）

- [ ] **Admin 日志可视化**: 高级筛选（IP/事件类型/时间范围）+ 可视化图表（趋势图、热力图）。
- [ ] **性能优化**: 高频数据库查询索引优化 + Redis 缓存策略（Session 校验等热点路径）。
- [ ] **Demo 数据仿真**: 完善 `demo-data-generator.ts`，支持更真实的统计分布。

---

## 三、技术债务（Tech Debt）

### 高优先级（影响开发效率）

- [ ] **测试覆盖率冲刺**: 核心逻辑 Lines 覆盖率从当前 ~17.65% 提升至 ≥ 60%。
    - 主要缺口：`server/api` (~1%)、`composables` (~5%)、`components` (~26%)
    - 详见 [testing/coverage](../standards/testing.md) 规范。
- [ ] **Demo 数据生成器增强**: 支持更真实的统计分布仿真，减少人工测试数据准备成本。

### 中优先级（长期可维护性）

- [ ] **安全审计常态化**: 将 `pnpm audit` 集成到 CI，自动化依赖漏洞扫描与报告。
- [ ] **jscpd 重复代码检测**: 引入代码重复率检测，目标全项目重复率降至 5% 以下。
- [ ] **API 参考文档同步**: 随着 Zod 迁移推进，同步更新 `docs/api/` 中的请求/响应示例。
- [ ] **max-lines 基线清理**: 消除历史遗留的 lint warning，逐步收紧 `eslint-plugin-max-lines` 基线。

### 低优先级（基础设施完善）

- [ ] **Dependency Cruiser 依赖图**: 配置 `depcruise` 验证 `utils/shared` / `server/utils` / `utils/web` 分层约束。
- [ ] **SonarQube / Codecov 集成**: 接入外部质量平台，持续追踪覆盖率与代码异味趋势。
- [ ] **Nx / Turborepo 调研**: 评估分模块构建的可行性，提升超大项目构建速度。

---

## 四、已否决 / 暂缓提案

记录曾被考虑但已否决或无限期延后的条目，避免重复讨论。

| 提案 | 结论 | 原因 |
|------|------|------|
| 使用 Valibot 替代 Zod | 暂缓 | Zod 已有成熟生态和大量迁移成本，暂不考虑替换。 |
| 引入 GraphQL | 否决 | 当前 REST API 复杂度不需要 GraphQL，增加维护负担。 |
| 微服务拆分 | 否决 | 项目规模未达到需要拆分的程度，增加运维复杂度。 |
| WebAuthn / FIDO2 支持 | 计划中 | 已在路线图中，暂无紧急需求排期。 |
