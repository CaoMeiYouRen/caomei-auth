# Cloudflare Workers 部署

> ⚠️ **注意**: 当前版本尚不支持 Cloudflare Workers 部署，此文档为规划中的功能。

Cloudflare Workers 提供边缘计算能力，在全球 200+ 个数据中心运行，具有极低延迟和高可用性。

## 系统要求

-   Cloudflare 账号
-   Wrangler CLI >= 3.0
-   外部数据库服务（推荐 Cloudflare D1 或 PlanetScale）

## 准备工作

### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

### 2. 登录 Cloudflare

```bash
wrangler auth login
```

## 项目配置

### 1. 创建 wrangler.toml

```toml
name = "caomei-auth"
main = "dist/index.js"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[env.production]
name = "caomei-auth-prod"
vars = { NODE_ENV = "production" }

[env.staging]
name = "caomei-auth-staging"
vars = { NODE_ENV = "staging" }

# 绑定 D1 数据库
[[d1_databases]]
binding = "DB"
database_name = "caomei_auth"
database_id = "your-database-id"

# KV 存储用于会话
[[kv_namespaces]]
binding = "SESSIONS"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"

# R2 存储用于文件上传
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "caomei-auth-uploads"
```

### 2. 创建 Nuxt 配置

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
    nitro: {
        preset: "cloudflare-pages",
        // 或使用 Workers 预设
        // preset: 'cloudflare'
    },

    // 运行时配置
    runtimeConfig: {
        authSecret: process.env.AUTH_SECRET,
        databaseUrl: process.env.DATABASE_URL,
        emailHost: process.env.EMAIL_HOST,
        // ... 其他配置
    },

    // 禁用 SSR 中不支持的功能
    ssr: true,
    experimental: {
        payloadExtraction: false,
    },
});
```

## 数据库配置

Cloudflare Workers 环境需要使用 D1 数据库或外部数据库服务。

详细的数据库配置指南请参考：**👉 [数据库配置指南](./database)**

### 使用 Cloudflare D1

#### 1. 创建 D1 数据库

```bash
# 创建数据库
wrangler d1 create caomei_auth

# 执行迁移
wrangler d1 execute caomei_auth --file=./database/sqlite/create.sql
```

#### 2. 配置数据库连接

```typescript
// server/utils/db.ts
export async function getDatabase() {
    // 在 Cloudflare Workers 中使用 D1
    if (process.env.CLOUDFLARE) {
        return (globalThis as any).DB;
    }

    // 本地开发使用 SQLite
    const { Database } = await import("better-sqlite3");
    return new Database("database/caomei-auth.sqlite");
}
```

### 使用外部数据库

```toml
# wrangler.toml
[vars]
DATABASE_URL = "your-external-database-url"
```

## 环境变量配置

### 1. 设置生产环境变量

```bash
# 设置密钥
wrangler secret put AUTH_SECRET --env production

# 设置邮件配置
wrangler secret put EMAIL_HOST --env production
wrangler secret put EMAIL_USER --env production
wrangler secret put EMAIL_PASS --env production

# 设置数据库
wrangler secret put DATABASE_URL --env production
```

### 2. 批量设置环境变量

创建 `secrets.json`：

```json
{
    "AUTH_SECRET": "your-super-secret-key",
    "EMAIL_HOST": "smtp.gmail.com",
    "EMAIL_USER": "your-email@gmail.com",
    "EMAIL_PASS": "your-app-password",
    "DATABASE_URL": "your-database-url"
}
```

```bash
# 批量上传
for key in $(jq -r 'keys[]' secrets.json); do
  value=$(jq -r ".$key" secrets.json)
  echo "$value" | wrangler secret put "$key" --env production
done
```

## 部署流程

### 1. 构建项目

```bash
# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 2. 部署到 Workers

```bash
# 部署到生产环境
wrangler deploy --env production

# 部署到测试环境
wrangler deploy --env staging
```

### 3. 自定义域名

```bash
# 添加自定义域名
wrangler route add "auth.your-domain.com/*" caomei-auth-prod
```

## 存储配置

### 文件上传 (R2)

```typescript
// server/api/file/upload.post.ts
export default defineEventHandler(async (event) => {
    const { UPLOADS } = event.context.cloudflare.env;

    const formData = await readMultipartFormData(event);
    const file = formData?.[0];

    if (!file) {
        throw createError({
            statusCode: 400,
            statusMessage: "No file provided",
        });
    }

    // 上传到 R2
    await UPLOADS.put(`uploads/${file.filename}`, file.data, {
        httpMetadata: {
            contentType: file.type,
        },
    });

    return { success: true, filename: file.filename };
});
```

### 会话存储 (KV)

```typescript
// server/utils/session.ts
export async function getSession(sessionId: string) {
    const { SESSIONS } = globalThis.CLOUDFLARE_ENV;
    return await SESSIONS.get(sessionId, "json");
}

export async function setSession(sessionId: string, data: any) {
    const { SESSIONS } = globalThis.CLOUDFLARE_ENV;
    await SESSIONS.put(sessionId, JSON.stringify(data), {
        expirationTtl: 86400, // 24 小时
    });
}
```

## 限制和适配

### 1. 运行时限制

-   CPU 时间：最大 50ms (免费)，10 秒 (付费)
-   内存：128MB
-   请求大小：100MB
-   响应大小：100MB

### 2. 不支持的功能

由于 Workers 环境限制，以下功能需要适配：

```typescript
// 不支持 Node.js fs 模块
// import fs from 'fs' ❌

// 使用 Web APIs 替代
// fetch API ✅
// crypto.subtle ✅
// TextEncoder/TextDecoder ✅
```

### 3. 依赖适配

```typescript
// 替换不兼容的依赖
// import nodemailer from 'nodemailer' ❌

// 使用 Workers 兼容的邮件发送
export async function sendEmail(to: string, subject: string, html: string) {
    return fetch("https://api.mailgun.net/v3/your-domain/messages", {
        method: "POST",
        headers: {
            Authorization: `Basic ${btoa("api:" + MAILGUN_API_KEY)}`,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            from: "Your App <noreply@your-domain.com>",
            to,
            subject,
            html,
        }),
    });
}
```

## 监控和日志

### 1. 实时日志

```bash
# 查看实时日志
wrangler tail caomei-auth-prod

# 带过滤的日志
wrangler tail caomei-auth-prod --format pretty
```

### 2. Analytics

```typescript
// 添加自定义指标
export default defineEventHandler(async (event) => {
    // 记录请求
    event.context.cloudflare.ctx.waitUntil(
        fetch("https://analytics.your-domain.com/api/track", {
            method: "POST",
            body: JSON.stringify({
                path: event.node.req.url,
                userAgent: getHeader(event, "user-agent"),
                timestamp: Date.now(),
            }),
        })
    );

    // ... 处理逻辑
});
```

## CI/CD 配置

### GitHub Actions

```yaml
name: Deploy to Cloudflare Workers

on:
    push:
        branches: [master]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v3

            - name: Setup Node.js
              uses: actions/setup-node@v3
              with:
                  node-version: "18"

            - name: Install dependencies
              run: npm install -g pnpm && pnpm install

            - name: Build
              run: pnpm build

            - name: Deploy to Cloudflare Workers
              uses: cloudflare/wrangler-action@v3
              with:
                  apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
                  environment: "production"
```

## 故障排除

### 1. 调试本地开发

```bash
# 本地开发服务器
wrangler dev

# 指定端口
wrangler dev --port 3000

# 使用远程数据库
wrangler dev --remote
```

### 2. 常见错误

**依赖不兼容**

```bash
# 检查兼容性
wrangler compatibility-date --help

# 更新兼容性标志
# 在 wrangler.toml 中添加
compatibility_flags = ["nodejs_compat"]
```

**内存超限**

```typescript
// 优化内存使用
export default defineEventHandler(async (event) => {
    // 避免大对象
    // 使用流处理大文件
    // 及时释放引用
});
```

### 3. 性能优化

```typescript
// 缓存响应
export default defineEventHandler(async (event) => {
    const cache = caches.default;
    const cacheKey = new Request(event.node.req.url);

    // 检查缓存
    let response = await cache.match(cacheKey);
    if (response) {
        return response;
    }

    // 生成响应
    response = new Response(JSON.stringify(data), {
        headers: {
            "Content-Type": "application/json",
            "Cache-Control": "max-age=300",
        },
    });

    // 存储到缓存
    event.context.cloudflare.ctx.waitUntil(
        cache.put(cacheKey, response.clone())
    );

    return response;
});
```

## 费用优化

### 1. 免费额度

-   100,000 请求/天
-   1000 KV 操作/天
-   1 GB R2 存储

### 2. 成本控制

```typescript
// 使用缓存减少数据库查询
// 优化函数执行时间
// 合理设置 TTL
```

## 迁移指南

从其他平台迁移到 Cloudflare Workers：

1. **评估兼容性**: 检查依赖是否支持 Workers 环境
2. **数据迁移**: 将数据迁移到 D1 或外部数据库
3. **功能适配**: 替换不兼容的 Node.js API
4. **测试验证**: 在 staging 环境充分测试
5. **逐步切换**: 使用流量分配逐步切换
