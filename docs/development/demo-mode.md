# Demo 模式

Demo 模式是草梅 Auth 提供的一个特殊运行模式，允许用户在不进行实际数据修改的情况下体验所有功能。这对于展示、测试和演示非常有用。

## 功能特性

### 核心特性

- **只读模式**：所有修改操作都会被拦截，不会影响真实数据
- **假数据展示**：提供丰富的假数据供展示和测试
- **完整功能体验**：保持所有界面功能完整，但实际不执行修改操作
- **安全隔离**：使用内存数据库，确保数据安全

### Demo 账号

Demo 模式提供两个预设账号：

#### 管理员账号
- **用户名**：`demo_admin`
- **昵称**：演示管理员
- **邮箱**：`demo_admin@example.com`
- **密码**：`Demo@123456`（可通过环境变量配置）
- **用途**：展示管理员后台功能

#### 普通用户账号
- **用户名**：`demo_user`
- **昵称**：演示用户
- **邮箱**：`demo_user@example.com`
- **密码**：`Demo@123456`（可通过环境变量配置）
- **用途**：展示普通用户功能

## 在线演示

你可以访问 [草梅 Auth Demo 站](https://auth-demo.cmyr.dev/) 体验 Demo 模式的所有功能。

## 配置方式

### 环境变量配置

在 `.env` 文件中添加以下配置：

```env
# 启用 Demo 模式
NUXT_PUBLIC_DEMO_MODE=true

# Demo 账号密码（可选，默认为 Demo@123456）
DEMO_PASSWORD=Demo@123456
```

### 配置文件

相关配置在以下文件中定义：

1. **utils/env.ts** - 环境变量导出
2. **nuxt.config.ts** - 运行时配置
3. **server/utils/demo-data-generator.ts** - 假数据生成器

## 技术实现

### 数据库隔离

Demo 模式使用特殊的数据库配置来实现数据隔离：

```typescript
// utils/env.ts
export const DATABASE_TYPE = DEMO_MODE ? 'sqlite' : (process.env.DATABASE_TYPE || 'sqlite')
export const DATABASE_PATH = DEMO_MODE ? ':memory:' : (process.env.DATABASE_PATH || 'database/caomei-auth.sqlite')
```

- **数据库类型**：强制使用 SQLite
- **数据库路径**：`:memory:` 表示使用内存数据库
- **数据隔离**：所有数据存储在内存中，重启后清空

### 前端组件

#### Demo 模式横幅
- **组件**：`components/demo-mode-banner.vue`
- **功能**：在页面顶部显示 Demo 模式提示
- **位置**：所有页面（default.vue 和 admin.vue 布局）

#### Demo 模式对话框
- **组件**：`components/demo-mode-dialog.vue`
- **功能**：拦截操作时显示提示对话框
- **触发**：当用户尝试执行修改操作时

### 组合式函数

#### useDemoMode
```typescript
// composables/use-demo-mode.ts
export function useDemoMode() {
    const config = useRuntimeConfig()
    const isDemoMode = computed(() => config.public.demoMode)
    return { isDemoMode }
}
```

#### useDemoModeGuard
```typescript
export function useDemoModeGuard() {
    const { isDemoMode } = useDemoMode()
    const showDemoDialog = ref(false)
    const demoMessage = ref('')

    const checkDemoMode = (message?: string): boolean => {
        if (isDemoMode.value) {
            demoMessage.value = message || ''
            showDemoDialog.value = true
            return true
        }
        return false
    }

    // 其他方法...
}
```

#### useDemoBanner
控制 Demo 模式横幅的显示和隐藏。

### 假数据生成

Demo 模式包含一个完整的假数据生成系统：

```typescript
// server/utils/demo-data-generator.ts
export function generateDemoUsers(count: number = 50): DemoUser[]
export function generateDemoOAuthApplications(count: number = 10): DemoOAuthApplication[]
export function generateDemoLoginLogs(count: number = 100): DemoLoginLog[]
export function generateDemoSSOProviders(): DemoSSOProvider[]
export function generateDemoStats(): DemoStats
```

### 类型定义

完整的 Demo 模式类型定义在 `types/demo.d.ts` 中：

```typescript
export interface DemoUser {
    id?: string
    name: string
    username?: string
    email: string
    emailVerified: boolean
    // ... 其他字段
}

export interface DemoOAuthApplication {
    id: string
    name: string
    clientId: string
    // ... 其他字段
}

// 其他接口定义...
```

## 安全考虑

### 数据脱敏

Demo 模式对敏感数据进行脱敏处理：

- **邮箱地址**：`user***@example.com`
- **手机号**：`138****1234`
- **IP 地址**：`192.168.*.*`
- **真实姓名**：使用假名替代

### 操作限制

以下操作在 Demo 模式下被禁止：

- ❌ 修改、删除操作
- ❌ 发送邮件/短信
- ❌ 文件上传
- ❌ 敏感配置修改
- ❌ 注册新用户（除预设账号外）

### 安全机制

1. **内存数据库**：所有数据存储在内存中，重启后自动清空
2. **操作拦截**：前端和后端双重拦截危险操作
3. **假数据**：使用生成的假数据，不涉及真实用户信息
4. **只读模式**：确保不会对系统造成任何实际影响

## 用户体验

### 界面提示

1. **横幅提示**：页面顶部显示 Demo 模式横幅
2. **操作反馈**：执行操作时显示友好的提示对话框
3. **功能完整**：保持所有界面功能完整性
4. **视觉标识**：明确的 Demo 模式视觉标识

### 交互体验

- ✅ 所有页面正常访问
- ✅ 所有按钮正常响应
- ✅ 表单验证正常工作
- ✅ 数据展示完整
- ⚠️ 修改操作友好提示
- ⚠️ 功能限制明确说明

## 开发指南

### 启用 Demo 模式

1. **设置环境变量**：
   ```bash
   NUXT_PUBLIC_DEMO_MODE=true
   ```

2. **启动应用**：
   ```bash
   pnpm dev
   ```

3. **验证模式**：
   - 检查页面顶部是否显示 Demo 模式横幅
   - 尝试修改操作是否被拦截

### 添加 Demo 模式支持

如果你需要为新功能添加 Demo 模式支持：

#### 1. 前端操作拦截

```typescript
// 在组件中使用
const { checkDemoMode } = useDemoModeGuard()

const handleDelete = () => {
    if (checkDemoMode('删除操作在 Demo 模式下不可用')) {
        return
    }
    // 执行实际删除操作
}
```

#### 2. 后端 API 保护

```typescript
// 在 API 路由中添加检查
import { DEMO_MODE } from '@/utils/env'

export default defineEventHandler(async (event) => {
    if (DEMO_MODE) {
        return {
            status: 403,
            success: false,
            message: 'Demo 模式下不允许此操作'
        }
    }
    // 执行实际操作
})
```

#### 3. 假数据支持

在 `server/utils/demo-data-generator.ts` 中添加相应的假数据生成函数。

### 最佳实践

1. **保持一致性**：所有需要拦截的操作都应该使用统一的拦截机制
2. **友好提示**：为用户提供清晰的操作限制说明
3. **功能完整**：确保 Demo 模式下界面功能的完整性
4. **安全第一**：确保不会泄露真实数据或造成安全风险

## 常见问题

### Q: Demo 模式下的数据会持久化吗？

A: 不会。Demo 模式使用内存数据库（`:memory:`），所有数据在应用重启后会自动清空。

### Q: 如何自定义 Demo 账号密码？

A: 通过设置 `DEMO_PASSWORD` 环境变量来自定义密码，默认为 `Demo@123456`。

### Q: Demo 模式会影响性能吗？

A: 影响很小。Demo 模式主要是改变数据库配置和添加操作拦截，对性能影响微乎其微。

### Q: 可以在生产环境使用 Demo 模式吗？

A: 可以，但需要注意：
- 确保不会暴露敏感信息
- 定期重启以清空内存数据
- 监控系统资源使用情况

### Q: 如何禁用 Demo 模式？

A: 删除或设置 `NUXT_PUBLIC_DEMO_MODE=false` 环境变量，然后重启应用。

## 相关文件

- `composables/use-demo-mode.ts` - Demo 模式组合式函数
- `components/demo-mode-banner.vue` - Demo 模式横幅组件
- `components/demo-mode-dialog.vue` - Demo 模式对话框组件
- `server/utils/demo-data-generator.ts` - 假数据生成器
- `types/demo.d.ts` - Demo 模式类型定义
- `utils/env.ts` - 环境变量配置
- `docs/DEMO.md` - Demo 模式实现计划
