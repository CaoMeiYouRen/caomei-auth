## 项目测试现状分析

**当前测试：**

-   仅有一个端到端测试：api-index.spec.ts - 测试 API 根路径返回信息
-   使用 Vitest + @nuxt/test-utils 作为测试框架

## 建议添加的测试用例

### 1. 单元测试 (Unit Tests)

#### 工具函数测试 (`/tests/unit/utils/`)

1. **validate.ts 测试**

    - `validateEmail()` - 测试各种邮箱格式（有效/无效）
    - `validatePhone()` - 测试不同国家手机号格式验证
    - `validateUrl()` - 测试 URL 格式验证
    - `validatePassword()` - 测试密码强度验证
    - `validateUsername()` - 测试用户名格式验证

2. **privacy.ts 测试**

    - `maskEmail()` - 测试邮箱脱敏功能
    - `maskPhone()` - 测试手机号脱敏功能
    - `maskUserId()` - 测试用户 ID 脱敏功能
    - `maskIP()` - 测试 IP 地址脱敏功能

3. **phone.ts 测试**

    - 手机号格式化功能
    - 国际手机号处理功能

4. **code.ts 测试**
    - 验证码生成和验证逻辑

#### 服务器端工具函数测试 (`/tests/unit/server/utils/`)

1. **random.ts 测试**

    - 随机字符串生成
    - 随机数生成

2. **snowflake.ts 测试**

    - 雪花 ID 生成算法
    - ID 唯一性验证

3. **rate-limit.ts 测试**

    - 速率限制逻辑
    - 不同时间窗口的限制策略

4. **email-template.ts 测试**

    - 邮件模板渲染
    - 不同类型邮件内容生成

5. **logger.ts 测试**
    - 日志记录功能
    - 不同日志级别处理

### 2. 组件测试 (Component Tests) - `/tests/unit/components/`

1. **phone-input.vue 测试**

    - 手机号输入格式化
    - 国家代码选择功能
    - 输入验证反馈

2. **send-code-button.vue 测试**

    - 发送验证码按钮状态管理
    - 倒计时功能
    - 防重复点击机制

3. **auth-left.vue 测试**

    - 认证页面左侧组件渲染
    - 响应式布局适配

4. **app-footer.vue 测试**
    - 页脚信息显示
    - 链接跳转功能

### 3. API 集成测试 (Integration Tests) - `/tests/integration/api/`

#### 认证相关 API

1. **[...all].ts 测试**

    - 登录流程测试（邮箱、用户名、手机号）
    - 注册流程测试
    - 密码重置流程测试
    - JWT Token 验证
    - Session 管理

2. **OAuth API 测试**
    - consents.get.ts - 获取授权同意列表
    - revoke-consent.post.ts - 撤销授权同意
    - [id].get.ts - 获取 OAuth 客户端信息

#### 管理后台 API

1. **用户管理 API**

    - `/api/admin/users/*` - 用户 CRUD 操作
    - 用户状态管理（启用/禁用）

2. **应用管理 API**

    - `/api/admin/oauth/applications/*` - OAuth 应用 CRUD
    - 应用密钥生成和管理

3. **SSO 提供商管理**

    - `/api/admin/sso/providers/*` - SSO 提供商配置管理

4. **日志统计 API**
    - stats.get.ts - 登录统计数据
    - sessions.get.ts - 会话日志

#### 文件上传 API

1. **upload.post.ts 测试**
    - 头像上传功能
    - 文件格式验证
    - 文件大小限制

### 4. 页面端到端测试 (E2E Tests) - `/tests/e2e/pages/`

#### 认证流程

1. **login.vue 测试**

    - 邮箱登录流程
    - 用户名登录流程
    - 手机号登录流程
    - 验证码登录流程
    - 社交媒体登录流程
    - 记住登录状态功能
    - 错误处理和提示

2. **register.vue 测试**

    - 邮箱注册流程
    - 手机号注册流程
    - 用户名注册流程
    - 表单验证和错误提示
    - 验证码发送和验证

3. **forgot-password.vue 测试**
    - 忘记密码流程
    - 邮箱/手机号找回
    - 验证码验证
    - 密码重置

#### 用户功能页面

1. **profile.vue 测试**

    - 个人信息展示
    - 头像上传功能
    - 个人信息修改
    - 表单验证

2. **security.vue 测试**

    - 多因子认证设置
    - 登录日志查看
    - 设备管理功能

3. **change-password.vue 测试**
    - 密码修改流程
    - 当前密码验证
    - 新密码强度检测

#### OAuth 功能

1. **consent.vue 测试**

    - OAuth 授权同意页面
    - 权限范围展示
    - 同意/拒绝流程

2. **clients.vue 测试**
    - 已授权应用列表
    - 撤销授权功能

#### 管理后台

1. **users.vue 测试**

    - 用户列表展示
    - 用户搜索和筛选
    - 用户编辑功能
    - 用户状态管理

2. **applications.vue 测试**

    - OAuth 应用管理
    - 应用创建和编辑
    - 密钥管理

3. **logs.vue 测试**
    - 登录日志展示
    - 统计数据图表
    - 日志筛选和搜索

### 5. 数据库测试 (Database Tests) - `/tests/integration/database/`

1. **用户实体测试**

    - 用户创建、查询、更新、删除
    - 用户关系测试（会话、OAuth 授权等）

2. **OAuth 客户端测试**

    - OAuth 应用 CRUD 操作
    - 授权码和令牌管理

3. **会话管理测试**
    - 会话创建和验证
    - 会话过期处理

### 6. 中间件测试 (Middleware Tests) - `/tests/unit/middleware/`

1. **auth.global.ts 测试**
    - 路由权限验证
    - 未认证用户重定向
    - 管理员权限检查

### 7. 性能测试 (Performance Tests) - `/tests/performance/`

1. **API 性能测试**

    - 登录 API 响应时间
    - 批量用户操作性能
    - 数据库查询性能

2. **页面加载性能**
    - 首页加载时间
    - 登录页面加载性能
    - 管理后台页面性能

### 8. 安全测试 (Security Tests) - `/tests/security/`

1. **身份验证安全测试**

    - SQL 注入防护
    - XSS 攻击防护
    - CSRF 保护
    - 密码暴力破解防护

2. **权限测试**
    - 越权访问防护
    - 管理员权限验证
    - API 授权检查

## 测试优先级建议

**高优先级：**

1. 核心工具函数单元测试（validate.ts, privacy.ts）
2. 认证 API 集成测试
3. 登录/注册页面 E2E 测试

**中优先级：** 4. 组件单元测试 5. 管理后台 API 测试 6. 用户功能页面 E2E 测试

**低优先级：** 7. 性能测试 8. 安全测试 9. 数据库集成测试

这样的测试体系可以确保项目的稳定性、安全性和可维护性，覆盖从单元到集成再到端到端的完整测试链路。
