# 部署指南

本文档提供了草梅 Auth 的详细部署指南，支持多种部署方式。

## 系统要求

-   **Node.js**: >=18.0.0
-   **数据库**: PostgreSQL / MySQL / SQLite
-   **内存**: 至少 512MB RAM
-   **存储**: 至少 1GB 可用空间

## 环境准备

### 1. 安装依赖

```bash
# 克隆项目
git clone https://github.com/CaoMeiYouRen/caomei-auth.git
cd caomei-auth

# 安装依赖
pnpm install
```

### 2. 环境变量配置

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# 基础配置
NUXT_PUBLIC_AUTH_BASE_URL="https://your-domain.com"
NUXT_PUBLIC_CONTACT_EMAIL="contact@your-domain.com"
NUXT_PUBLIC_APP_NAME="草梅Auth"
AUTH_SECRET="your-super-secret-key-at-least-32-characters"

# 数据库配置
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/caomei_auth
DATABASE_SSL=true

# 管理员配置
ADMIN_USER_IDS="1,2,3"

# 邮件服务配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
EMAIL_FROM="Your Name <your-email@gmail.com>"
EMAIL_EXPIRES_IN=300

# 短信服务配置（可选）
NUXT_PUBLIC_PHONE_ENABLED=true
PHONE_SENDER_NAME="草梅Auth"
PHONE_EXPIRES_IN=300
PHONE_CHANNEL=spug
PHONE_SPUG_TEMPLATE_ID=your-template-id

# 第三方监控（可选）
NUXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
NUXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-project-id
```

> 💡 **提示**：更多社交登录配置请参考 [社交登录配置指南](/docs/social-login/)。

### 3. 邮件服务配置

草梅 Auth 支持多种邮件服务提供商，用于发送验证码、密码重置等邮件。

#### 必需环境变量

```env
EMAIL_HOST=smtp.example.com          # SMTP服务器地址
EMAIL_PORT=587                       # SMTP服务器端口
EMAIL_USER=your_email@example.com    # 邮件发送者地址
EMAIL_PASS=your_email_password       # 邮件发送者密码
EMAIL_SECURE=false                   # 是否使用SSL连接
EMAIL_FROM="Your Name <your_email@example.com>"  # 默认发送者信息
EMAIL_EXPIRES_IN=300                 # 邮件验证码有效时间（秒）
```

#### 常用邮件服务商配置

详细配置请参考下方的 [邮件服务配置](#邮件服务配置) 部分。

### 4. 短信服务配置（可选）

草梅 Auth 支持短信验证码功能，目前支持 Spug 短信服务。

#### 启用短信功能

```env
NUXT_PUBLIC_PHONE_ENABLED=true       # 启用短信功能
PHONE_SENDER_NAME="草梅Auth"          # 短信发送者名称
PHONE_EXPIRES_IN=300                 # 短信验证码有效时间（秒）
```

#### Spug 短信配置

```env
PHONE_CHANNEL=spug                   # 短信渠道
PHONE_SPUG_TEMPLATE_ID=your-template-id  # Spug短信模板ID
```

推荐的短信模板格式：

```
${key1}欢迎您，您的验证码为${key2}，${key3}分钟内有效，如非本人操作请忽略。
```

更多短信服务配置信息请访问 [Spug 官网](https://push.spug.cc)。

### 5. 数据库初始化

创建数据库并运行迁移：

```bash
# PostgreSQL
createdb caomei_auth

# MySQL
mysql -u root -p -e "CREATE DATABASE caomei_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行数据库迁移
pnpm build
```

## 部署方式

### 方式一：Node.js 部署

适用于 VPS、云服务器等环境。

#### 1. 构建项目

```bash
pnpm build
```

#### 2. 启动服务

```bash
# 生产环境启动
pnpm start

# 或使用 PM2 管理进程
npm install -g pm2
pm2 start ecosystem.config.js
```

#### 3. 配置反向代理

**Nginx 配置示例:**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 方式二：Docker 部署

适用于容器化环境。

#### 1. 使用 Docker Compose

创建 `docker-compose.yml`：

```yaml
version: "3.8"

services:
    app:
        build: .
        ports:
            - "3000:3000"
        environment:
            - NODE_ENV=production
            - DATABASE_URL=postgresql://caomei_auth:password@db:5432/caomei_auth
        depends_on:
            - db
            - redis
        restart: unless-stopped

    db:
        image: postgres:15
        environment:
            POSTGRES_DB: caomei_auth
            POSTGRES_USER: caomei_auth
            POSTGRES_PASSWORD: password
        volumes:
            - postgres_data:/var/lib/postgresql/data
        restart: unless-stopped

    redis:
        image: redis:7-alpine
        volumes:
            - redis_data:/data
        restart: unless-stopped

volumes:
    postgres_data:
    redis_data:
```

#### 2. 启动服务

```bash
docker-compose up -d
```

### 方式三：Vercel 部署

适用于无服务器环境，自动扩容。

#### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

#### 2. 配置 Vercel

创建 `vercel.json`：

```json
{
    "version": 2,
    "builds": [
        {
            "src": "nuxt.config.ts",
            "use": "@nuxtjs/vercel-builder"
        }
    ],
    "env": {
        "AUTH_SECRET": "@auth-secret",
        "DATABASE_URL": "@database-url",
        "EMAIL_HOST": "@email-host",
        "EMAIL_USER": "@email-user",
        "EMAIL_PASS": "@email-pass"
    }
}
```

#### 3. 部署

```bash
# 登录 Vercel
vercel login

# 部署项目
vercel --prod
```

#### 4. 配置环境变量

在 Vercel 控制台设置环境变量，或使用命令行：

```bash
vercel env add AUTH_SECRET
vercel env add DATABASE_URL
vercel env add EMAIL_HOST
vercel env add EMAIL_USER
vercel env add EMAIL_PASS
```

### 方式四：Cloudflare Workers 部署

目前尚不支持 Cloudflare Workers 部署。

#### 3. 构建和部署

```bash
# 构建项目
pnpm build

# 部署到 Cloudflare Workers
wrangler publish
```

## 数据库配置

更多环境变量请参考 `.env.example` 文件

### PostgreSQL 配置

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@localhost:5432/caomei_auth
DATABASE_SSL=false
DATABASE_ENTITY_PREFIX=caomei_auth_
```

### MySQL 配置

```env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://user:password@localhost:3306/caomei_auth
DATABASE_SSL=false
DATABASE_CHARSET=utf8_general_ci
DATABASE_TIMEZONE=local
DATABASE_ENTITY_PREFIX=caomei_auth_
```

### SQLite 配置

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=database/caomei-auth.sqlite
DATABASE_ENTITY_PREFIX=caomei_auth_
```

## 邮件服务配置

### Gmail 配置

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM="Your Name <your-email@gmail.com>"
EMAIL_EXPIRES_IN=300
```

### 腾讯企业邮箱

```env
EMAIL_HOST=smtp.exmail.qq.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@yourcompany.com
EMAIL_PASS=your-password
EMAIL_FROM="Your Name <your-email@yourcompany.com>"
EMAIL_EXPIRES_IN=300
```

### 阿里云邮件推送

```env
EMAIL_HOST=smtpdm.aliyun.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@your-domain.com
EMAIL_PASS=your-smtp-password
EMAIL_FROM="Your Name <your-email@your-domain.com>"
EMAIL_EXPIRES_IN=300
```

## 社交登录配置

> 💡 **详细配置指南**：更多社交登录配置请参考 [社交登录配置指南](/docs/social-login/)，包含各个平台的详细设置步骤。

### GitHub

1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 创建新的 OAuth App
3. 设置回调 URL：`https://your-domain.com/api/auth/callback/github`

```env
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Google

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建 OAuth 2.0 客户端 ID
3. 设置重定向 URI：`https://your-domain.com/api/auth/callback/google`

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 更多社交登录

项目还支持以下社交登录平台：

-   **Microsoft**: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`
-   **Discord**: `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`
-   **Apple**: `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, `APPLE_APP_BUNDLE_IDENTIFIER`
-   **Twitter**: `TWITTER_CLIENT_ID`, `TWITTER_CLIENT_SECRET`
-   **微博**: `WEIBO_CLIENT_ID`, `WEIBO_CLIENT_SECRET`, `WEIBO_SCOPES`
-   **微信**: `WECHAT_CLIENT_ID`, `WECHAT_CLIENT_SECRET`
-   **QQ**: `QQ_CLIENT_ID`, `QQ_CLIENT_SECRET`, `QQ_USE_UNIONID`
-   **抖音**: `DOUYIN_CLIENT_ID`, `DOUYIN_CLIENT_SECRET`

详细配置步骤请参考 [社交登录配置指南](/docs/social-login/)。

## 性能优化

### Redis 缓存配置

```env
REDIS_URL=redis://localhost:6379
```

## 监控和日志

### Sentry 错误监控

```env
NUXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### Microsoft Clarity 分析

```env
NUXT_PUBLIC_CLARITY_PROJECT_ID=your-clarity-project-id
```

### 健康检查

部署后可通过以下端点检查服务状态：

```bash
curl https://your-domain.com/api/health
```

## 限流配置

项目内置了多种限流配置，可通过以下环境变量调整：

### 邮箱验证码限流

```env
EMAIL_DAILY_LIMIT=100                    # 邮箱验证码每日发送上限（全局）
EMAIL_SINGLE_USER_DAILY_LIMIT=5         # 单个邮箱每日验证码发送上限
```

### 短信验证码限流

```env
PHONE_DAILY_LIMIT=100                    # 短信验证码每日发送上限（全局）
PHONE_SINGLE_USER_DAILY_LIMIT=3         # 单个手机号每日验证码发送上限
```

### 文件上传限流

```env
NUXT_PUBLIC_MAX_UPLOAD_SIZE="4.5MiB"     # 最大允许上传的文件大小
UPLOAD_DAILY_LIMIT=100                   # 文件上传每日限制
UPLOAD_SINGLE_USER_DAILY_LIMIT=5        # 单个用户每日上传文件限制
```

## 其他配置

### 备案信息

```env
NUXT_PUBLIC_ICP_BEIAN_NUMBER=ICP备xxxxxx号
NUXT_PUBLIC_PUBLIC_SECURITY_BEIAN_NUMBER=公网安备xxxxxx号
```

### 匿名登录

```env
ANONYMOUS_LOGIN_ENABLED=true
ANONYMOUS_EMAIL_DOMAIN_NAME='anonymous.com'
TEMP_EMAIL_DOMAIN_NAME='example.com'
```

## 故障排除

### 常见问题

1. **数据库连接失败**

    - 检查数据库服务是否启动
    - 验证连接参数是否正确
    - 确认网络连通性

2. **邮件发送失败**

    - 检查 SMTP 配置
    - 验证邮箱密码或应用密码
    - 确认邮箱服务商安全设置

3. **社交登录失败**
    - 检查客户端 ID 和密钥
    - 验证回调 URL 配置
    - 确认应用审核状态

### 日志查看

```bash
# 查看应用日志
tail -f ./logs/app.log

# Docker 日志
docker-compose logs -f app

# PM2 日志
pm2 logs
```

## 更新维护

### 更新应用

```bash
# 备份数据库
pg_dump caomei_auth > backup.sql

# 拉取最新代码
git pull origin master

# 安装依赖
pnpm install

# 构建应用
pnpm build

# 重启服务
pm2 restart caomei-auth
```

### 数据库迁移

```bash
# 运行数据库迁移
pnpm run migration:run
```

## 扩展配置

### 多实例部署

使用负载均衡器分发请求到多个实例：

```yaml
version: "3.8"

services:
    nginx:
        image: nginx:alpine
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ./nginx.conf:/etc/nginx/nginx.conf

    app1:
        build: .
        environment:
            - NODE_ENV=production

    app2:
        build: .
        environment:
            - NODE_ENV=production
```

通过这个部署指南，您可以根据自己的需求选择合适的部署方式。如有问题，请查看 [故障排除指南](./guides/troubleshooting.md)。
