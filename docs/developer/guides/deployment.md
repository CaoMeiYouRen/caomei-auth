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
NODE_ENV=production
APP_NAME=草梅 Auth
AUTH_BASE_URL=https://your-domain.com
AUTH_SECRET=your-super-secret-key-at-least-32-characters

# 数据库配置
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=caomei_auth
DATABASE_PASSWORD=your-db-password
DATABASE_NAME=caomei_auth
DATABASE_SSL=true

# 邮件服务配置
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# 管理员配置
ADMIN_USER_IDS=admin-user-id-1,admin-user-id-2
```

### 3. 数据库初始化

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
        "SMTP_HOST": "@smtp-host",
        "SMTP_USER": "@smtp-user",
        "SMTP_PASS": "@smtp-pass"
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
vercel env add SMTP_HOST
vercel env add SMTP_USER
vercel env add SMTP_PASS
```

### 方式四：Cloudflare Workers 部署

适用于边缘计算环境。

#### 1. 安装 Wrangler

```bash
npm install -g wrangler
```

#### 2. 配置 wrangler.toml

```toml
name = "caomei-auth"
main = ".output/server/index.mjs"
compatibility_date = "2024-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
NODE_ENV = "production"

[[kv_namespaces]]
binding = "CACHE"
id = "your-kv-namespace-id"

[[d1_databases]]
binding = "DB"
database_name = "caomei-auth"
database_id = "your-d1-database-id"
```

#### 3. 构建和部署

```bash
# 构建项目
pnpm build

# 部署到 Cloudflare Workers
wrangler publish
```

## 数据库配置

### PostgreSQL 配置

```env
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=caomei_auth
DATABASE_PASSWORD=your-password
DATABASE_NAME=caomei_auth
DATABASE_SSL=true
```

### MySQL 配置

```env
DATABASE_TYPE=mysql
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USERNAME=caomei_auth
DATABASE_PASSWORD=your-password
DATABASE_NAME=caomei_auth
```

### SQLite 配置

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=./database/caomei-auth.sqlite
```

## 邮件服务配置

### Gmail 配置

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 腾讯企业邮箱

```env
SMTP_HOST=smtp.exmail.qq.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@yourcompany.com
SMTP_PASS=your-password
```

### 阿里云邮件推送

```env
SMTP_HOST=smtpdm.aliyun.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@your-domain.com
SMTP_PASS=your-smtp-password
```

## 社交登录配置

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

### 微信

1. 访问 [微信开放平台](https://open.weixin.qq.com/)
2. 创建网站应用
3. 配置回调域名

```env
WECHAT_CLIENT_ID=your-wechat-app-id
WECHAT_CLIENT_SECRET=your-wechat-app-secret
```

## 性能优化

### Redis 缓存配置

```env
REDIS_URL=redis://localhost:6379
```

### 数据库连接池

```env
DATABASE_MAX_CONNECTIONS=10
DATABASE_CONNECTION_TIMEOUT=30000
```

### CDN 配置

建议使用 CDN 加速静态资源：

```env
CDN_URL=https://your-cdn-domain.com
```

## 监控和日志

### 日志配置

```env
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Sentry 错误监控

```env
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### 健康检查

部署后可通过以下端点检查服务状态：

```bash
curl https://your-domain.com/api/health
```

## 安全配置

### HTTPS 配置

确保在生产环境使用 HTTPS：

```env
HTTPS_ONLY=true
SECURE_COOKIES=true
```

### CORS 配置

```env
CORS_ORIGIN=https://your-frontend-domain.com
```

### 限流配置

```env
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000
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

### 数据库读写分离

```env
DATABASE_MASTER_URL=postgresql://user:pass@master:5432/db
DATABASE_SLAVE_URL=postgresql://user:pass@slave:5432/db
```

通过这个部署指南，您可以根据自己的需求选择合适的部署方式。如有问题，请查看 [故障排除指南](./guides/troubleshooting.md)。
