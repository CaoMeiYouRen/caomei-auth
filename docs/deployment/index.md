# 部署指南

草梅 Auth 支持多种部署方式，您可以根据自己的需求选择合适的部署方式。

## 支持的部署方式

### Node.js 部署

适合传统的服务器环境，完全控制和自定义。

### Docker 部署

容器化部署，便于管理和扩展。

### Vercel 部署

适合无服务器部署，自动扩展和全球 CDN。

### Cloudflare Workers 部署

边缘计算部署，极低延迟和全球分布。

## 第三方集成

草梅 Auth 支持多种第三方服务集成，用于分析、监控和其他功能增强。

### [集成概览](./integrations/)

了解支持的第三方服务集成。

### 分析和监控服务

-   **[Microsoft Clarity](./integrations/clarity)** - 行为分析和会话回放工具
-   **[Sentry](./integrations/sentry)** - 错误监控和性能跟踪工具
-   **[百度统计](./integrations/baidu-analytics)** - 网站流量分析和用户行为统计工具
-   **[Google Analytics](./integrations/google-analytics)** - Google Analytics 4 网站分析和用户行为跟踪工具

## 环境要求

-   Node.js >= 18
-   支持的数据库：PostgreSQL、MySQL、SQLite
-   包管理器：PNPM（推荐）

## 数据库配置

### 支持的数据库类型

草梅 Auth 支持三种数据库类型，您可以根据需要选择：

-   **SQLite**：适合开发环境和小型部署，无需额外安装数据库服务
-   **PostgreSQL**：推荐用于生产环境，功能强大，性能优秀
-   **MySQL**：广泛使用的关系型数据库，兼容性好

### 数据库初始化

#### 1. 环境变量配置

在 `.env` 文件中配置数据库连接信息：

```env
# 数据库类型
DATABASE_TYPE=sqlite  # 可选: sqlite, mysql, postgres

# SQLite 配置（仅 SQLite 使用）
DATABASE_PATH=database/caomei-auth.sqlite

# MySQL/PostgreSQL 配置
# DATABASE_URL=mysql://user:password@localhost:3306/caomei_auth
# DATABASE_URL=postgresql://user:password@localhost:5432/caomei_auth

# 其他数据库选项
DATABASE_SSL=false
DATABASE_CHARSET=utf8_general_ci  # 仅 MySQL 使用
DATABASE_TIMEZONE=local           # 仅 MySQL 使用
DATABASE_ENTITY_PREFIX=caomei_auth_
```

#### 2. 创建数据库

**PostgreSQL:**

```bash
# 使用 psql 命令行
createdb caomei_auth

# 或登录 PostgreSQL 后执行
CREATE DATABASE caomei_auth;
```

**MySQL:**

```bash
# 使用 mysql 命令行
mysql -u root -p -e "CREATE DATABASE caomei_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 或登录 MySQL 后执行
CREATE DATABASE caomei_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**SQLite:**
SQLite 数据库文件会在首次运行时自动创建，无需手动创建。

#### 3. 导入数据库表结构

项目提供了三种数据库的建表脚本：

```bash
# PostgreSQL
psql -d caomei_auth -f database/postgres/create.sql

# MySQL
mysql -u root -p caomei_auth < database/mysql/create.sql

# SQLite
sqlite3 database/caomei-auth.sqlite < database/sqlite/create.sql
```

#### 4. 验证数据库连接

启动应用后，系统会自动检查数据库连接。如果配置正确，您应该能看到类似以下的日志：

```
✓ 数据库连接成功
✓ 数据库表初始化完成
```

### 数据库安全建议

1. **使用强密码**：确保数据库用户使用强密码
2. **限制访问**：仅允许应用服务器访问数据库
3. **启用 SSL**：生产环境建议启用数据库 SSL 连接
4. **定期备份**：建立定期数据库备份机制
5. **监控性能**：监控数据库性能和连接数

## 常见问题

### Q: 如何选择合适的数据库类型？

-   **开发/测试环境**：推荐使用 SQLite，配置简单，无需额外服务
-   **生产环境（中小型）**：推荐使用 PostgreSQL，功能强大，性能优秀
-   **生产环境（大型）**：可选择 PostgreSQL 或 MySQL，根据团队熟悉度决定

### Q: 数据库连接失败怎么办？

1. 检查数据库服务是否正常运行
2. 验证连接字符串格式是否正确
3. 确认网络连接和防火墙设置
4. 检查数据库用户权限

### Q: 如何迁移现有数据？

1. 导出现有数据：`pg_dump` (PostgreSQL) 或 `mysqldump` (MySQL)
2. 在新环境创建数据库和表结构
3. 导入数据：`psql` (PostgreSQL) 或 `mysql` (MySQL)
4. 验证数据完整性

### Q: 支持哪些数据库版本？

-   **PostgreSQL**: 12.0 及以上版本
-   **MySQL**: 8.0 及以上版本
-   **SQLite**: 3.x 版本

## 下一步

选择您需要的部署方式，查看对应的详细配置指南：

-   [数据库配置详细指南](./database) - 详细的数据库安装、配置和优化指南
-   [Node.js 部署](./nodejs)
-   [Docker 部署](./docker)
-   [Vercel 部署](./vercel)
-   [Cloudflare Workers 部署](./cloudflare)
