# 测试路线图与现状

## 当前测试现状

-   **端到端测试 (E2E)**：`tests/e2e/api-index.nuxt.spec.ts` 已覆盖 `/api` 健康检查。
-   **单元测试 (Unit)**：
    -   `server/utils`：已覆盖 Logger, SMS Providers, Email Templates, Privacy 等核心工具。
    -   `utils`：部分纯函数已覆盖。
-   **测试工具**：基于 `Vitest`，已配置 `tests/setup/vitest.setup.ts` 进行统一 Mock。

## 暂挂测试记录

当测试用例反复失败且短期无法修复时，可暂挂并在此记录。

| 文件路径 | 失败次数 | 暂挂日期 | 责任人 | 问题描述 / 后续计划 |
| :------- | :------- | :------- | :----- | :------------------ |
| (暂无)   | -        | -        | -      | -                   |

## 分阶段建设路线图

### 阶段 P0：测试基础设施 (✅ 已完成)

-   [x] 引入 `vitest` 及相关依赖。
-   [x] 配置 `vitest.config.ts` 和 `tests/setup/vitest.setup.ts`。
-   [x] 建立测试目录结构。
-   [x] 封装数据库测试夹具 `tests/fixtures/database.ts`。

### 阶段 P1：纯函数与核心工具覆盖 (进行中)

目标：优先覆盖无副作用或副作用可控的工具函数。

-   **Utils (纯函数)**
    -   [x] `utils/privacy.ts` (脱敏工具)
    -   [ ] `utils/validate.ts` (验证工具：邮箱、手机号、URL 等)
    -   [ ] `utils/password.ts` (密码工具)
    -   [ ] `utils/code.ts` (验证码逻辑)
-   **Server Utils (Node.js 环境)**
    -   [x] `server/utils/logger.ts` (日志工具)
    -   [x] `server/utils/sms/providers/*.ts` (短信提供商)
    -   [x] `server/utils/email/templates.ts` (邮件模板)
    -   [ ] `server/utils/rate-limit.ts` (限流工具)

### 阶段 P2：API 与 业务流程 (规划中)

-   **API 测试**
    -   [ ] `/api/auth/*` (认证流程)
    -   [ ] `/api/admin/*` (管理后台)
-   **Composables**
    -   [ ] `composables/use-login-flow.ts`
    -   [ ] `composables/use-register-flow.ts`

### 阶段 P3：组件与页面 (规划中)

-   **组件测试**
    -   [ ] `components/base/*`
-   **页面测试**
    -   [ ] 关键页面加载与交互
