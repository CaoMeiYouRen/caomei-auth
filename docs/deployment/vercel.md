# Vercel 部署

Vercel 是一个无服务器部署平台，支持自动扩容和全球 CDN，适合快速部署和测试。

## 前提条件

-   GitHub/GitLab/Bitbucket 账号
-   Vercel 账号
-   外部数据库（推荐 Supabase、PlanetScale 或 Neon）

## 快速部署

### 1. 准备代码仓库

将项目推送到 GitHub：

```bash
git remote add origin https://github.com/yourusername/caomei-auth.git
git push -u origin master
```

### 2. 连接 Vercel

1. 访问 [Vercel Dashboard](https://vercel.com/dashboard)
2. 点击 "New Project"
3. 选择你的 GitHub 仓库
4. Vercel 会自动检测到 Nuxt.js 项目

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

```env
# 基础配置
NUXT_PUBLIC_AUTH_BASE_URL=https://your-app.vercel.app
NUXT_PUBLIC_CONTACT_EMAIL=contact@your-domain.com
NUXT_PUBLIC_APP_NAME=草梅Auth
AUTH_SECRET=your-super-secret-key-at-least-32-characters

# 数据库配置（使用外部数据库）
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@your-db-host:5432/caomei_auth
DATABASE_SSL=true

# 管理员配置
ADMIN_USER_IDS=1,2,3

# 邮件服务配置
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SECURE=false
EMAIL_FROM="Your Name <your-email@gmail.com>"
EMAIL_EXPIRES_IN=300
```

## 命令行部署

### 1. 安装 Vercel CLI

```bash
npm install -g vercel
```

### 2. 登录 Vercel

```bash
vercel login
```

### 3. 初始化项目

```bash
vercel
```

按照提示完成初始化。

### 4. 配置 vercel.json（可选）

创建 `vercel.json` 文件来配置函数超时等设置：

```json
{
    "functions": {
        "server/api/**.ts": {
            "maxDuration": 30
        }
    }
}
```

### 5. 配置环境变量

```bash
# 使用命令行添加环境变量
vercel env add AUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add EMAIL_HOST production
vercel env add EMAIL_USER production
vercel env add EMAIL_PASS production
```

### 6. 部署

```bash
# 部署到生产环境
vercel --prod
```

## 数据库配置

由于 Vercel 是无服务器环境，需要使用外部数据库服务。

详细的数据库配置指南请参考：**👉 [数据库配置指南](./database)**

### 推荐的数据库服务

#### 1. Supabase (PostgreSQL)

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
DATABASE_SSL=true
```

#### 2. PlanetScale (MySQL)

```env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://username:password@host:3306/database_name
DATABASE_SSL=true
```

#### 3. Neon (PostgreSQL)

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://user:password@ep-[xxx].us-east-1.aws.neon.tech/neondb
DATABASE_SSL=true
```

## 自定义域名

### 1. 在 Vercel 中添加域名

1. 进入项目设置
2. 点击 "Domains"
3. 添加你的自定义域名

### 2. 配置 DNS

根据 Vercel 提供的 DNS 记录配置你的域名：

```
Type: CNAME
Name: www (或 @)
Value: cname.vercel-dns.com
```

### 3. 更新环境变量

更新 `NUXT_PUBLIC_AUTH_BASE_URL` 为你的自定义域名：

```env
NUXT_PUBLIC_AUTH_BASE_URL=https://your-custom-domain.com
```

## 边缘函数配置

### 函数超时设置

在 `vercel.json` 中配置函数超时：

```json
{
    "functions": {
        "server/api/**.ts": {
            "maxDuration": 30
        },
        "server/api/auth/**.ts": {
            "maxDuration": 20
        }
    }
}
```

### 边缘运行时

对于某些 API 路由，可以使用边缘运行时：

```typescript
// server/api/health.ts
export default defineEventHandler(async (event) => {
    return { status: "ok", timestamp: new Date().toISOString() };
});

export const config = {
    runtime: "edge",
};
```

## 环境管理

### 多环境配置

Vercel 支持多个环境：

```bash
# 预览环境
vercel

# 生产环境
vercel --prod

# 查看部署
vercel ls
```

### 环境变量管理

```bash
# 添加环境变量到所有环境
vercel env add VARIABLE_NAME

# 添加到特定环境
vercel env add VARIABLE_NAME production
vercel env add VARIABLE_NAME preview
vercel env add VARIABLE_NAME development

# 查看环境变量
vercel env ls

# 删除环境变量
vercel env rm VARIABLE_NAME
```

## 性能优化

### 构建优化

在 `nuxt.config.ts` 中配置：

```typescript
export default defineNuxtConfig({
    nitro: {
        // 使用标准预设
        preset: "vercel",
    },

    // 预渲染优化
    nitro: {
        prerender: {
            routes: ["/login", "/register", "/privacy", "/terms"],
        },
    },
});
```

## 函数日志

查看函数日志：

```bash
# 查看实时日志
vercel logs your-project-name

# 查看特定函数日志
vercel logs your-project-name --follow
```

## CI/CD 集成

### GitHub Actions

创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Vercel

on:
    push:
        branches: [master]
    pull_request:
        branches: [master]

jobs:
    deploy:
        runs-on: ubuntu-latest
        steps:
            - uses: actions/checkout@v4

            - name: Setup Node.js
              uses: actions/setup-node@v4
              with:
                  node-version: "18"

            - name: Install dependencies
              run: npm install -g pnpm && pnpm install

            - name: Build project
              run: pnpm build

            - name: Deploy to Vercel
              uses: amondnet/vercel-action@v25
              with:
                  vercel-token: ${{ secrets.VERCEL_TOKEN }}
                  vercel-org-id: ${{ secrets.ORG_ID }}
                  vercel-project-id: ${{ secrets.PROJECT_ID }}
                  vercel-args: "--prod"
```

## 限制和注意事项

### 1. 函数限制

-   执行时间限制：Hobby 计划 10 秒，Pro 计划 60 秒
-   内存限制：最大 1008MB
-   有效负载限制：请求体最大 4.5MB

### 2. 文件上传

由于无服务器特性，文件上传需要使用外部存储服务，项目已支持 S3 兼容存储和 Vercel Blob。请参考项目的文件上传配置。

### 3. 数据库连接

使用连接池避免连接数过多：

```typescript
// server/utils/db.ts
import { DataSource } from "typeorm";

let dataSource: DataSource | null = null;

export async function getDataSource() {
    if (!dataSource) {
        dataSource = new DataSource({
            // ... 数据库配置
            extra: {
                max: 1, // 最大连接数
                min: 0, // 最小连接数
                idleTimeoutMillis: 120000,
            },
        });
        await dataSource.initialize();
    }
    return dataSource;
}
```

## 故障排除

### 常见问题

1. **构建失败**

    ```bash
    # 本地测试构建
    pnpm build

    # 检查 Node.js 版本
    node --version
    ```

2. **函数超时**

    - 增加函数超时时间
    - 优化数据库查询
    - 使用缓存减少计算

3. **环境变量未生效**

    ```bash
    # 检查环境变量
    vercel env ls

    # 重新部署
    vercel --prod
    ```

4. **数据库连接失败**
    - 检查数据库服务状态
    - 验证连接字符串格式
    - 确认 SSL 配置

### 调试技巧

```typescript
// 添加调试日志
console.log("Environment:", process.env.NODE_ENV);
console.log(
    "Database URL:",
    process.env.DATABASE_URL?.substring(0, 20) + "..."
);

// 使用 Vercel 日志
export default defineEventHandler(async (event) => {
    console.log("API called:", event.node.req.url);
    // ... 处理逻辑
});
```
