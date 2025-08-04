# 数据库配置指南

本指南详细介绍如何为草梅 Auth 配置和初始化数据库。

## 支持的数据库

草梅 Auth 支持以下三种数据库类型：

| 数据库     | 适用场景             | 优势                          | 注意事项                       |
| ---------- | -------------------- | ----------------------------- | ------------------------------ |
| SQLite     | 开发、测试、小型部署 | 零配置、轻量级、文件存储      | 不支持并发写入、不适合大型应用 |
| PostgreSQL | 生产环境（推荐）     | 功能强大、性能优秀、ACID 兼容 | 需要单独安装和维护             |
| MySQL      | 生产环境             | 广泛使用、兼容性好、生态丰富  | 需要注意字符集配置             |

## 环境变量配置

### 基础配置

```env
# 数据库类型
DATABASE_TYPE=sqlite  # 可选: sqlite, mysql, postgres

# 数据库表前缀
DATABASE_ENTITY_PREFIX=caomei_auth_

# 是否启用SSL连接
DATABASE_SSL=false
```

### SQLite 配置

```env
DATABASE_TYPE=sqlite
DATABASE_PATH=database/caomei-auth.sqlite
```

### PostgreSQL 配置

```env
DATABASE_TYPE=postgres
DATABASE_URL=postgresql://username:password@localhost:5432/caomei_auth
DATABASE_SSL=true
```

### MySQL 配置

```env
DATABASE_TYPE=mysql
DATABASE_URL=mysql://username:password@localhost:3306/caomei_auth
DATABASE_SSL=false
DATABASE_CHARSET=utf8mb4
DATABASE_TIMEZONE=local
```

## 数据库安装和配置

### PostgreSQL

#### 安装 PostgreSQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**CentOS/RHEL:**

```bash
sudo yum install postgresql-server postgresql-contrib
sudo postgresql-setup initdb
```

**macOS:**

```bash
brew install postgresql
brew services start postgresql
```

**Windows:**
下载并安装 [PostgreSQL 官方安装包](https://www.postgresql.org/download/windows/)

#### 创建数据库和用户

```bash
# 切换到 postgres 用户
sudo -u postgres psql

# 创建数据库用户
CREATE USER caomei_auth WITH PASSWORD 'your_secure_password';

# 创建数据库
CREATE DATABASE caomei_auth OWNER caomei_auth;

# 授予权限
GRANT ALL PRIVILEGES ON DATABASE caomei_auth TO caomei_auth;

# 退出
\q
```

### MySQL

#### 安装 MySQL

**Ubuntu/Debian:**

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

**CentOS/RHEL:**

```bash
sudo yum install mysql-server
sudo systemctl start mysqld
sudo mysql_secure_installation
```

**macOS:**

```bash
brew install mysql
brew services start mysql
```

**Windows:**
下载并安装 [MySQL 官方安装包](https://dev.mysql.com/downloads/installer/)

#### 创建数据库和用户

```bash
# 登录 MySQL
mysql -u root -p

# 创建数据库
CREATE DATABASE caomei_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 创建用户
CREATE USER 'caomei_auth'@'localhost' IDENTIFIED BY 'your_secure_password';

# 授予权限
GRANT ALL PRIVILEGES ON caomei_auth.* TO 'caomei_auth'@'localhost';

# 刷新权限
FLUSH PRIVILEGES;

# 退出
exit;
```

## 数据库初始化

### 自动初始化（仅开发环境）

在开发环境，草梅 Auth 在首次启动时会自动检查并创建所需的数据库表结构。这是最简单的方式，适合大多数场景。

### 手动初始化（生产环境推荐）

如果需要手动初始化，可以使用项目提供的 SQL 脚本：

#### PostgreSQL

```bash
# 导入表结构
psql -U caomei_auth -d caomei_auth -f database/postgres/create.sql

# 验证表创建
psql -U caomei_auth -d caomei_auth -c "\dt"
```

#### MySQL

```bash
# 导入表结构
mysql -u caomei_auth -p caomei_auth < database/mysql/create.sql

# 验证表创建
mysql -u caomei_auth -p caomei_auth -e "SHOW TABLES;"
```

#### SQLite

```bash
# 导入表结构
sqlite3 database/caomei-auth.sqlite < database/sqlite/create.sql

# 验证表创建
sqlite3 database/caomei-auth.sqlite ".tables"
```

## 数据库表结构

草梅 Auth 创建以下数据库表：

| 表名                             | 描述                      |
| -------------------------------- | ------------------------- |
| `caomei_auth_user`               | 用户基本信息              |
| `caomei_auth_account`            | 用户账号信息（本地/社交） |
| `caomei_auth_session`            | 用户会话信息              |
| `caomei_auth_verification`       | 验证码信息                |
| `caomei_auth_two_factor`         | 双因子认证信息            |
| `caomei_auth_oauth_application`  | OAuth 应用信息            |
| `caomei_auth_oauth_access_token` | OAuth 访问令牌            |
| `caomei_auth_oauth_consent`      | OAuth 授权同意            |
| `caomei_auth_sso_provider`       | SSO 提供者配置            |

## 连接测试

### 使用 CLI 工具测试

**PostgreSQL:**

```bash
psql -U caomei_auth -d caomei_auth -c "SELECT version();"
```

**MySQL:**

```bash
mysql -u caomei_auth -p caomei_auth -e "SELECT VERSION();"
```

**SQLite:**

```bash
sqlite3 database/caomei-auth.sqlite "SELECT sqlite_version();"
```

### 使用应用测试

启动草梅 Auth 应用，查看日志输出：

```bash
pnpm dev
```

正常情况下应该看到类似以下的日志：

```
✓ 数据库连接成功
✓ 数据库表初始化完成
✓ 应用启动完成: http://localhost:3000
```

## 性能优化

### 索引优化

项目的 SQL 脚本已包含必要的索引。如需额外优化，可参考以下建议：

```sql
-- PostgreSQL 示例
CREATE INDEX CONCURRENTLY idx_user_email_lookup ON caomei_auth_user(email) WHERE email_verified = true;
CREATE INDEX CONCURRENTLY idx_session_active ON caomei_auth_session(user_id, expires_at) WHERE expires_at > NOW();

-- MySQL 示例
CREATE INDEX idx_user_email_lookup ON caomei_auth_user(email, email_verified);
CREATE INDEX idx_session_active ON caomei_auth_session(user_id, expires_at);
```

### 连接池配置

对于生产环境，建议配置适当的连接池：

```env
# PostgreSQL 连接池示例
DATABASE_URL=postgresql://user:pass@localhost:5432/db?pool_min=5&pool_max=20&pool_timeout=30

# MySQL 连接池示例
DATABASE_URL=mysql://user:pass@localhost:3306/db?pool_min=5&pool_max=20&pool_timeout=30000
```

## 备份策略

### PostgreSQL 备份

```bash
# 完整备份
pg_dump -U caomei_auth -d caomei_auth -f backup_$(date +%Y%m%d_%H%M%S).sql

# 仅数据备份
pg_dump -U caomei_auth -d caomei_auth --data-only -f data_backup_$(date +%Y%m%d_%H%M%S).sql

# 自动化备份脚本
cat > backup_postgres.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/caomei-auth"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U caomei_auth -d caomei_auth -f $BACKUP_DIR/backup_$TIMESTAMP.sql
# 保留最近7天的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF
chmod +x backup_postgres.sh
```

### MySQL 备份

```bash
# 完整备份
mysqldump -u caomei_auth -p caomei_auth > backup_$(date +%Y%m%d_%H%M%S).sql

# 仅数据备份
mysqldump -u caomei_auth -p --no-create-info caomei_auth > data_backup_$(date +%Y%m%d_%H%M%S).sql

# 自动化备份脚本
cat > backup_mysql.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/var/backups/caomei-auth"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
mysqldump -u caomei_auth -p caomei_auth > $BACKUP_DIR/backup_$TIMESTAMP.sql
# 保留最近7天的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF
chmod +x backup_mysql.sh
```

### SQLite 备份

```bash
# SQLite 备份（简单复制）
cp database/caomei-auth.sqlite database/backup_$(date +%Y%m%d_%H%M%S).sqlite

# 使用 SQLite 命令备份
sqlite3 database/caomei-auth.sqlite ".backup database/backup_$(date +%Y%m%d_%H%M%S).sqlite"
```

## 故障排除

### 常见错误及解决方案

#### 1. 连接被拒绝

**错误信息**: `connection refused` 或 `could not connect`

**解决方案**:

-   检查数据库服务是否运行
-   验证连接信息（主机、端口、用户名、密码）
-   检查防火墙设置

#### 2. 认证失败

**错误信息**: `authentication failed` 或 `access denied`

**解决方案**:

-   验证用户名和密码
-   检查用户权限
-   确认主机访问权限

#### 3. 数据库不存在

**错误信息**: `database does not exist`

**解决方案**:

-   手动创建数据库
-   检查数据库名称是否正确

#### 4. 表不存在

**错误信息**: `table does not exist`

**解决方案**:

-   运行数据库初始化脚本
-   检查表前缀配置

#### 5. 字符集问题（MySQL）

**错误信息**: `Incorrect string value` 或乱码

**解决方案**:

```sql
-- 修改数据库字符集
ALTER DATABASE caomei_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 修改表字符集
ALTER TABLE caomei_auth_user CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 日志分析

开启详细的数据库日志可以帮助诊断问题：

**PostgreSQL:**

```bash
# 编辑 postgresql.conf
log_statement = 'all'
log_min_error_statement = error
```

**MySQL:**

```bash
# 编辑 my.cnf
general_log = 1
general_log_file = /var/log/mysql/general.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
```

## 迁移指南

### 从 SQLite 迁移到 PostgreSQL

1. **导出数据**:

    ```bash
    sqlite3 database/caomei-auth.sqlite .dump > sqlite_dump.sql
    ```

2. **转换格式**:

    ```bash
    # 使用工具转换或手动调整 SQL 语法
    # 主要差异：数据类型、自增字段、布尔值等
    ```

3. **导入 PostgreSQL**:
    ```bash
    psql -U caomei_auth -d caomei_auth -f converted_dump.sql
    ```

### 从 MySQL 迁移到 PostgreSQL

1. **导出数据**:

    ```bash
    mysqldump -u caomei_auth -p --compatible=postgresql caomei_auth > mysql_dump.sql
    ```

2. **调整语法**:

    ```bash
    # 调整数据类型、引号、序列等
    sed -i 's/`//g' mysql_dump.sql
    # 其他必要的语法调整...
    ```

3. **导入 PostgreSQL**:
    ```bash
    psql -U caomei_auth -d caomei_auth -f mysql_dump.sql
    ```

## 最佳实践

1. **定期备份**: 建立自动化备份机制
2. **监控性能**: 使用数据库监控工具
3. **安全配置**: 使用强密码、限制访问、启用 SSL
4. **版本控制**: 跟踪数据库 schema 变更
5. **测试环境**: 在测试环境验证变更后再应用到生产环境

## 相关链接

-   [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
-   [MySQL 官方文档](https://dev.mysql.com/doc/)
-   [SQLite 官方文档](https://www.sqlite.org/docs.html)
-   [TypeORM 文档](https://typeorm.io/)
