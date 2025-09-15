<h1 align="center">
  <img src="https://raw.githubusercontent.com/CaoMeiYouRen/caomei-auth/master/public/logo.png" alt="Caomei Auth" width="120" height="120">
  <br>
  Caomei Auth
</h1>

<p align="center">
  <strong>统一登录平台 · OAuth2.0 · 多因子认证 · 社交登录</strong>
</p>

<p align="center">
  <img alt="Version" src="https://img.shields.io/github/package-json/v/CaoMeiYouRen/caomei-auth.svg" />
  <a href="https://hub.docker.com/r/caomeiyouren/caomei-auth" target="_blank">
    <img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/caomeiyouren/caomei-auth">
  </a>
  <a href="https://github.com/CaoMeiYouRen/caomei-auth/actions?query=workflow%3ARelease" target="_blank">
    <img alt="GitHub Workflow Status" src="https://img.shields.io/github/actions/workflow/status/CaoMeiYouRen/caomei-auth/release.yml?branch=master">
  </a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-blue.svg" />
  <a href="https://github.com/CaoMeiYouRen/caomei-auth#readme" target="_blank">
    <img alt="Documentation" src="https://img.shields.io/badge/documentation-yes-brightgreen.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/caomei-auth/graphs/commit-activity" target="_blank">
    <img alt="Maintenance" src="https://img.shields.io/badge/Maintained%3F-yes-green.svg" />
  </a>
  <a href="https://github.com/CaoMeiYouRen/caomei-auth/blob/master/LICENSE" target="_blank">
    <img alt="License: MIT" src="https://img.shields.io/github/license/CaoMeiYouRen/caomei-auth?color=yellow" />
  </a>
</p>

> 🍓 草梅 Auth 是一个基于 **Nuxt 3** 全栈框架的现代化统一登录平台。支持 **OAuth2.0** 协议，集成多种登录方式，为您的应用提供完整的身份认证解决方案。

## ✨ 特性

-   🔐 **OAuth2.0 协议** - 标准的授权协议，易于集成
-   🚀 **多种登录方式** - 邮箱、用户名、手机号、验证码、社交媒体登录
-   🛡️ **安全可靠** - 多因子认证、登录日志、设备管理
-   📱 **响应式设计** - 完美适配桌面端与移动端
-   ⚡ **高性能** - 基于 Nuxt 3 的 SSR 渲染
-   🎨 **现代化 UI** - 基于 PrimeVue 组件库，支持主题定制
-   🌍 **多种部署方式** - Node.js、Docker、Vercel、Cloudflare Workers
-   📚 **完整文档** - 详细的 API 文档和集成指南

## 🏠 在线体验

-   **演示站点**: [https://auth-demo.cmyr.dev/](https://auth-demo.cmyr.dev/)

    -   可以通过用户名 `demo_admin`，密码`Demo@123456`登录演示用管理员账号。

-   **正式站点**: [https://auth.cmyr.dev/](https://auth.cmyr.dev/)

    -   您可以注册自己的账号查看用户视角。

-   **文档站点**: [https://auth-docs.cmyr.dev/](https://auth-docs.cmyr.dev/)

希望试用基于 `草梅 Auth` 的第三方登录功能？

-   **afdian-linker**: [https://afdian.cmyr.dev/](https://afdian.cmyr.dev/)

**页面截图**

![image-20250720201256684](https://oss.cmyr.dev/images/20250720201256857.png)

![image-20250807233209195](https://oss.cmyr.dev/images/20250807233216397.png)

![image-20250803195105231](https://oss.cmyr.dev/images/20250803195112443.png)

## 🚀 快速开始

### 环境要求

-   Node.js >= 18
-   数据库：PostgreSQL / MySQL / SQLite
-   PNPM（推荐）

### 安装

```bash
# 克隆项目
git clone https://github.com/CaoMeiYouRen/caomei-auth.git
cd caomei-auth

# 安装依赖（推荐使用 pnpm）
pnpm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 启动开发服务器
pnpm dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用

### 生产部署

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm preview
```

## 🛠️ 技术栈

<table>
  <thead>
    <tr>
      <th>技术分类</th>
      <th>使用技术</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>前端框架</strong></td>
      <td>Vue 3, Nuxt 3</td>
    </tr>
    <tr>
      <td><strong>UI 组件库</strong></td>
      <td>PrimeVue, @mdi/font</td>
    </tr>
    <tr>
      <td><strong>认证框架</strong></td>
      <td>Better Auth</td>
    </tr>
    <tr>
      <td><strong>数据库</strong></td>
      <td>PostgreSQL, MySQL, SQLite</td>
    </tr>
    <tr>
      <td><strong>ORM</strong></td>
      <td>TypeORM</td>
    </tr>
    <tr>
      <td><strong>样式预处理</strong></td>
      <td>SCSS</td>
    </tr>
    <tr>
      <td><strong>包管理器</strong></td>
      <td>PNPM</td>
    </tr>
    <tr>
      <td><strong>类型检查</strong></td>
      <td>TypeScript</td>
    </tr>
  </tbody>
</table>

## 📋 功能列表

### 🔐 认证功能

-   ✅ 邮箱 + 密码登录
-   ✅ 用户名 + 密码登录
-   ✅ 手机号 + 密码登录
-   ✅ 邮箱验证码登录
-   ✅ 短信验证码登录
-   ✅ 社交媒体登录（GitHub、Google、Microsoft 等）
-   ✅ 多因子认证（MFA）
-   ✅ OAuth2.0 授权
-   ✅ SSO 单点登录

### 👤 用户管理

-   ✅ 用户注册/登录
-   ✅ 个人资料管理
-   ✅ 密码修改
-   ✅ 账号安全设置
-   ✅ 登录日志查看
-   ✅ 设备管理

### 🔧 管理后台

-   ✅ 用户管理
-   ✅ OAuth 应用管理
-   ✅ 登录统计分析
-   ✅ 系统配置

### 📱 其他功能

-   ✅ 响应式设计
-   ✅ 多种部署方式
-   ✅ 完整的 API 文档
-   🚧 多语言支持（开发中）
-   🚧 无障碍适配（开发中）

## 🆚 为什么选择草梅 Auth？

### 与其他认证方案的对比

| 对比维度        | 草梅 Auth     | Auth0/Firebase | Keycloak    | 自建系统      |
| --------------- | ------------- | -------------- | ----------- | ------------- |
| 📊 **数据掌控** | ✅ 完全掌控   | ❌ 第三方托管  | ✅ 自主掌控 | ✅ 完全掌控   |
| 💰 **成本效益** | ✅ 无用户费用 | ❌ 按用户计费  | ✅ 免费开源 | ⚠️ 开发成本高 |
| 🚀 **开发效率** | ✅ 开箱即用   | ✅ 快速集成    | ⚠️ 配置复杂 | ❌ 从零开发   |
| 🛠️ **定制能力** | ✅ 深度定制   | ⚠️ 有限定制    | ✅ 高度可配 | ✅ 完全定制   |
| 🔧 **运维负担** | ✅ 轻量运维   | ✅ 零运维      | ❌ 重度运维 | ❌ 全面运维   |

### 🎯 核心优势

-   **🏗️ 全栈一体化** - 基于 Nuxt 3，前后端统一，开发体验佳
-   **💾 数据自主权** - 用户数据存储在您的数据库中，完全掌控
-   **💸 成本优势** - 无按用户计费，大规模应用成本更低
-   **🔒 企业级安全** - 内置双因子认证、审计日志、会话管理
-   **🚀 现代化技术** - TypeScript + Better Auth + PrimeVue

**了解更多对比详情：** [📊 详细方案对比](https://auth-docs.cmyr.dev/docs/usage/comparison)

## 📖 文档

-   [📚 完整文档](https://auth-docs.cmyr.dev/)
-   [🚀 快速开始](https://auth-docs.cmyr.dev/docs/usage/getting-started)
-   [🆚 方案对比](https://auth-docs.cmyr.dev/docs/usage/comparison)
-   [🔌 API 文档](https://auth-docs.cmyr.dev/docs/api/)
-   [🛠️ 部署指南](https://auth-docs.cmyr.dev/docs/deployment/)
-   [📖 开发指南](https://auth-docs.cmyr.dev/docs/development/)

## 🔧 开发命令

```bash
# 开发
pnpm dev              # 启动开发服务器
pnpm build           # 构建生产版本
pnpm generate        # 生成静态站点
pnpm preview         # 预览生产版本

# 代码质量
pnpm lint            # ESLint 代码检查
pnpm lint:css        # Stylelint 样式检查
pnpm test            # 运行测试
pnpm test:coverage   # 运行测试并生成覆盖率报告

# 文档
pnpm docs:dev        # 启动文档开发服务器
pnpm docs:build      # 构建文档
pnpm docs:preview    # 预览文档

# 其他
pnpm commit          # 标准化提交
```

## 🔄 部署

### Docker 部署

```bash
# 使用 Docker Compose
docker-compose up -d

# 或者使用 Docker
docker build -t caomei-auth .
docker run -p 3000:3000 caomei-auth
```

### Vercel 部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FCaoMeiYouRen%2Fcaomei-auth)

### Cloudflare Workers 部署（开发中）

即将支持部署到 Cloudflare Workers，敬请期待。

## 🤝 贡献

我们非常欢迎各种形式的贡献！

### 如何贡献

1. Fork 这个项目
2. 创建你的功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

### 报告问题

如果你发现了问题或有新的功能建议，请 [创建 Issue](https://github.com/CaoMeiYouRen/caomei-auth/issues)。

详细的贡献指南请查看 [CONTRIBUTING.md](./CONTRIBUTING.md)。

## 📄 许可证

**本项目的 Logo 不在 License 协议范围内，图片版权由项目所有者 [CaoMeiYouRen](https://github.com/CaoMeiYouRen) 保留。如要进行商业化使用，需更换 Logo。非商业化使用的情况允许在不影响项目所有者权益的情况下使用。**

本项目采用 [MIT](./LICENSE) 许可证。

## 👤 作者

**CaoMeiYouRen**

-   🌐 Website: [https://blog.cmyr.ltd/](https://blog.cmyr.ltd/)
-   🐙 GitHub: [@CaoMeiYouRen](https://github.com/CaoMeiYouRen)

## 💰 支持作者

如果这个项目对你有帮助，请给一个 ⭐️，非常感谢！

你也可以通过以下方式支持作者：

<a href="https://afdian.com/@CaoMeiYouRen">
  <img src="https://oss.cmyr.dev/images/202306192324870.png" width="312px" height="78px" alt="在爱发电支持我">
</a>

## 🌟 Star History

[![Star History Chart](https://api.star-history.com/svg?repos=CaoMeiYouRen/caomei-auth&type=Date)](https://star-history.com/#CaoMeiYouRen/caomei-auth&Date)

## 🏆 Contributors

感谢所有为这个项目做出贡献的开发者：

<a href="https://github.com/CaoMeiYouRen/caomei-auth/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=CaoMeiYouRen/caomei-auth" />
</a>

---

<p align="center">
  <strong>Made with ❤️ by <a href="https://github.com/CaoMeiYouRen">CaoMeiYouRen</a></strong>
</p>

<p align="center">
  <sub>
    如果你喜欢这个项目，请给它一个 ⭐️！<br>
    Copyright © 2025 <a href="https://github.com/CaoMeiYouRen">CaoMeiYouRen</a>
  </sub>
</p>
