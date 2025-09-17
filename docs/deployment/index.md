# 部署指南

草梅 Auth 支持多种部署方式，您可以根据自己的需求选择合适的部署方式。

## 支持的部署方式

### [Node.js 部署](./nodejs)

适合传统的服务器环境，完全控制和自定义。

### [Docker 部署](./docker)

容器化部署，便于管理和扩展。

### [Vercel 部署](./vercel)

适合无服务器部署，自动扩展和全球 CDN。

### [Cloudflare Workers 部署](./cloudflare)

边缘计算部署，极低延迟和全球分布。

## 配置指南

### [数据库配置](./database)

详细的数据库安装、配置和优化指南，支持 PostgreSQL、MySQL、SQLite。

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

## 快速开始

1. **选择部署方式**：根据您的需求选择合适的部署方式
2. **配置数据库**：参考 [数据库配置指南](./database) 设置数据库
3. **设置环境变量**：配置必要的环境变量
4. **启动应用**：按照对应部署方式的说明启动应用

## 常见问题

### Q: 如何选择合适的部署方式？

-   **个人项目/小型团队**：推荐 Docker 部署，简单易用
-   **无服务器需求**：选择 Vercel 部署，自动扩展
-   **边缘计算需求**：选择 Cloudflare Workers，全球分布
-   **传统服务器**：选择 Node.js 部署，完全控制

### Q: 如何选择合适的数据库？

-   **开发/测试**：SQLite，零配置
-   **生产环境**：PostgreSQL（推荐）或 MySQL
-   详细对比请参考 [数据库配置指南](./database)

### Q: 需要哪些环境变量？

每种部署方式的环境变量要求略有不同，请参考对应的部署指南：

-   [Node.js 部署环境变量](./nodejs#环境变量配置)
-   [Docker 部署环境变量](./docker#自定义配置)
-   [Vercel 部署环境变量](./vercel#环境变量配置)
-   [Cloudflare Workers 环境变量](./cloudflare#环境变量配置)
