# 项目待办 (Todo List)

本文档记录了当前 sprint 或近期（1-4 周内）需要完成的具体开发任务。已完成的任务移至 [归档文档](../archive/completed-work.md)。

## 优先级说明

-   🔴 **高**: 核心功能、阻塞性问题、合规性要求，必须在本周期完成。
-   🟡 **中**: 功能完善、体验优化，可在高优先级完成后进行。
-   🔵 **低**: 非核心功能、文档润色，可在时间充裕时处理。

> 路线图整体规划见 [roadmap](./roadmap.md)，中长期需求与 tech-debt 见 [backlog](./backlog.md)。

---

## 🔴 高优先级

### 核心功能

-   [ ] **多语言适配 (i18n)**: 支持 UI、邮件、API 响应的翻译。详见 [i18n 规范](../standards/i18n.md)。
    -   *阻塞 roadmap.md 阶段 1 收尾。*
-   [ ] **时区设置**: 支持在界面展示用户所在时区的日期时间。

### 技术债务

-   [ ] **Zod 后端迁移（续）**: 完成 `zod-migration.md` 中剩余 8 个 handlers。
    -   优先级 1（4 个）：路径参数校验 → `oauth/client/[id].get`, `admin/oauth/applications/[id].delete`, `admin/sso/providers/[id].get`, `admin/sso/providers/[id].delete`
    -   优先级 2（2 个）：分页查询参数 → `admin/oauth/applications/index.get`, `admin/sso/providers/index.get`
    -   优先级 3（2 个）：复杂/简单查询 → `admin/logs/sessions.get`, `social/providers.get`
    -   *依赖：`utils/shared/api-schemas.ts`、`server/utils/validation.ts`*

---

## 🟡 中优先级

### 体验优化

-   [ ] **注册控制**: 支持邮箱域名黑白名单，手机号国家地区黑名单配置。
-   [ ] **Admin 日志高级筛选**: 增加按 IP、按事件类型、按时间范围的筛选能力。
-   [ ] **性能审计与优化**: 针对高频数据库查询（如 Session 校验）进行索引优化和缓存策略升级。

---

## 🔵 低优先级

### 系统完善

-   [ ] **Demo 数据生成**: 完善 `demo-data-generator.ts`，支持更真实的统计分布仿真。
-   [ ] **安全审计工具集成**: 扫描依赖及配置漏洞（Dependabot / pnpm audit 常态化）。
-   [ ] **文档同步**: 随着 Zod 和 i18n 迁移，同步更新 API 参考文档（`docs/api/`）。

---

## 最近完成 ✅

*（最近一个 sprint 内完成，供参考）*

-   Zod 后端迁移（已完成 6 个 handlers）
-   Zod 前端迁移（全部页面表单校验）
-   Composables 测试覆盖率提升（`use-forgot-password-flow`、`use-security-settings`、`admin/use-user-management`）
-   Server Utils 测试（`logger.ts`、`email/service.ts`、`admin-role-sync.ts`）
-   Middleware 测试（`3-demo-guard.ts`）
