## Demo 模式实现计划

### 0.管理员和用户账号

demo_admin 用于展示 管理员 视角

demo_user 用于展示 用户 视角

### 1. 环境变量配置

**新增环境变量**

-   `DEMO_MODE` - 启用 Demo 模式
-   `DEMO_ADMIN_USER_EMAIL` - Demo 模式管理员邮箱

**修改文件：**

1. .env.example - 添加 Demo 模式相关配置
2. env.ts - 导出 Demo 模式环境变量
3. nuxt.config.ts - 将 Demo 模式配置添加到 runtimeConfig

### 2. 假数据生成器

**创建新文件：**

1. `server/utils/demo-data-generator.ts` - 假数据生成工具
2. `server/utils/demo-middleware.ts` - Demo 模式中间件
3. `types/demo.d.ts` - Demo 模式类型定义

**功能包括：**

-   生成假的用户数据（脱敏处理）
-   生成假的 OAuth 应用数据
-   生成假的登录日志数据
-   生成假的 SSO 提供商数据

### 3. 数据库隔离

**实现思路：**

-   Demo 模式下使用内存数据库或专用测试数据库
-   拦截所有写操作，防止对真实数据的修改
-   提供只读的假数据接口

**修改文件：**

1. index.ts - 数据库连接逻辑
2. check-admin.ts - 管理员权限检查

### 4. API 接口改造

**需要改造的 API 接口：**

**管理后台接口：**

-   `server/api/admin/users/*` - 用户管理接口
-   `server/api/admin/oauth/applications/*` - OAuth 应用管理接口
-   `server/api/admin/logs/*` - 日志统计接口
-   `server/api/admin/sso/providers/*` - SSO 提供商管理接口

**改造内容：**

-   在 Demo 模式下返回假数据
-   阻止所有写操作（POST、PUT、DELETE）
-   返回成功响应但不实际执行操作

### 5. 前端页面适配

**需要修改的页面：**

-   users.vue - 用户管理页面
-   `pages/admin/oauth/clients.vue` - OAuth 应用管理页面
-   logs.vue - 日志统计页面
-   providers.vue - SSO 提供商管理页面

**改造内容：**

-   添加 Demo 模式标识和提示
-   在执行操作时显示"Demo 模式，操作已被阻止"的提示
-   保持界面功能完整，但实际不执行修改操作

### 6. UI 组件和提示

**创建新组件：**

1. `components/demo-mode-banner.vue` - Demo 模式横幅提示
2. `components/demo-mode-dialog.vue` - Demo 模式操作拦截对话框

**修改布局：**

1. admin.vue - 在管理后台布局中添加 Demo 模式提示

### 7. 中间件和权限控制

**创建中间件：**

1. `middleware/demo-mode.ts` - Demo 模式检查中间件
2. `server/middleware/demo-guard.ts` - 服务器端 Demo 模式守卫

**功能：**

-   检测 Demo 模式状态
-   拦截危险操作
-   提供假数据访问

### 8. 安全考虑

**数据脱敏：**

-   邮箱地址：`user***@example.com`
-   手机号：`138****1234`
-   IP 地址：`192.168.*.*`
-   真实姓名用假名替代

**操作限制：**

-   禁止修改、删除操作
-   禁止发送邮件/短信
-   禁止文件上传
-   禁止敏感配置修改

### 9. 实现步骤

**第一阶段：基础设施**

1. 添加环境变量配置
2. 创建假数据生成器
3. 实现数据库隔离机制

**第二阶段：API 改造**

1. 改造管理后台 API 接口
2. 添加 Demo 模式判断逻辑
3. 实现操作拦截机制

**第三阶段：前端适配**

1. 修改管理后台页面
2. 添加 Demo 模式提示组件
3. 实现操作反馈机制

**第四阶段：测试和优化**

1. 全面测试 Demo 模式功能
2. 优化用户体验
3. 完善文档说明

### 10. 配置示例

```env
# Demo 模式配置
DEMO_MODE=true
DEMO_ADMIN_USER_EMAIL=admin@demo.com
```
