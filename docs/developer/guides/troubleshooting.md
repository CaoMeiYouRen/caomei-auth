# 故障排除指南

本文档提供了使用草梅 Auth 时常见问题的解决方案和调试技巧。

## 常见问题

### 1. 认证问题

#### 问题：登录失败，返回 "Invalid credentials"

**可能原因：**

-   用户名/邮箱或密码错误
-   账户被禁用
-   邮箱未验证（如果要求验证）

**解决方案：**

1. 验证用户输入的凭据
2. 检查用户账户状态：
    ```bash
    # 在数据库中查询用户状态
    SELECT id, email, banned, email_verified FROM user WHERE email = 'user@example.com';
    ```
3. 如果邮箱未验证，重新发送验证邮件

#### 问题：OAuth 授权失败，返回 "Invalid client"

**可能原因：**

-   `client_id` 错误或不存在
-   客户端应用被禁用
-   重定向 URI 不匹配

**解决方案：**

1. 验证客户端配置：
    ```bash
    # 查询OAuth应用信息
    SELECT id, client_id, redirect_uris, disabled FROM oauth_application WHERE client_id = 'your_client_id';
    ```
2. 检查重定向 URI 是否完全匹配（包括协议、域名、端口、路径）
3. 确认客户端应用未被禁用

#### 问题：令牌刷新失败

**可能原因：**

-   `refresh_token` 已过期
-   `refresh_token` 已被撤销
-   客户端认证失败

**解决方案：**

1. 检查令牌状态：
    ```javascript
    // 检查令牌过期时间
    const tokenInfo = jwt.decode(refreshToken);
    console.log("Token expires at:", new Date(tokenInfo.exp * 1000));
    ```
2. 如果令牌过期，引导用户重新登录
3. 验证客户端密钥是否正确

### 2. 社交登录问题

#### 问题：GitHub 登录失败

**可能原因：**

-   GitHub 应用配置错误
-   回调 URL 不匹配
-   权限范围不足

**解决方案：**

1. 检查 GitHub 应用设置：

    - 确认 `Authorization callback URL` 设置为 `https://your-domain.com/api/auth/callback/github`
    - 验证 `Client ID` 和 `Client Secret`

2. 检查环境变量：

    ```env
    GITHUB_CLIENT_ID=your_github_client_id
    GITHUB_CLIENT_SECRET=your_github_client_secret
    ```

3. 测试回调 URL 是否可访问

#### 问题：微信登录返回 "invalid openid"

**可能原因：**

-   微信应用配置错误
-   获取 openid 失败
-   网络问题

**解决方案：**

1. 检查微信开放平台配置
2. 验证应用审核状态
3. 检查网络连通性：
    ```bash
    curl -X GET "https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code"
    ```

### 3. 邮件发送问题

#### 问题：验证邮件发送失败

**可能原因：**

-   SMTP 配置错误
-   邮件服务商限制
-   网络连接问题

**解决方案：**

1. 检查 SMTP 配置：

    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your-email@gmail.com
    SMTP_PASS=your-app-password
    SMTP_SECURE=false
    ```

2. 测试 SMTP 连接：

    ```javascript
    import nodemailer from "nodemailer";

    const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    // 测试连接
    transporter.verify((error, success) => {
        if (error) {
            console.log("SMTP Error:", error);
        } else {
            console.log("SMTP服务器连接成功");
        }
    });
    ```

3. 检查邮件模板和内容

#### 问题：邮件被标记为垃圾邮件

**解决方案：**

1. 配置 SPF 记录：

    ```dns
    v=spf1 include:_spf.google.com ~all
    ```

2. 配置 DKIM 签名
3. 设置合理的发送频率
4. 使用专业的邮件服务提供商

### 4. 短信发送问题

#### 问题：短信验证码发送失败

**可能原因：**

-   短信服务配置错误
-   余额不足
-   手机号格式错误
-   频率限制

**解决方案：**

1. 验证手机号格式：

    ```javascript
    import { parsePhoneNumber } from "libphonenumber-js";

    try {
        const phoneNumber = parsePhoneNumber("+86 12312345678");
        console.log("Valid:", phoneNumber.isValid());
        console.log("Format:", phoneNumber.format("E.164"));
    } catch (error) {
        console.log("Invalid phone number:", error.message);
    }
    ```

2. 检查短信服务配置和余额
3. 验证 API 密钥和签名

### 5. 数据库问题

#### 问题：数据库连接失败

**可能原因：**

-   数据库服务未启动
-   连接参数错误
-   网络问题
-   连接池耗尽

**解决方案：**

1. 检查数据库服务状态：

    ```bash
    # PostgreSQL
    sudo systemctl status postgresql

    # MySQL
    sudo systemctl status mysql
    ```

2. 验证连接参数：

    ```env
    DATABASE_TYPE=postgres
    DATABASE_HOST=localhost
    DATABASE_PORT=5432
    DATABASE_USERNAME=auth_user
    DATABASE_PASSWORD=your_password
    DATABASE_NAME=caomei_auth
    ```

3. 测试数据库连接：

    ```bash
    # PostgreSQL
    psql -h localhost -U auth_user -d caomei_auth

    # MySQL
    mysql -h localhost -u auth_user -p caomei_auth
    ```

#### 问题：数据库迁移失败

**解决方案：**

1. 检查迁移文件语法
2. 验证数据库权限
3. 手动运行迁移：
    ```bash
    npm run typeorm:migration:run
    ```

### 6. 性能问题

#### 问题：API 响应缓慢

**诊断步骤：**

1. 启用详细日志：

    ```env
    LOG_LEVEL=debug
    DATABASE_LOGGING=true
    ```

2. 分析慢查询：

    ```sql
    -- PostgreSQL
    SELECT query, mean_exec_time, calls
    FROM pg_stat_statements
    ORDER BY mean_exec_time DESC
    LIMIT 10;

    -- MySQL
    SELECT * FROM mysql.slow_log
    ORDER BY start_time DESC
    LIMIT 10;
    ```

3. 监控资源使用：

    ```bash
    # CPU和内存
    top -p $(pgrep node)

    # 数据库连接
    SELECT count(*) FROM pg_stat_activity; -- PostgreSQL
    SHOW PROCESSLIST; -- MySQL
    ```

**优化建议：**

-   添加数据库索引
-   使用连接池
-   启用查询缓存
-   优化数据库查询

### 7. 部署问题

#### 问题：Docker 容器启动失败

**解决方案：**

1. 检查 Docker 日志：

    ```bash
    docker logs caomei-auth
    ```

2. 验证环境变量：

    ```bash
    docker exec -it caomei-auth env | grep DATABASE
    ```

3. 检查网络连接：
    ```bash
    docker exec -it caomei-auth ping database-host
    ```

#### 问题：Vercel 部署失败

**常见原因：**

-   环境变量未设置
-   函数超时
-   内存限制

**解决方案：**

1. 检查构建日志
2. 设置正确的环境变量
3. 优化函数性能，减少执行时间

## 调试技巧

### 1. 启用调试模式

```env
NODE_ENV=development
DEBUG=better-auth:*
LOG_LEVEL=debug
```

### 2. 使用开发者工具

在浏览器中查看网络请求：

1. 打开开发者工具 (F12)
2. 切换到 Network 标签
3. 执行认证操作
4. 检查请求和响应

### 3. 日志分析

添加自定义日志：

```javascript
import { logger } from "@/server/utils/logger";

export default defineEventHandler(async (event) => {
    logger.info("API请求开始", {
        path: event.node.req.url,
        method: event.node.req.method,
        userAgent: getHeader(event, "user-agent"),
    });

    try {
        const result = await processRequest(event);
        logger.info("API请求成功", { result });
        return result;
    } catch (error) {
        logger.error("API请求失败", {
            error: error.message,
            stack: error.stack,
        });
        throw error;
    }
});
```

### 4. 健康检查

创建健康检查端点：

```javascript
// /api/health
export default defineEventHandler(async (event) => {
    const checks = {
        database: false,
        redis: false,
        smtp: false,
    };

    try {
        // 检查数据库
        await dataSource.query("SELECT 1");
        checks.database = true;
    } catch (error) {
        logger.error("数据库健康检查失败", error);
    }

    try {
        // 检查Redis
        if (redis) {
            await redis.ping();
            checks.redis = true;
        }
    } catch (error) {
        logger.error("Redis健康检查失败", error);
    }

    return {
        status: Object.values(checks).every(Boolean) ? "healthy" : "unhealthy",
        checks,
        timestamp: new Date().toISOString(),
    };
});
```

## 获取帮助

如果以上解决方案都无法解决您的问题，您可以：

1. **查看日志**：检查应用程序和数据库日志
2. **搜索文档**：使用文档搜索功能查找相关信息
3. **查看源码**：参考 [GitHub 仓库](https://github.com/CaoMeiYouRen/caomei-auth)
4. **提交问题**：在 [Issues](https://github.com/CaoMeiYouRen/caomei-auth/issues) 中描述您的问题
5. **社区讨论**：参与社区讨论，寻求帮助

### 提交问题时请包含

-   错误信息和堆栈跟踪
-   重现步骤
-   环境信息（Node.js 版本、数据库版本等）
-   相关配置（去除敏感信息）
-   日志文件（如果有的话）

这样可以帮助我们更快地定位和解决问题。
