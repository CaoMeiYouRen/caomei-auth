# 常见问题

本文档收集了用户在使用草梅 Auth 过程中的常见问题和解答。

## 安装和部署

### Q1: 支持哪些 Node.js 版本？

**A**: 草梅 Auth 需要 Node.js 18 或更高版本。推荐使用最新的 LTS 版本。

```bash
# 检查 Node.js 版本
node --version

# 推荐版本：18.x, 20.x, 22.x
```

### Q2: 支持哪些数据库？

**A**: 支持以下数据库：

-   **PostgreSQL** (推荐) - 版本 12+
-   **MySQL** - 版本 8.0+
-   **SQLite** - 适用于开发环境

生产环境推荐使用 PostgreSQL，因为它对 JSON 字段有更好的支持。

### Q3: 为什么推荐使用 pnpm 而不是 npm？

**A**: pnpm 有以下优势：

-   更快的安装速度
-   更小的磁盘占用
-   更严格的依赖管理
-   更好的 monorepo 支持

如果必须使用 npm，请确保使用 npm 7+ 版本。

### Q4: Docker 部署时如何处理环境变量？

**A**: 有几种方式：

1. **使用 .env 文件**：

```bash
docker run --env-file .env caomei-auth
```

2. **通过命令行传递**：

```bash
docker run -e AUTH_SECRET=your-secret caomei-auth
```

3. **使用 Docker Compose**：

```yaml
services:
    app:
        environment:
            - AUTH_SECRET=${AUTH_SECRET}
```

## 认证配置

### Q5: 如何设置管理员用户？

**A**: 有两种方式设置管理员：

1. **环境变量**（推荐）：

```env
ADMIN_USER_IDS=user-id-1,user-id-2,user-id-3
```

2. **API 调用**：

```javascript
// 需要已有管理员权限
await authClient.admin.setRole({
    userId: "target-user-id",
    role: "admin",
});
```

### Q6: 忘记管理员密码怎么办？

**A**: 几种解决方案：

1. **重置密码**：通过邮箱重置功能
2. **数据库直接修改**：

```sql
-- 重置为默认密码 "password123"
UPDATE "user" SET password = '$2a$10$...' WHERE id = 'admin-user-id';
```

3. **临时提权**：修改环境变量添加其他用户 ID

### Q7: 社交登录配置后不生效？

**A**: 请检查以下几点：

1. **回调 URL 是否正确**：

    - GitHub: `https://your-domain.com/api/auth/callback/github`
    - Google: `https://your-domain.com/api/auth/callback/google`

2. **环境变量是否设置**：

```env
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

3. **应用是否已审核通过**（微信、QQ 等需要审核）

4. **域名是否已备案**（国内平台要求）

## 邮件服务

### Q8: Gmail SMTP 认证失败？

**A**: 需要使用应用专用密码：

1. 开启两步验证
2. 生成应用专用密码
3. 使用应用密码而非登录密码

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
```

### Q9: 邮件发送成功但收不到？

**A**: 常见原因：

1. **邮件被标记为垃圾邮件**：检查垃圾邮件文件夹
2. **发件人声誉问题**：配置 SPF、DKIM、DMARC 记录
3. **邮件内容被过滤**：避免使用敏感词汇
4. **接收方邮箱设置**：检查是否屏蔽了外域邮件

### Q10: 如何配置自定义邮件模板？

**A**: 目前系统使用简单的纯文本邮件格式，HTML 邮件模板功能计划在未来版本中支持。

当前邮件内容由 better-auth 插件配置管理，可以在 `lib/auth.ts` 中的相关插件配置中修改邮件内容：

```typescript
emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
        await sendEmail({
            to: user.email,
            subject: '验证你的邮箱地址',
            text: `点击链接验证你的邮箱：${url}`,
        })
    },
},
emailOTP: {
    async sendVerificationOTP({ email, otp, type }) {
        if (type === 'sign-in') {
            await sendEmail({
                to: email,
                subject: '您的登录验证码',
                text: `您的验证码是：${otp}`,
            })
        }
        // ... 其他类型的 OTP 邮件
    },
}
      `,
        });
    };
}
```

## 数据库问题

### Q11: 数据库迁移失败？

**A**: 常见解决方案：

1. **检查数据库权限**：确保用户有 CREATE、ALTER 权限
2. **手动创建数据库**：

```sql
-- PostgreSQL
CREATE DATABASE caomei_auth OWNER caomei_auth;

-- MySQL
CREATE DATABASE caomei_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

3. **清理重试**：

```bash
# 删除已创建的表（谨慎操作）
DROP DATABASE caomei_auth;
CREATE DATABASE caomei_auth;

# 重新运行迁移
pnpm build
```

### Q12: 如何备份和恢复数据库？

**A**: 数据库备份命令：

```bash
# PostgreSQL
pg_dump -h localhost -U caomei_auth caomei_auth > backup.sql
psql -h localhost -U caomei_auth caomei_auth < backup.sql

# MySQL
mysqldump -u caomei_auth -p caomei_auth > backup.sql
mysql -u caomei_auth -p caomei_auth < backup.sql

# SQLite
cp ./database/caomei-auth.sqlite ./backup/caomei-auth-backup.sqlite
```

### Q13: 数据库连接池配置？

**A**: 根据服务器配置调整：

```env
# 小型应用
DATABASE_MAX_CONNECTIONS=5

# 中型应用
DATABASE_MAX_CONNECTIONS=10

# 大型应用
DATABASE_MAX_CONNECTIONS=20
```

## 性能问题

### Q14: 响应速度慢如何优化？

**A**: 性能优化建议：

1. **启用 Redis 缓存**：

```env
REDIS_URL=redis://localhost:6379
```

2. **数据库索引优化**：确保主要查询字段有索引

3. **CDN 加速**：配置静态资源 CDN

4. **负载均衡**：多实例部署

### Q15: 内存使用过高？

**A**: 内存优化：

1. **调整 Node.js 内存限制**：

```bash
node --max-old-space-size=512 dist/server/index.mjs
```

2. **优化数据库连接池**：

```env
DATABASE_MAX_CONNECTIONS=5
```

3. **启用垃圾回收**：

```bash
node --expose-gc dist/server/index.mjs
```

## 安全问题

### Q16: 如何提高系统安全性？

**A**: 安全最佳实践：

1. **使用强密钥**：

```env
# 生成32位随机密钥
AUTH_SECRET=$(openssl rand -hex 32)
```

2. **启用 HTTPS**：

```env
HTTPS_ONLY=true
SECURE_COOKIES=true
```

3. **配置防火墙**：只开放必要端口

4. **定期更新**：保持依赖包最新

### Q17: 如何防止暴力破解？

**A**: 内置限流保护：

```typescript
rateLimit: {
  window: 60, // 时间窗口（秒）
  max: 60, // 最大请求数
  customRules: {
    '/sign-in/*': { window: 60, max: 3 }, // 登录限流
    '/sign-up/*': { window: 60, max: 3 }  // 注册限流
  }
}
```

### Q18: 如何审计用户行为？

**A**: 查看登录日志：

1. **管理后台**：访问 `/admin/logs` 查看详细日志
2. **API 接口**：调用管理员 API 获取日志
3. **数据库查询**：直接查询 session 表

## 集成问题

### Q19: 如何集成到现有系统？

**A**: 几种集成方式：

1. **OAuth 2.0 集成**：作为认证提供商
2. **SSO 单点登录**：iframe 嵌入或跳转
3. **API 集成**：通过 REST API 调用
4. **SDK 集成**：使用 better-auth 客户端

### Q20: 跨域问题如何解决？

**A**: CORS 配置：

```env
# 允许的域名
CORS_ORIGIN=https://your-frontend-domain.com

# 多个域名
CORS_ORIGIN=https://domain1.com,https://domain2.com

# 开发环境允许所有域名（不推荐生产环境）
CORS_ORIGIN=*
```

## 升级问题

### Q21: 如何升级到新版本？

**A**: 升级步骤：

1. **备份数据**：

```bash
# 备份数据库
pg_dump caomei_auth > backup.sql

# 备份配置文件
cp .env .env.backup
```

2. **更新代码**：

```bash
git fetch origin
git checkout master
git pull origin master
```

3. **更新依赖**：

```bash
pnpm install
```

4. **运行迁移**：

```bash
pnpm build
```

5. **重启服务**：

```bash
pm2 restart caomei-auth
```

### Q22: 升级后出现问题如何回滚？

**A**: 回滚步骤：

1. **恢复代码**：

```bash
git checkout previous-working-commit
```

2. **恢复数据库**：

```bash
psql caomei_auth < backup.sql
```

3. **恢复配置**：

```bash
cp .env.backup .env
```

4. **重启服务**：

```bash
pm2 restart caomei-auth
```

## 开发问题

### Q23: 如何在本地开发环境调试？

**A**: 开发环境设置：

```env
NODE_ENV=development
DEBUG=better-auth:*
LOG_LEVEL=debug
```

```bash
# 启动开发服务器
pnpm dev

# 查看详细日志
DEBUG=* pnpm dev
```

### Q24: 如何添加自定义字段？

**A**: 扩展用户模型：

1. **创建迁移文件**：

```sql
ALTER TABLE "user" ADD COLUMN "custom_field" VARCHAR(255);
```

2. **更新类型定义**：

```typescript
// types/user.ts
declare module "better-auth" {
    interface User {
        customField?: string;
    }
}
```

3. **在注册时处理**：

```typescript
// 自定义注册逻辑
export default defineEventHandler(async (event) => {
    // 处理自定义字段
});
```

## 获取帮助

如果您的问题不在上述列表中，可以：

1. **查看文档**：[草梅 Auth 文档](https://auth-docs.cmyr.dev/)
2. **查看源码**：[GitHub 仓库](https://github.com/CaoMeiYouRen/caomei-auth)
3. **提交问题**：[GitHub Issues](https://github.com/CaoMeiYouRen/caomei-auth/issues)
4. **社区讨论**：[GitHub Discussions](https://github.com/CaoMeiYouRen/caomei-auth/discussions)

### 提问模板

为了更快得到帮助，请提供以下信息：

````markdown
## 问题描述

简单描述遇到的问题

## 环境信息

-   Node.js 版本：
-   数据库类型和版本：
-   部署方式：
-   操作系统：

## 重现步骤

1. 第一步
2. 第二步
3. 第三步

## 预期结果

描述期望的行为

## 实际结果

描述实际发生的情况

## 相关日志

`粘贴相关的错误日志`

## 已尝试的解决方案

描述已经尝试过的解决方法
````

这样可以帮助我们更快地定位和解决问题。
