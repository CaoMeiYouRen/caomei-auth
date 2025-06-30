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
    -   第三方社交媒体（GitHub、Google 等）
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
    -   SCSS
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

```
caomei-auth/
├── app/                # Nuxt 应用主目录
│   ├── pages/          # 页面
│   ├── components/     # 组件
│   ├── assets/         # 静态资源（SCSS、图片等）
│   ├── server/         # API 路由、服务端逻辑
│   └── ...
├── docker/
│   └── Dockerfile
├── vercel.json         # Vercel 配置
├── wrangler.toml       # Cloudflare Workers 配置
├── pnpm-lock.yaml      # pnpm 锁定文件
├── README.md
└── ...
```

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

-   支持更多第三方登录（如微信、QQ、Apple ID 等）
-   支持 SSO 单点登录、企业微信/钉钉集成
-   提供丰富的 API 文档和 SDK
-   管理后台：用户管理、权限管理、登录统计等

## 开源协议

MIT License
