# 管理员角色自动同步功能

## 概述

本项目已实现了管理员角色的自动同步功能，解决了当用户仅在 `adminUserIds` 配置中但角色中没有 `admin` 的不一致问题。

## 功能特性

### 1. 自动同步机制

-   **中间件集成**: 在认证中间件 (`server/middleware/1-auth.ts`) 中，每次用户请求都会自动检查并同步管理员角色
-   **登录时同步**: 在首页 (`pages/index.vue`) 用户登录后会自动触发角色同步
-   **实时同步**: 确保用户的角色信息与配置保持一致

### 2. 管理员判定逻辑

用户被视为管理员的条件（满足任一即可）：

-   用户 ID 在环境变量 `ADMIN_USER_IDS` 列表中
-   用户角色字段包含 `admin`

### 3. 角色同步规则

-   **自动添加**: 如果用户在 `adminUserIds` 中但角色中没有 `admin`，会自动添加
-   **保持现有**: 如果用户不在 `adminUserIds` 中但角色中有 `admin`，不会自动移除（保护手动设置的管理员）

## 文件结构

```
server/
├── utils/
│   └── admin-role-sync.ts          # 管理员角色同步核心逻辑
├── middleware/
│   └── 1-auth.ts                   # 认证中间件（集成自动同步）
└── api/
    └── admin/
        ├── sync-admin-role.post.ts # 手动同步API端点
        └── status.get.ts           # 获取管理员状态API

utils/
└── admin-role-client.ts            # 客户端工具函数

pages/
├── index.vue                       # 首页（集成角色同步）
└── admin/
    └── users.vue                   # 用户管理页面（新增角色管理功能）
```

## 核心函数说明

### 服务端函数 (`server/utils/admin-role-sync.ts`)

#### `checkAndSyncAdminRole(userId: string)`

-   **功能**: 检查用户是否为管理员，并自动同步角色信息
-   **返回**: `Promise<boolean>` - 用户是否为管理员
-   **说明**: 如果用户在 `adminUserIds` 中但角色中没有 `admin`，会自动添加

#### `isUserAdmin(user, userId: string)`

-   **功能**: 轻量级检查用户是否为管理员（不进行数据库同步）
-   **返回**: `boolean` - 用户是否为管理员

#### `setUserAdminRole(userId: string)`

-   **功能**: 为用户设置管理员角色
-   **返回**: `Promise<boolean>` - 操作是否成功

#### `removeUserAdminRole(userId: string)`

-   **功能**: 为用户移除管理员角色
-   **返回**: `Promise<boolean>` - 操作是否成功

### 客户端函数 (`utils/admin-role-client.ts`)

#### `syncAdminRole(userId: string)`

-   **功能**: 调用 API 同步用户的管理员角色
-   **返回**: 操作结果对象

#### `addAdminRole(userId: string)`

-   **功能**: 调用 API 为用户添加管理员角色
-   **返回**: 操作结果对象

#### `removeAdminRole(userId: string)`

-   **功能**: 调用 API 为用户移除管理员角色
-   **返回**: 操作结果对象

#### `batchSyncAdminRole(userIds: string[])`

-   **功能**: 批量同步多个用户的管理员角色
-   **返回**: 操作结果列表

## API 端点

### `POST /api/admin/sync-admin-role`

**功能**: 手动同步、添加或移除用户的管理员角色

**请求体**:

```json
{
    "userId": "用户ID",
    "action": "sync|add|remove"
}
```

**响应**:

```json
{
    "success": true,
    "message": "操作结果描述",
    "data": {
        "userId": "用户ID",
        "action": "执行的操作"
    }
}
```

### `GET /api/admin/status`

**功能**: 获取当前用户的管理员状态信息

**响应**:

```json
{
    "success": true,
    "data": {
        "userId": "用户ID",
        "userRole": "用户当前角色",
        "isAdmin": true,
        "isAdminByRole": true,
        "isAdminByConfig": true,
        "adminStatus": {
            "syncRequired": false,
            "lastSyncResult": true
        }
    }
}
```

## 用户界面功能

### 用户管理页面 (`/admin/users`)

新增了以下管理员角色管理功能：

-   **同步角色按钮**: 在用户列表和详情页面中添加了同步管理员角色的按钮
-   **设为管理员**: 可以将普通用户设置为管理员
-   **移除管理员**: 可以移除用户的管理员角色
-   **状态显示**: 清晰显示用户的当前角色状态

### 首页自动同步

-   用户登录后自动检查并同步管理员角色
-   确保界面显示的管理员权限与实际配置一致

## 配置说明

### 环境变量配置 (`.env`)

```env
# 管理员用户ID列表（逗号分隔）
ADMIN_USER_IDS='1,2,3'
```

### Better Auth 配置 (`lib/auth.ts`)

```typescript
admin({
    defaultRole: "user",
    adminRoles: ["admin"],
    adminUserIds: ADMIN_USER_IDS,
});
```

## 使用示例

### 自动同步示例

```typescript
// 在任何需要检查管理员权限的地方
import { checkAndSyncAdminRole } from "@/server/utils/admin-role-sync";

const isAdmin = await checkAndSyncAdminRole(userId);
if (isAdmin) {
    // 用户是管理员，可以执行管理员操作
}
```

### 手动操作示例

```typescript
// 客户端手动同步
import { syncAdminRole } from "@/utils/admin-role-client";

const result = await syncAdminRole(userId);
if (result.success) {
    console.log("同步成功:", result.message);
}
```

## 安全措施

### 自我保护机制

系统实现了多层安全保护，防止管理员意外或恶意操作自己的账户：

#### 客户端保护

-   **UI 限制**: 对于当前登录的管理员用户，相关的危险操作按钮会被禁用或隐藏
-   **前置检查**: 在执行操作前，客户端会检查是否为当前用户，并显示警告信息

#### 服务端保护

-   **API 层面**: 在 `/api/admin/sync-admin-role` 接口中检查请求的用户 ID 是否为当前用户
-   **函数层面**: `removeUserAdminRole` 函数接受可选的 `currentUserId` 参数进行双重验证

#### 具体限制

1. **移除管理员权限**: 管理员不能移除自己的管理员角色
2. **禁用账户**: 管理员不能禁用自己的账户
3. **删除账户**: 管理员不能删除自己的账户
4. **错误提示**: 当尝试执行这些操作时，系统会显示清晰的错误信息

### 批量操作保护

批量操作同样受到保护，如果选中的用户包含当前用户，系统会适当处理或提供警告。

## 注意事项

1. **权限安全**: 只有现有管理员才能执行管理员角色的手动操作
2. **自我保护**: 管理员不能移除自己的管理员权限，也不能禁用或删除自己的账户
3. **数据一致性**: 自动同步只会添加角色，不会移除已有的管理员角色
4. **性能考虑**: 中间件中的自动同步是异步执行的，不会阻塞请求
5. **日志记录**: 所有角色同步操作都会记录在控制台日志中

## 未来扩展

可以考虑添加以下功能：

-   角色同步历史记录
-   批量角色管理
-   更细粒度的权限控制
-   角色变更通知机制
