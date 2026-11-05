# Zod 迁移计划 - 后端 API Handlers

> **状态**：已收口（2026-11-05）。14 个参数校验 handlers 全部使用 Zod，无剩余迁移项。
> **关联条目**：[阶段 2 M2-1 / M2-2 / M2-3](./todo.md#阶段-2-原子条目)。
> **新增 handler 约定**：直接使用下文"迁移模式"中的校验函数，不再新增手写参数解析。

## 1. 背景

将 `server/api/**` 中的 API Handlers 从手动参数校验迁移到 Zod Schema 校验，实现：

- 前后端共享 Schema（`utils/shared/`），前端表单与后端 handler 使用同一份定义；
- 参数错误统一返回 400，并给出首条可读错误信息；
- 类型从 Schema 推导，避免重复声明。

## 2. 当前状态

### 2.1 基础设施

| 文件 | 作用 |
| :--- | :--- |
| `utils/shared/api-schemas.ts` | 路径参数与查询参数 Schema（`idParamSchema`、`paginationQuerySchema`、`ssoProvidersQuerySchema`、`sessionLogsQuerySchema`、`socialProvidersQuerySchema`） |
| `utils/shared/schemas.ts` | 请求体与表单 Schema（登录、注册、OAuth 应用、SSO 提供商、管理员角色同步等） |
| `server/utils/validation.ts` | `validateBody` / `validateBodySafe` / `validateQuery` / `validateParams` / `validateParamsSafe`，统一错误格式 |

### 2.2 已使用 Zod 的 handlers（14 个）

| # | 文件 | 校验对象 | Schema | 定向测试 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | `admin/oauth/applications/index.post.ts` | body | `oauthApplicationSchema` | `admin/oauth/applications/index.post.spec.ts` |
| 2 | `admin/oauth/applications/[id].put.ts` | body | `oauthApplicationUpdateSchema` | `admin/oauth/applications/[id].put.spec.ts` |
| 3 | `admin/oauth/applications/index.get.ts` | query | `paginationQuerySchema` | `admin/oauth/applications/index.get.spec.ts` |
| 4 | `admin/oauth/applications/[id].delete.ts` | path | `idParamSchema` | `admin/oauth/applications/[id].delete.spec.ts` |
| 5 | `admin/sso/providers/index.post.ts` | body | `ssoProviderSchema` | `admin/sso/providers/index.post.spec.ts` |
| 6 | `admin/sso/providers/[id].put.ts` | body | `ssoProviderUpdateSchema` | `admin/sso/providers/[id].put.spec.ts` |
| 7 | `admin/sso/providers/index.get.ts` | query | `ssoProvidersQuerySchema` | `admin/sso/providers/index.get.spec.ts` |
| 8 | `admin/sso/providers/[id].get.ts` | path | `idParamSchema` | `admin/sso/providers/[id].get.spec.ts` |
| 9 | `admin/sso/providers/[id].delete.ts` | path | `idParamSchema` | `admin/sso/providers/[id].delete.spec.ts` |
| 10 | `admin/logs/sessions.get.ts` | query | `sessionLogsQuerySchema` | `admin/logs/sessions.get.spec.ts` |
| 11 | `admin/sync-admin-role.post.ts` | body | `adminRoleSyncSchema` | `admin/sync-admin-role.spec.ts` |
| 12 | `oauth/revoke-consent.post.ts` | body | `revokeConsentSchema` | `oauth/revoke-consent.post.spec.ts` |
| 13 | `oauth/client/[id].get.ts` | path | `idParamSchema` | `oauth/client/[id].get.spec.ts` |
| 14 | `social/providers.get.ts` | query | `socialProvidersQuerySchema` | `social/providers.get.spec.ts` |

Schema 层另有独立单测：`tests/unit/utils/shared/api-schemas.spec.ts`（默认值、数字转换、枚举与布尔归一化、非法输入拒绝）。

### 2.3 无需迁移的 handlers（5 个）

| 文件 | 原因 |
| :--- | :--- |
| `oauth/consents.get.ts` | 仅 session 校验，无请求参数 |
| `admin/logs/stats.get.ts` | 无请求参数 |
| `sso/providers/available.ts` | 仅 HTTP 方法检查 |
| `index.ts` | 无请求参数 |
| `file/upload.post.ts` | Multipart 表单，由专用流程解析 |

## 3. 迁移模式

### 3.1 路径参数

```typescript
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'

const paramsResult = await validateParamsSafe(event, idParamSchema)
if (!paramsResult.success) {
    return paramsResult.error
}
const { id } = paramsResult.data
```

需要抛出 400 的 handler 使用 `validateParams`。

### 3.2 查询参数

```typescript
import { validateQuery } from '@/server/utils/validation'
import { paginationQuerySchema, type PaginationQuery } from '@/utils/shared/api-schemas'

const query: PaginationQuery = await validateQuery(event, paginationQuerySchema)
const { page, limit, search, sortField, sortOrder } = query
```

查询参数来自 URL，值都是字符串；数字字段统一用 `stringToNumber` 转换，布尔字段用显式 `'true'` 判断，避免 `'false'` 被当成真值。

### 3.3 请求体

```typescript
import { validateBodySafe } from '@/server/utils/validation'
import { oauthApplicationSchema } from '@/utils/shared/schemas'

const bodyResult = await validateBodySafe(event, oauthApplicationSchema)
if (!bodyResult.success) {
    return bodyResult.error
}
```

返回统一响应对象（`{ status: 400, success: false, message, data: null }`）的 handler 用 `validateBodySafe`；依赖框架错误响应的 handler 用 `validateBody`。

## 4. 验证矩阵

| 层级 | 命令 | 2026-11-05 结果 |
| :--- | :--- | :--- |
| 类型 | `pnpm typecheck` | 通过 |
| 代码规范 | `pnpm lint` | 通过 |
| 定向测试 | `pnpm vitest run tests/unit/server/api tests/unit/utils/shared/api-schemas.spec.ts` | 通过 |
| 全量测试 | `pnpm test` | 通过（见覆盖率基线记录） |

定向验证覆盖的断言类型：合法参数正常路径、缺参 / 空参返回 400、非法枚举与非数字分页被拒绝、查询条件正确传递到仓储层。

## 5. 边界与后续

- **错误文案**：当前 Schema 直接写中文 `message`，尚未接入 i18n per-parse error map；相关验证见 i18n 阶段 M5-2，结论产出前不修改现有文案。
- **错误响应形态**：`validate*` 抛出 H3 400（`statusCode` / `statusMessage`），`validate*Safe` 返回业务响应对象（`status` / `message`）。新 handler 需与所在模块既有形态保持一致，不混用。
- **未迁移为共享 Schema 的路径**：`file/upload.post.ts` 使用 Multipart 专用解析，若后续要统一，应单独立项，不在本计划内追加。
