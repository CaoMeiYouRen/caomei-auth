# Node.js 部署

适用于 VPS、云服务器等环境，提供完全的控制和自定义能力。

## 系统要求

-   **Node.js**: >= 18.0.0
-   **数据库**: PostgreSQL / MySQL / SQLite
-   **内存**: 至少 512MB RAM
-   **存储**: 至少 1GB 可用空间

## 部署步骤

### 1. 环境准备

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
```

### 3. 数据库初始化

项目支持 PostgreSQL、MySQL、SQLite 三种数据库。详细的数据库安装、配置和初始化指南请参考：

**👉 [数据库配置指南](./database)**

#### 快速开始

如果您已经准备好数据库，可以直接导入表结构：

```bash
# PostgreSQL
psql -d caomei_auth -f database/postgres/create.sql

# MySQL
mysql -u root -p caomei_auth < database/mysql/create.sql

# SQLite
sqlite3 database/caomei-auth.sqlite < database/sqlite/create.sql
```

> **注意**: 生产环境建议手动初始化数据库，开发环境可设置 `NODE_ENV=development` 启用自动同步表结构。

### 4. 构建项目

```bash
pnpm build
```

### 5. 启动服务

```bash
# 生产环境启动
pnpm start

# 或使用 PM2 管理进程
npm install -g pm2
pm2 start ecosystem.config.js
```

### 6. 配置反向代理

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

## 进程管理

### 使用 PM2

创建 `ecosystem.config.js`：

```javascript
module.exports = {
    apps: [
        {
            name: "caomei-auth",
            script: ".output/server/index.mjs",
            instances: "max",
            exec_mode: "cluster",
            env: {
                NODE_ENV: "production",
                PORT: 3000,
            },
        },
    ],
};
```

启动和管理：

```bash
# 启动应用
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart caomei-auth

# 停止应用
pm2 stop caomei-auth
```

## 健康检查

部署后可通过以下端点检查服务状态：

```bash
curl https://your-domain.com/api/health
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

## 故障排除

### 常见问题

1. **端口被占用**

    ```bash
    # 查看端口占用
    lsof -i :3000

    # 杀死进程
    kill -9 <PID>
    ```

2. **权限问题**

    ```bash
    # 设置正确的文件权限
    chmod +x .output/server/index.mjs
    ```

3. **内存不足**

    ```bash
    # 查看内存使用
    free -m

    # 增加交换空间
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    ```

### 日志查看

```bash
# 查看应用日志
tail -f ./logs/app.log

# PM2 日志
pm2 logs caomei-auth

# 系统日志
journalctl -u caomei-auth -f
```
