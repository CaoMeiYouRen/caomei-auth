# API 规范 (API Specifications)

本文档规定了草梅 Auth 项目服务端 API 的设计与实现标准，确保接口的一致性、安全性与可维护性。对外契约细节参见 [API 文档](../api/)。

## 1. 路由约定

-   API 路由统一使用 Nitro Server Routes，位于 `server/api/` 目录，路径即路由。
-   文件名遵循 `<name>.<method>.ts` 约定，例如 `users.get.ts`、`users.post.ts`。
-   API 基础路径为 `/api`，对外文档见 [API 文档](../api/)。
-   涉及 OAuth2.0 授权协议的接口归入 `server/api/oauth/`，管理端接口归入 `server/api/admin/`。

## 2. 响应格式

### 2.1 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

-   `success`: 固定为 `true`。
-   `message`: 人类可读的成功信息（中文，遵循 [国际化实施方案](./i18n.md) 的语言策略）。
-   `data`: 响应数据；无数据时可为 `null`。

### 2.2 错误响应

错误统一通过 `createError` 抛出，由 h3 统一渲染：

```ts
throw createError({
    statusCode: 400,
    statusMessage: 'Bad Request',
    message: '参数校验失败',
})
```

-   `statusCode`: 标准 HTTP 状态码（见第 3 节）。
-   `message`: 面向用户的错误信息，禁止包含敏感信息（如数据库报错原文）。
-   业务错误如需携带机器可读错误码，在 `message` 外补充结构化字段（参考 [API 文档 - 错误代码](../api/index.md#错误代码)）。

## 3. 状态码约定

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | OK | 查询/操作成功 |
| 201 | Created | 资源创建成功 |
| 400 | Bad Request | 参数校验失败、请求体非法 |
| 401 | Unauthorized | 未登录或会话失效 |
| 403 | Forbidden | 已登录但权限不足 |
| 404 | Not Found | 资源不存在 |
| 409 | Conflict | 资源冲突（如邮箱已存在） |
| 429 | Too Many Requests | 触发限流 |
| 500 | Internal Server Error | 服务器内部错误（记录日志，不向用户泄露细节） |

## 4. 认证与权限

-   会话获取统一使用 `server/utils/get-user-session.ts` 的 `getUserSession`，不得直接操作 cookie/token 解析逻辑。
-   管理端接口必须使用 `server/utils/check-admin.ts` 的 `checkAdmin` 做权限校验：未登录返回 401，非管理员返回 403。
-   OAuth2.0 协议相关认证由 better-auth 与 `@better-auth/sso` 负责，不自行实现。
-   敏感操作（修改密码、绑定邮箱/手机、删除账号等）需要二次校验的，遵循现有安全流程（验证码 / MFA）。

## 5. 参数校验 (Zod)

-   请求参数必须使用 `utils/shared/` 下的 Zod Schema 校验（单一事实来源，前后端共用）。
-   Handler 内使用 `schema.parse(body)` 或 `schema.safeParse(body)` 进行运行时校验；`safeParse` 失败时抛出 400 错误并附带首个校验错误信息。
-   禁止在 Handler 中手写大量条件判断替代 Schema 校验。

```ts
const body = await readBody(event)
const parsed = signInSchema.safeParse(body)
if (!parsed.success) {
    throw createError({
        statusCode: 400,
        message: parsed.error.issues[0]?.message || '参数校验失败',
    })
}
```

## 6. 错误处理

-   不吞异常、不空 catch：捕获的异常必须记录到 `logger`（使用内部 `logger` 模块）后抛出或返回。
-   预期错误使用 `createError` 抛出；非预期错误抛出后由全局错误处理兜底，禁止在 Handler 内输出敏感堆栈到响应。
-   批量操作（如管理端批量更新）应记录部分失败信息到日志，并返回成功条目数与失败原因。

## 7. 限流

-   高频接口（认证、验证码、登录等）必须接入 `server/utils/rate-limit.ts` 的限流能力。
-   限流触发返回 429，并附带合理的重试提示。
-   默认阈值参考 [API 文档 - 限流规则](../api/index.md#限流规则)，新增接口时按风险等级设定。

## 8. 国际化

-   API 错误消息与业务文案遵循 [国际化实施方案](./i18n.md)：服务端按请求 `Accept-Language` 或 Session 语言返回对应文案。
-   统一使用 `server/utils/locale.ts` 做语言归一化，禁止在 Handler 内硬编码语言逻辑。
-   响应可设置 `Content-Language` 头标记语言。

## 9. 日志

-   API 请求处理的关键节点（登录成功/失败、权限拒绝、限流触发、异常）必须记录结构化日志。
-   日志中禁止记录密码、Token、验证码等敏感字段。
-   使用 `logger.business.*` 记录业务事件（如 `userRegistered`），便于运营分析。

## 10. 相关文档

-   [API 文档](../api/)：对外接口参考手册（认证、OAuth、用户、管理、文件）。
-   [开发规范](./development.md)：目录结构、技术栈与校验模式。
-   [国际化实施方案](./i18n.md)：服务端翻译装配与语言策略。
