# 项目待办 (Todo List)

本文档记录了草梅 Auth 项目当前正在进行及近期的具体开发任务。历史已完成记录请参考 [归档文档](../archive/completed-work.md)。

## 优先级说明

-   🔴 **高**: 核心功能、紧急修复、合规性要求。
-   🟡 **中**: 功能完善、体验优化。
-   🔵 **低**: 非核心功能、文档润色。

## 1. 核心功能维护 🔴

-   [ ] **多语言适配 (i18n)**: 支持 UI、邮件、API 响应的翻译。详见 [i18n 规范](../standards/i18n.md)。
-   [ ] **时区设置**: 支持在界面展示用户所在时区的日期时间。
-   [ ] **Zod 迁移 (后端)**: 将所有 API Handlers (`server/api/**`) 的手动参数校验替换为 `Zod Schema` 校验。
-   [ ] **Zod 迁移 (前端)**: 补全剩余页面的表单 Zod 校验。

## 2. 测试覆盖率提升 🔴

当前重点关注覆盖率低于 50% 的核心模块。

-   [ ] **Composables**:
    -   [ ] `use-forgot-password-flow.ts` (当前 36%)
    -   [ ] `use-security-settings.ts` (当前 31%)
    -   [ ] `admin/use-user-management.ts` (当前 40%)
-   [ ] **Server Utils**:
    -   [ ] `server/utils/logger.ts`: 补充隐私脱敏、多环境输出测试。
    -   [ ] `server/utils/email/service.ts`: 补充失败重试、并发限流测试。
    -   [ ] `server/utils/admin-role-sync.ts`: 补充用户自动创建逻辑。
-   [ ] **Middleware**:
    -   [ ] `server/middleware/3-demo-guard.ts` (当前 0%)

## 3. 体验优化 🟡

-   [ ] **注册控制**: 支持邮箱域名黑白名单，手机号国家地区黑名单配置。
-   [ ] **Admin 日志展示**: 增加高级筛选（按 IP、按事件类型、按时间范围）及可视化图表。
-   [ ] **性能审计**: 针对高频数据库查询（如 Session 校验）进行索引优化和缓存策略升级。

## 4. 系统完善 🔵

-   [ ] **Demo 数据生成**: 完善 `demo-data-generator.ts`，支持更真实的统计分布仿真。
-   [ ] **安全审计**: 定期安全审计工具集成，扫描依赖及配置漏洞。
-   [ ] **文档维护**: 随着 Zod 和 I18n 迁移，同步更新 API 参考文档。
