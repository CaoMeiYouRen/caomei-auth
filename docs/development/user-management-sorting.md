# 用户管理页面排序功能实现

## 概述

本文档详细说明了用户管理页面(`/admin/users`)的排序、搜索和筛选功能的实现方法。该功能基于 PrimeVue DataTable 组件，支持后端排 2. **搜索**：在搜索框输入关键词

-   有效邮箱：`user@example.com`（自动识别邮箱格式）
-   用户名：`@username`
-   姓名：`张三`搜索和多条件筛选。

## 技术栈

-   **前端框架**: Vue 3 + Nuxt 3
-   \*\*UI 组件## 相关文件

-   **主要实现**: `pages/admin/users.vue`
-   **认证客户端**: `lib/auth-client.ts`
-   **验证工具**: `utils/validate.ts`
-   **样式文件**: `styles/_theme.scss`, `styles/_form.scss`
-   **工具函数**: `utils/admin-role-client.ts`imeVue DataTable
-   **认证库**: better-auth
-   **状态管理**: Vue 3 Composition API

## 已实现的功能

### 1. 排序功能

-   ✅ 支持按以下字段排序：

    -   姓名 (name)
    -   角色 (role)
    -   状态 (banned)
    -   注册时间 (createdAt)
    -   邮箱 (email)
    -   用户名 (username)

-   ✅ 支持升序/降序切换
-   ✅ 默认按注册时间降序排列
-   ✅ 排序状态在表格列标题显示
-   ✅ 排序信息在表格标题显示

### 2. 智能搜索功能

-   ✅ 自动识别搜索内容类型：
    -   有效邮箱格式：搜索邮箱字段
    -   以 `@` 开头：搜索姓名字段（自动移除@符号）
    -   其他情况：搜索姓名字段
-   ✅ 使用 `validateEmail` 函数准确识别邮箱格式
-   ✅ 模糊匹配搜索
-   ✅ 防抖处理，减少 API 调用

### 3. 多条件筛选

-   ✅ 支持按角色筛选（用户/管理员）
-   ✅ 支持按状态筛选（正常/已禁用）
-   ✅ 支持同时应用多个筛选条件
-   ✅ 筛选条件组合逻辑优化

### 4. 分页功能

-   ✅ 支持懒加载分页
-   ✅ 排序时自动重置到第一页
-   ✅ 可配置每页显示数量

### 5. 用户体验优化

-   ✅ 加载状态显示
-   ✅ 排序状态提示
-   ✅ 搜索提示文本
-   ✅ 刷新功能重置所有筛选条件

## API 参数格式

### 排序参数

```javascript
{
  sortBy: 'createdAt',      // 排序字段
  sortOrder: 'desc'         // 排序方向: 'asc' | 'desc'
}
```

### 搜索参数

```javascript
{
  searchField: 'email',     // 搜索字段: 'email' | 'name' | 'username'
  searchOperator: 'contains', // 搜索操作符
  searchValue: 'search_term'   // 搜索值
}
```

### 筛选参数

```javascript
// 单个筛选条件
{
  filterField: 'role',
  filterOperator: 'eq',
  filterValue: 'admin'
}

// 多个筛选条件
{
  filters: [
    { field: 'role', operator: 'eq', value: 'admin' },
    { field: 'banned', operator: 'eq', value: false }
  ]
}
```

## 使用方法

1. **排序**：点击表格列标题进行排序
2. **搜索**：在搜索框输入关键词
    - 邮箱：`user@example.com`
    - 用户名：`@username`
    - 姓名：`张三`
3. **筛选**：使用下拉菜单选择角色或状态
4. **刷新**：点击刷新按钮重置所有条件

## 字段映射

| 前端字段  | 后端字段  | 中文标签 |
| --------- | --------- | -------- |
| name      | name      | 姓名     |
| role      | role      | 角色     |
| banned    | banned    | 状态     |
| createdAt | createdAt | 注册时间 |
| email     | email     | 邮箱     |
| username  | username  | 用户名   |

## 注意事项

-   排序和筛选条件在分页时会保持
-   改变排序时会重置到第一页
-   搜索使用防抖处理，500ms 延迟
-   支持多个筛选条件同时应用
-   默认显示最新注册的用户

## 实现细节

### 排序逻辑

```typescript
const onSort = (event: any) => {
    // event 包含 sortField 和 sortOrder 信息
    if (event.sortField) {
        sortField.value = getSortField(event.sortField);
        sortOrder.value = event.sortOrder === 1 ? "asc" : "desc";

        // 重置到第一页
        currentPage.value = 0;

        // 重新加载数据
        loadUsers();
    }
};
```

### 智能搜索实现

```typescript
// 添加搜索条件 - 智能搜索多个字段
if (searchQuery.value) {
    const query_value = searchQuery.value.trim();
    // 如果以@开头，搜索姓名（注意：API不支持username搜索）
    if (query_value.startsWith("@")) {
        query.searchField = "name";
        query.searchValue = query_value.substring(1); // 移除@符号
    } else if (validateEmail(query_value)) {
        // 如果是有效的邮箱格式，搜索邮箱
        query.searchField = "email";
        query.searchValue = query_value;
    } else {
        // 否则搜索姓名
        query.searchField = "name";
        query.searchValue = query_value;
    }
    query.searchOperator = "contains";
}
```

**搜索逻辑说明**：

1. **优先级最高**：以 `@` 开头的输入（如 `@username`）会搜索姓名字段（注意：由于 better-auth API 限制，不支持直接搜索 username 字段）
2. **其次**：使用 `validateEmail` 函数验证的有效邮箱格式会搜索邮箱字段
3. **最后**：其他输入会搜索姓名字段

这种方式比简单的字符串包含检查更准确，能够正确区分有效邮箱和包含 `@` 符号的普通文本。

**API 限制说明**：

-   better-auth 的 `listUsers` API 的 `searchField` 参数只支持 `"name" | "email"` 两个字段
-   排序参数名为 `sortDirection` 而不是 `sortOrder`

### 排序参数实现

```typescript
// 添加排序参数
if (sortField.value) {
    query.sortBy = sortField.value;
    query.sortDirection = sortOrder.value; // 注意：API使用sortDirection而不是sortOrder
}
```

3. **最后**：其他输入会搜索姓名字段

这种方式比简单的字符串包含检查更准确，能够正确区分有效邮箱和包含 `@` 符号的普通文本。

````

### 多条件筛选实现

```typescript
// 添加筛选条件
const filters: any[] = [];

// 添加角色筛选
if (selectedRole.value) {
    filters.push({
        field: "role",
        operator: "eq",
        value: selectedRole.value,
    });
}

// 添加状态筛选
if (selectedStatus.value) {
    filters.push({
        field: "banned",
        operator: "eq",
        value: selectedStatus.value === "banned",
    });
}

// 如果有多个筛选条件，使用数组；否则使用单个条件
if (filters.length > 1) {
    query.filters = filters;
} else if (filters.length === 1) {
    query.filterField = filters[0].field;
    query.filterOperator = filters[0].operator;
    query.filterValue = filters[0].value;
}
````

### DataTable 配置

```vue
<DataTable
    v-model:selection="selectedUsers"
    :value="users"
    :loading="loading"
    :paginator="true"
    :rows="pageSize"
    :total-records="totalUsers"
    :lazy="true"
    sortable
    :sort-field="sortField === 'createdAt' ? 'createdAt' : sortField"
    :sort-order="sortOrder === 'asc' ? 1 : -1"
    selection-mode="multiple"
    :meta-key-selection="false"
    @page="onPageChange"
    @sort="onSort"
>
```

## 性能优化

1. **防抖搜索**: 使用 lodash-es 的 debounce 函数，延迟 500ms 执行搜索
2. **懒加载**: 使用 DataTable 的 lazy 模式，减少不必要的数据传输
3. **状态管理**: 合理管理组件状态，避免不必要的重新渲染
4. **邮箱验证**: 使用 `validator` 库的 `isEmail` 函数进行准确的邮箱格式验证

## 扩展性考虑

-   字段映射使用对象配置，便于添加新的排序字段
-   搜索逻辑可扩展支持更多字段类型
-   筛选条件支持数组模式，可轻松添加更多筛选器

## 相关文件

-   **主要实现**: `pages/admin/users.vue`
-   **认证客户端**: `lib/auth-client.ts`
-   **样式文件**: `styles/_theme.scss`, `styles/_form.scss`
-   **工具函数**: `utils/admin-role-client.ts`

## 测试建议

1. 测试不同字段的排序功能
2. 验证智能搜索的三种模式
3. 测试多条件筛选的组合
4. 验证分页与排序的交互
5. 测试防抖搜索的性能表现
