# Docker 部署

使用 Docker 容器化部署，便于管理和扩展。

## 系统要求

-   Docker >= 20.10
-   Docker Compose >= 2.0
-   至少 1GB RAM
-   至少 2GB 可用存储空间

## 快速开始

### 使用 Docker Compose

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
            - AUTH_SECRET=your-super-secret-key-at-least-32-characters
            - EMAIL_HOST=smtp.gmail.com
            - EMAIL_PORT=587
            - EMAIL_USER=your-email@gmail.com
            - EMAIL_PASS=your-app-password
            - EMAIL_FROM="Your Name <your-email@gmail.com>"
        depends_on:
            - db
            - redis
        restart: unless-stopped
        volumes:
            - ./uploads:/app/uploads

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
        command: redis-server --appendonly yes
        volumes:
            - redis_data:/data
        restart: unless-stopped

volumes:
    postgres_data:
    redis_data:
```

### 数据库初始化

在启动服务前，您可能需要初始化数据库表结构。

如果需要手动初始化数据库，可以先启动数据库服务，然后导入表结构：

```bash
# 仅启动数据库服务
docker-compose up -d db

# 等待数据库启动完成
sleep 10

# 导入数据库表结构
docker-compose exec db psql -U caomei_auth -d caomei_auth -f /docker-entrypoint-initdb.d/create.sql
```

或者，您可以在 `docker-compose.yml` 中添加初始化脚本：

```yaml
db:
    image: postgres:15
    environment:
        POSTGRES_DB: caomei_auth
        POSTGRES_USER: caomei_auth
        POSTGRES_PASSWORD: password
    volumes:
        - postgres_data:/var/lib/postgresql/data
        - ./database/postgres/create.sql:/docker-entrypoint-initdb.d/create.sql:ro
    restart: unless-stopped
```

### 启动服务

```bash
# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f app

# 检查数据库连接
docker-compose logs db | grep "database system is ready to accept connections"
```

## 自定义配置

### 环境变量文件

创建 `.env` 文件：

```env
# 基础配置
NUXT_PUBLIC_AUTH_BASE_URL=https://your-domain.com
NUXT_PUBLIC_CONTACT_EMAIL=contact@your-domain.com
NUXT_PUBLIC_APP_NAME=草梅Auth
AUTH_SECRET=your-super-secret-key-at-least-32-characters

# 数据库配置
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://caomei_auth:password@db:5432/caomei_auth
DATABASE_SSL=false

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

# Redis 缓存
REDIS_URL=redis://redis:6379
```

更新 `docker-compose.yml` 使用环境变量文件：

```yaml
version: "3.8"

services:
    app:
        build: .
        ports:
            - "3000:3000"
        env_file:
            - .env
        depends_on:
            - db
            - redis
        restart: unless-stopped
        volumes:
            - ./uploads:/app/uploads

    # ... 其他服务配置保持不变
```

## 生产环境配置

### 使用 Nginx 反向代理

创建 `nginx.conf`：

```nginx
upstream caomei_auth {
    server app:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://caomei_auth;
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

完整的生产环境 `docker-compose.yml`：

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
            - certbot-etc:/etc/letsencrypt
            - certbot-var:/var/lib/letsencrypt
            - web-root:/var/www/certbot
        depends_on:
            - app
        restart: unless-stopped

    certbot:
        image: certbot/certbot
        volumes:
            - certbot-etc:/etc/letsencrypt
            - certbot-var:/var/lib/letsencrypt
            - web-root:/var/www/certbot
        command: certonly --webroot --webroot-path=/var/www/certbot --email your-email@domain.com --agree-tos --no-eff-email -d your-domain.com

    app:
        build: .
        env_file:
            - .env
        depends_on:
            - db
            - redis
        restart: unless-stopped
        volumes:
            - ./uploads:/app/uploads

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
        command: redis-server --appendonly yes
        volumes:
            - redis_data:/data
        restart: unless-stopped

volumes:
    postgres_data:
    redis_data:
    certbot-etc:
    certbot-var:
    web-root:
```

## 数据备份

### 数据库备份

```bash
# 创建备份
docker-compose exec db pg_dump -U caomei_auth caomei_auth > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker-compose exec -T db psql -U caomei_auth caomei_auth < backup_file.sql
```

### 完整备份脚本

创建 `backup.sh`：

```bash
#!/bin/bash

BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份数据库
docker-compose exec -T db pg_dump -U caomei_auth caomei_auth > "$BACKUP_DIR/db_$DATE.sql"

# 备份上传文件
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" ./uploads

# 清理旧备份（保留最近7天）
find $BACKUP_DIR -name "*.sql" -type f -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -type f -mtime +7 -delete

echo "备份完成: $DATE"
```

## 监控和日志

### 健康检查

在 `docker-compose.yml` 中添加健康检查：

```yaml
services:
    app:
        # ... 其他配置
        healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
            interval: 30s
            timeout: 10s
            retries: 3
            start_period: 40s
```

### 日志管理

```bash
# 查看所有服务日志
docker-compose logs

# 查看特定服务日志
docker-compose logs app

# 实时跟踪日志
docker-compose logs -f app

# 限制日志输出行数
docker-compose logs --tail=100 app
```

配置日志轮转：

```yaml
services:
    app:
        # ... 其他配置
        logging:
            driver: "json-file"
            options:
                max-size: "10m"
                max-file: "3"
```

## 扩展和更新

### 水平扩展

```bash
# 扩展应用实例
docker-compose up -d --scale app=3
```

### 更新应用

```bash
# 拉取最新代码
git pull origin master

# 重新构建镜像
docker-compose build app

# 重启服务
docker-compose up -d app
```

### 零停机更新

使用 Blue-Green 部署：

```yaml
version: "3.8"

services:
    app-blue:
        build: .
        env_file: .env
        depends_on: [db, redis]

    app-green:
        build: .
        env_file: .env
        depends_on: [db, redis]

    nginx:
        image: nginx:alpine
        ports:
            - "80:80"
            - "443:443"
        volumes:
            - ./nginx-blue.conf:/etc/nginx/nginx.conf
```

## 故障排除

### 常见问题

1. **容器启动失败**

    ```bash
    # 查看容器状态
    docker-compose ps

    # 查看详细日志
    docker-compose logs app
    ```

2. **数据库连接失败**

    ```bash
    # 检查数据库容器状态
    docker-compose exec db pg_isready -U caomei_auth

    # 检查网络连接
    docker-compose exec app nc -zv db 5432
    ```

3. **端口冲突**

    ```bash
    # 查看端口占用
    netstat -tulpn | grep :3000

    # 修改端口映射
    # 在 docker-compose.yml 中更改端口
    ```

### 性能调优

```yaml
services:
    app:
        # ... 其他配置
        deploy:
            resources:
                limits:
                    cpus: "2"
                    memory: 1G
                reservations:
                    cpus: "1"
                    memory: 512M
```
