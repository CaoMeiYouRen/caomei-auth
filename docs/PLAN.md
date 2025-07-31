# 草梅 Auth 统一登录平台

## 项目简介

草梅 Auth 是一个基于 Nuxt 全栈框架的统一登录平台。
平台支持 OAuth2.0 协议，集成邮箱、用户名、手机号、验证码、社交媒体等多种登录注册方式。
支持 Node.js、Docker、Vercel、Cloudflare Workers 等多种主流部署。

## 功能特性

-   支持 OAuth2.0 协议，便于与各类应用集成
-   登录/注册方式：
    -   邮箱 + 密码
    -   用户名 + 密码
    -   手机号 + 密码
    -   邮箱验证码
    -   短信验证码
    -   第三方社交媒体（GitHub、Google、Microsoft、Discord、Apple、Twitter、微博、QQ 等）
-   用户权限管理基于 better-auth
-   邮件服务基于 nodemailer
-   前端采用 Nuxt（Vue 3.x）全栈框架，响应式设计，用户体验友好
-   UI 采用 @mdi/font 图标库，样式使用 SCSS
-   后端支持多种部署方式：Node.js、Docker、Vercel、Cloudflare Workers
-   安全性设计：支持多因子认证、验证码、登录日志等

## 技术栈

-   全栈框架：
    -   Nuxt 3.x（Vue 3.x + SSR + API 路由）
-   权限与认证：
    -   better-auth
    -   OAuth2.0 Server 实现
-   邮件与短信：
    -   nodemailer（邮件服务）
    -   第三方短信服务（如阿里云、腾讯云等）
-   样式与图标：
    -   SCSS，主题色主打红色（#e63946）及其变体，风格现代明快
    -   @mdi/font（Material Design Icons）
-   数据库：
    -   PostgreSQL/MySQL/SQLite（可选）
-   包管理器：
    -   pnpm
-   部署：
    -   Node.js
    -   Docker
    -   Vercel
    -   Cloudflare Workers

## 目录结构

-   `components/`: Vue 组件目录。
-   `pages/`: Nuxt 页面目录。
-   `styles/`: 样式文件目录。
-   `public/`: 公共静态资源目录（如图片、字体等）。
-   `plugins/`: Nuxt 插件目录。
-   `store/`: 状态管理目录。
-   `utils/`: 工具函数目录。
-   `server`: 服务器端代码目录（如 API 路由等）。
    -   `server/api/`: API 路由目录。
    -   `server/middleware/`: 服务器中间件目录。
    -   `server/config/`: 服务器配置目录。
    -   `server/utils/`: 服务器端工具函数目录。
    -   `server/database/`: 数据库相关代码目录。
-   `middleware/`: 中间件目录。
-   `tests/`: 测试代码目录。
-   `config/`: 配置文件目录。

## 页面设计

-   [x] 登录页 `/login`：支持邮箱、用户名、手机号、验证码、社交媒体等多种登录方式，支持多因子认证入口。
-   [x] 注册页 `/register`：支持邮箱、手机号、用户名注册，含验证码校验。
-   [x] 忘记密码页 `/forgot-password`：支持邮箱/手机号找回密码，含验证码校验。
-   [x] 个人中心页 `/profile`：展示用户信息，支持修改资料、修改密码、多因子认证设置、查看登录日志等。
-   [x] 账号安全设置页 `/security`：多因子认证（MFA）设置、登录日志查看、设备管理。
-   [x] 授权管理页 `/oauth/consent`、`/oauth/clients`：OAuth2.0 授权同意页、已授权应用管理。
-   管理后台 `/admin` 及子页面：

    -   [x] 应用管理 `/admin/oauth/clients`：管理 OAuth2.0 应用
    -   [x] 用户管理 `/admin/users`：用户列表、详情、编辑、禁用/启用等操作。
    -   ~~权限管理 `/admin/roles`：角色、权限分配与管理。~~
    -   [x] 登录统计 `/admin/logs`：登录日志、活跃用户、异常登录等统计报表。

-   [x] 文档/开发者中心页 `/docs`：基于 Markdown 文件自动生成的 API 文档说明
-   `/docs` 或 `/docs/index`：文档首页，概览和快速导航
-   `/docs/getting-started`：快速开始指南
-   `/docs/api/*`：API 文档（认证、用户、OAuth 等）
-   `/docs/guides/*`：集成指南、最佳实践、故障排除等
-   [x] 统一错误页（如 404、403、500 等）
-   其他辅助页面：
    -   [x] 隐私政策页 `/privacy`：展示平台隐私政策，说明用户数据收集、使用、存储和共享的方式，以及用户的权利和平台的责任。
    -   [x] 服务条款页 `/terms`：列出平台的使用规则和条件，包括用户的行为规范、知识产权声明、免责声明等。
-   [x] 响应式适配：所有页面需适配桌面端与移动端，保证良好体验。
-   无障碍适配：页面和组件需支持无障碍访问（如键盘导航、ARIA 标签等）。

## 样式与主题色规范

-   主题色主打红色，强调安全与活力，具体色值如下：

    -   主色（Primary）：#e63946
    -   主色浅（Primary Light）：#ff6b6b
    -   主色深（Primary Dark）：#a52834
    -   主色调色板（PrimeVue 设计令牌 primary 50~950）：
        -   50: #ffe5e9
        -   100: #ffccd3
        -   200: #ffb3bd
        -   300: #ff8a9e
        -   400: #ff6b6b
        -   500: #e63946
        -   600: #d12f3a
        -   700: #a52834
        -   800: #7c1d28
        -   900: #5a151d
        -   950: #3a0c12
    -   辅助色：#2d3748, #718096, #e2e8f0
    -   背景色：#f8fafc, #ffffff

## 部署方式

### 1. Node.js 本地部署

-   安装依赖：`pnpm install`
-   启动服务：`pnpm run dev` 或 `pnpm run build && pnpm run start`

### 2. Docker 部署

-   构建镜像：`docker build -t caomei-auth .`
-   运行容器：`docker run -p 3000:3000 caomei-auth`

### 3. Vercel 部署

-   参考 `vercel.json` 配置，推送到 GitHub 后自动部署

### 4. Cloudflare Workers 部署

-   参考 `wrangler.toml` 配置，使用 `wrangler publish` 部署

## 未来规划

-   支持更多第三方登录（如微信、钉钉、抖音、TikTok、Facebook、LinkedIn 等）
-   支持 SSO 单点登录、企业微信/钉钉集成
-   一键注册/登录（邮箱/短信验证码一键注册）
-   提供丰富的 API 文档
-   管理后台：用户管理、权限管理、登录统计等
-   系统设置页面 `/admin/settings`：可视化配置管理界面
-   不同尺寸的桌面端和移动端界面适配
-   无障碍适配（支持键盘导航、屏幕阅读器等）
-   多语言适配（支持不同语言翻译，包含 UI 界面、邮件等）
-   国际化适配（手机号支持国家地区代码，时区可修改）
-   隐私保护（加密手机号、邮件地址）；注销账号（需要管理员手动操作）
-   测试用例（单元测试、集成测试、端到端测试）
-   注册控制（邮箱域名黑白名单，手机号国家地区黑白名单）
-   安全性增强（如验证码、登录日志、设备管理等）
-   登录日志（记录用户登录时间、IP 地址、设备信息等）
-   控制台日志、日志文件、日志分割等
-   设备管理（支持多设备登录、异地登录监控、登录风险检测等）
-   设置备案号（ICP 备案号等）
-   性能优化（数据库索引优化、缓存策略、异步处理等）
-   优化 SSR 渲染

## 开源协议

MIT License
