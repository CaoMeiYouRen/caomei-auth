# Zod 迁移计划 - 后端 API Handlers

## 背景

将 `server/api/**` 中的 API Handlers 从手动参数校验迁移到 Zod Schema 校验，提升类型安全性和代码一致性。

## 当前状态

### 已使用 Zod (6 个 handlers)
- `admin/oauth/applications/index.post.ts`
- `admin/oauth/applications/[id].put.ts`
- `admin/sso/providers/index.post.ts`
- `admin/sso/providers/[id].put.ts`
- `admin/sync-admin-role.post.ts`
- `oauth/revoke-consent.post.ts`

### 需要迁移 (8 个 handlers)

| 优先级 | 文件 | 校验类型 | 状态 |
|--------|------|----------|------|
| 1 | `oauth/client/[id].get.ts` | 路径参数 | ⬜ |
| 1 | `admin/oauth/applications/[id].delete.ts` | 路径参数 | ⬜ |
| 1 | `admin/sso/providers/[id].get.ts` | 路径参数 | ⬜ |
| 1 | `admin/sso/providers/[id].delete.ts` | 路径参数 | ⬜ |
| 2 | `admin/oauth/applications/index.get.ts` | 分页查询参数 | ⬜ |
| 2 | `admin/sso/providers/index.get.ts` | 分页+筛选查询参数 | ⬜ |
| 3 | `admin/logs/sessions.get.ts` | 复杂查询参数 | ⬜ |
| 3 | `social/providers.get.ts` | 简单查询参数 | ⬜ |

### 无需迁移 (5 个 handlers)
- `oauth/consents.get.ts` - 仅 session 校验
- `admin/logs/stats.get.ts` - 无参数
- `sso/providers/available.ts` - 仅 HTTP 方法检查
- `index.ts` - 无参数
- `file/upload.post.ts` - Multipart 表单 (特殊处理)

---

## 新增文件

### 1. `utils/shared/api-schemas.ts`

共享 Zod Schema 定义，包含：
- `idParamSchema` - 路径参数 ID 校验
- `paginationQuerySchema` - 分页查询参数
- `ssoProvidersQuerySchema` - SSO Providers 查询参数
- `sessionLogsQuerySchema` - Session 日志查询参数
- `socialProvidersQuerySchema` - 社交登录查询参数

### 2. `server/utils/validation.ts`

校验工具函数，包含：
- `validateBody` - 校验请求体 (抛出错误)
- `validateBodySafe` - 校验请求体 (返回错误对象)
- `validateQuery` - 校验查询参数
- `validateParams` - 校验路径参数 (抛出错误)
- `validateParamsSafe` - 校验路径参数 (返回错误对象)

---

## 迁移模式

### 路径参数迁移

```typescript
// Before
const clientId = event.context.params?.id
if (!clientId) {
    return { status: 400, success: false, message: '缺少客户端ID', data: null }
}

// After
import { validateParamsSafe } from '@/server/utils/validation'
import { idParamSchema } from '@/utils/shared/api-schemas'

const paramsResult = await validateParamsSafe(event, idParamSchema)
if (!paramsResult.success) {
    return paramsResult.error
}
const { id } = paramsResult.data
```

### 查询参数迁移

```typescript
// Before
const query = getQuery(event)
const page = Number(query.page) || 0
const limit = Number(query.limit) || 10

// After
import { validateQuery } from '@/server/utils/validation'
import { paginationQuerySchema, type PaginationQuery } from '@/utils/shared/api-schemas'

const query: PaginationQuery = await validateQuery(event, paginationQuerySchema)
const { page, limit, search, sortField, sortOrder } = query
```

---

## 验证方式

1. **类型检查**: `npm run typecheck`
2. **代码检查**: `npm run lint`
3. **测试**: `npm run test`
4. **手动测试**: 验证 API 端点的参数校验行为
