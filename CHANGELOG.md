# caomei-auth

# [1.11.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.10.1...v1.11.0) (2025-11-08)


### ✨ 新功能

* **auth:** 添加 Facebook 登录支持及相关配置 ([2c8fd4a](https://github.com/CaoMeiYouRen/caomei-auth/commit/2c8fd4a))
* **theme:** 添加对系统偏好设置的暗色模式同步支持 ([1dfef24](https://github.com/CaoMeiYouRen/caomei-auth/commit/1dfef24))
* **theme:** 添加暗色模式支持及主题切换功能 ([df18369](https://github.com/CaoMeiYouRen/caomei-auth/commit/df18369))


### 🐛 Bug 修复

* **style:** 优化暗色模式样式，统一媒体查询格式 ([1c88ecf](https://github.com/CaoMeiYouRen/caomei-auth/commit/1c88ecf))

## [1.10.1](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.10.0...v1.10.1) (2025-10-18)


### 🐛 Bug 修复

* **captcha:** 更新验证码组件以支持新的 vue-recaptcha 插件 ([94120d4](https://github.com/CaoMeiYouRen/caomei-auth/commit/94120d4))
* **captcha:** 更新验证码组件导入路径 ([4af00c9](https://github.com/CaoMeiYouRen/caomei-auth/commit/4af00c9))
* **config:** 更新构建配置 ([2a60bf8](https://github.com/CaoMeiYouRen/caomei-auth/commit/2a60bf8))
* **nuxt:** 修复 vue-recaptcha-v3 的转译条件 ([eaeec9c](https://github.com/CaoMeiYouRen/caomei-auth/commit/eaeec9c))
* **recaptcha:** 优化 Google reCAPTCHA 插件的加载逻辑 ([e92a48d](https://github.com/CaoMeiYouRen/caomei-auth/commit/e92a48d))
* **recaptcha:** 添加 vue-recaptcha 插件到 Nuxt 配置并设置相关选项 ([fb8bebc](https://github.com/CaoMeiYouRen/caomei-auth/commit/fb8bebc))

# [1.10.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.9.0...v1.10.0) (2025-10-11)


### ✨ 新功能

* 添加验证码功能并整合至注册、登录、发送验证码流程 ([71b6f47](https://github.com/CaoMeiYouRen/caomei-auth/commit/71b6f47))


### 🐛 Bug 修复

* 优化验证码组件显示逻辑，仅在需要时渲染 ([747b788](https://github.com/CaoMeiYouRen/caomei-auth/commit/747b788))

# [1.9.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.8.0...v1.9.0) (2025-09-27)


### ✨ 新功能

* 更新验证码逻辑，支持多种提供商并在重置密码时集成验证码 ([b8b91ee](https://github.com/CaoMeiYouRen/caomei-auth/commit/b8b91ee))
* 添加 hCaptcha 组件及相关逻辑支持 ([cc9ea94](https://github.com/CaoMeiYouRen/caomei-auth/commit/cc9ea94))
* 添加 reCAPTCHA v3 支持，新增 execute 方法和 loading 状态 ([4a63938](https://github.com/CaoMeiYouRen/caomei-auth/commit/4a63938))
* 添加对 Cloudflare Turnstile 的支持并更新相关逻辑 ([7acdb89](https://github.com/CaoMeiYouRen/caomei-auth/commit/7acdb89))


### 🐛 Bug 修复

* 使用 logger 替换 console.warn 以统一日志记录 ([452bfd6](https://github.com/CaoMeiYouRen/caomei-auth/commit/452bfd6))
* 添加 reCAPTCHA 类型定义和社交提供商类型 ([45cc23b](https://github.com/CaoMeiYouRen/caomei-auth/commit/45cc23b))


### 📦 代码重构

* 更新验证码发送逻辑，使用对象参数传递信息 ([a5699dc](https://github.com/CaoMeiYouRen/caomei-auth/commit/a5699dc))

# [1.8.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.7.0...v1.8.0) (2025-09-20)


### ✨ 新功能

* 更新隐私政策和服务条款，增强用户信息保护和透明度 ([6ab1815](https://github.com/CaoMeiYouRen/caomei-auth/commit/6ab1815))
* 添加 GitHub 角落链接组件，增强页面导航 ([7a1631f](https://github.com/CaoMeiYouRen/caomei-auth/commit/7a1631f))
* 添加反馈按钮组件并配置反馈链接 ([cfdf31e](https://github.com/CaoMeiYouRen/caomei-auth/commit/cfdf31e))
* 添加演示模式相关组件和逻辑，支持展示提示横幅和对话框 ([f6f223e](https://github.com/CaoMeiYouRen/caomei-auth/commit/f6f223e))
* 添加验证码配置支持，集成 Google reCAPTCHA、Cloudflare Turnstile 和 hCaptcha ([03831d4](https://github.com/CaoMeiYouRen/caomei-auth/commit/03831d4))


### 🐛 Bug 修复

* **login:** 修复登录页暗色模式社交登录按钮颜色错误问题 ([5ecba3f](https://github.com/CaoMeiYouRen/caomei-auth/commit/5ecba3f))
* 优化暗色模式支持，调整社交登录提供商颜色 ([9c2ae0b](https://github.com/CaoMeiYouRen/caomei-auth/commit/9c2ae0b))
* 优化演示模式组件，支持动态文档链接和消息文本 ([38e4206](https://github.com/CaoMeiYouRen/caomei-auth/commit/38e4206))
* 优化邮件模板回退逻辑，增强安全提示和用户体验 ([399d1a1](https://github.com/CaoMeiYouRen/caomei-auth/commit/399d1a1))
* 修复样式中的空格问题，优化暗色模式下的变量定义 ([711122e](https://github.com/CaoMeiYouRen/caomei-auth/commit/711122e))
* 修复用户资料页面的暗色模式样式问题 ([b943e73](https://github.com/CaoMeiYouRen/caomei-auth/commit/b943e73))
* 修复邮件模板文件内容路径错误，支持多种环境路径查找 ([8026f82](https://github.com/CaoMeiYouRen/caomei-auth/commit/8026f82))
* 修复邮件模板错误 ([fcf338a](https://github.com/CaoMeiYouRen/caomei-auth/commit/fcf338a))
* 修复首页的暗色模式样式问题，优化用户体验 ([6933043](https://github.com/CaoMeiYouRen/caomei-auth/commit/6933043))
* 修改邮件模板背景颜色为白色，提升可读性 ([9f15de6](https://github.com/CaoMeiYouRen/caomei-auth/commit/9f15de6))
* 在演示模式横幅中添加文档链接，优化隐私页面外部链接的打开方式 ([2456491](https://github.com/CaoMeiYouRen/caomei-auth/commit/2456491))
* 更新 Demo 模式配置，使用 NUXT_PUBLIC_DEMO_MODE 环境变量 ([d5426ae](https://github.com/CaoMeiYouRen/caomei-auth/commit/d5426ae))
* 更新文档链接，优化用户管理文档访问 ([d9bd648](https://github.com/CaoMeiYouRen/caomei-auth/commit/d9bd648))
* 更新邮件服务，添加邮箱验证和密码重置验证码发送功能 ([b216029](https://github.com/CaoMeiYouRen/caomei-auth/commit/b216029))
* 更新邮件模板获取逻辑，支持异步读取和回退机制 ([95bf0d1](https://github.com/CaoMeiYouRen/caomei-auth/commit/95bf0d1))
* 根据暗色模式调整社交登录提供商颜色 ([7c2760e](https://github.com/CaoMeiYouRen/caomei-auth/commit/7c2760e))
* 添加 footer 组件暗色模式支持 ([ae16e2b](https://github.com/CaoMeiYouRen/caomei-auth/commit/ae16e2b))
* 添加 OIDC 支持的 scopes 和 response 类型 ([8a691bc](https://github.com/CaoMeiYouRen/caomei-auth/commit/8a691bc))
* 添加注册过程中的禁用状态管理，优化用户体验 ([9734f48](https://github.com/CaoMeiYouRen/caomei-auth/commit/9734f48))
* 添加邮件模板片段回退机制，增强模板内容的可用性和安全性 ([0a895d6](https://github.com/CaoMeiYouRen/caomei-auth/commit/0a895d6))
* 调整反馈按钮组件的内边距并简化属性传递 ([94897aa](https://github.com/CaoMeiYouRen/caomei-auth/commit/94897aa))


### 📦 代码重构

* 优化 Demo 模式下登录日志的逻辑，添加假数据生成 ([aebff99](https://github.com/CaoMeiYouRen/caomei-auth/commit/aebff99))
* 优化 Demo 模式横幅的展示逻辑，移除不必要的属性 ([d90b150](https://github.com/CaoMeiYouRen/caomei-auth/commit/d90b150))
* 优化后台布局和页面暗色模式支持 ([3701016](https://github.com/CaoMeiYouRen/caomei-auth/commit/3701016))
* 优化暗色模式支持，优化认证页面样式 ([d38a90a](https://github.com/CaoMeiYouRen/caomei-auth/commit/d38a90a))
* 优化演示模式和 GitHub 角落组件的暗色模式样式 ([4df6e59](https://github.com/CaoMeiYouRen/caomei-auth/commit/4df6e59))
* 优化认证页面扩展暗色模式样式，优化按钮和输入框样式 ([6d93325](https://github.com/CaoMeiYouRen/caomei-auth/commit/6d93325))
* 优化语言支持和回退逻辑，优化用户语言检测 ([7fb2700](https://github.com/CaoMeiYouRen/caomei-auth/commit/7fb2700))
* 优化验证码环境变量配置 ([8a46af6](https://github.com/CaoMeiYouRen/caomei-auth/commit/8a46af6))
* 增强认证页面暗色模式支持，优化表单和对话框样式 ([8b78618](https://github.com/CaoMeiYouRen/caomei-auth/commit/8b78618))
* 根据演示模式动态显示 GitHub 角落链接组件 ([27a42ae](https://github.com/CaoMeiYouRen/caomei-auth/commit/27a42ae))
* 统一优化带延迟的登录后跳转逻辑，优化用户体验 ([11e1773](https://github.com/CaoMeiYouRen/caomei-auth/commit/11e1773))
* 重构验证码相关功能，优化配置和端点列表 ([220b9a4](https://github.com/CaoMeiYouRen/caomei-auth/commit/220b9a4))

# [1.7.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.6.0...v1.7.0) (2025-09-13)


### ✨ 新功能

* **auth:** 添加邮箱验证选项，用户需在登录前验证邮箱 ([38d0a1e](https://github.com/CaoMeiYouRen/caomei-auth/commit/38d0a1e))
* **demo:** 添加 Demo 模式相关类型定义和假数据生成工具 ([19bd41b](https://github.com/CaoMeiYouRen/caomei-auth/commit/19bd41b))
* **demo:** 添加 Demo 模式配置，更新假数据生成逻辑和相关类型定义 ([6ae3e82](https://github.com/CaoMeiYouRen/caomei-auth/commit/6ae3e82))
* **password:** 添加密码强度配置，支持通过环境变量设置密码强度要求 ([074779c](https://github.com/CaoMeiYouRen/caomei-auth/commit/074779c))
* 添加调试构建支持，更新配置和文档 ([6eedb2f](https://github.com/CaoMeiYouRen/caomei-auth/commit/6eedb2f))


### 🐛 Bug 修复

* **auth:** 引入邮箱验证配置常量 ([e4d1ce9](https://github.com/CaoMeiYouRen/caomei-auth/commit/e4d1ce9))
* **auth:** 移除不必要的环境变量引用，简化代码 ([0423fb1](https://github.com/CaoMeiYouRen/caomei-auth/commit/0423fb1))
* **demo:** 更新 DemoUser 接口，id 字段改为可选 ([2b984fd](https://github.com/CaoMeiYouRen/caomei-auth/commit/2b984fd))
* **demo:** 更新 SSO 提供商生成逻辑，添加新的应用描述和调整随机用户计数 ([ee51414](https://github.com/CaoMeiYouRen/caomei-auth/commit/ee51414))
* 修复 better-call 依赖版本错误 ([7f42cc7](https://github.com/CaoMeiYouRen/caomei-auth/commit/7f42cc7))
* 修复密码强度验证环境变量读取错误 ([f8c147f](https://github.com/CaoMeiYouRen/caomei-auth/commit/f8c147f))
* 将压缩构建工具从 esbuild 更改为 terser ([d1b4c2f](https://github.com/CaoMeiYouRen/caomei-auth/commit/d1b4c2f))
* 将构建工具从 terser 更改为 esbuild ([766462b](https://github.com/CaoMeiYouRen/caomei-auth/commit/766462b))
* 恢复 Demo 模式数据预填充函数，确保初始化时填充假数据 ([3539046](https://github.com/CaoMeiYouRen/caomei-auth/commit/3539046))
* 捕获并记录获取用户 session 失败的错误信息 ([2f544e9](https://github.com/CaoMeiYouRen/caomei-auth/commit/2f544e9))
* 更新 nuxt.config.ts 配置文件 ([1d5c164](https://github.com/CaoMeiYouRen/caomei-auth/commit/1d5c164))
* 更新数据库初始化逻辑，确保在 Demo 模式下同步表结构 ([2df760f](https://github.com/CaoMeiYouRen/caomei-auth/commit/2df760f))
* 更新演示模式配置，使用常量替代环境变量读取，修复生成的客户端密钥逻辑 ([87fe929](https://github.com/CaoMeiYouRen/caomei-auth/commit/87fe929))
* 更新用户账户绑定逻辑，使用 providerId 替代 provider ([f08724f](https://github.com/CaoMeiYouRen/caomei-auth/commit/f08724f))
* 注释掉 Demo 模式下的假数据预填充函数调用 ([f22cdf8](https://github.com/CaoMeiYouRen/caomei-auth/commit/f22cdf8))
* 注释掉 nuxt.config.ts 中的调试模式配置，添加 typeorm-adapter.ts 中的模型名称获取错误处理 ([293dd00](https://github.com/CaoMeiYouRen/caomei-auth/commit/293dd00))
* 注释掉登录函数中的会话获取和管理员跳转逻辑 ([c4db9de](https://github.com/CaoMeiYouRen/caomei-auth/commit/c4db9de))
* 添加 youch 依赖以增强错误处理 ([9569229](https://github.com/CaoMeiYouRen/caomei-auth/commit/9569229))
* 移除未使用的 Demo 模式数据预填充函数 ([c25dc3e](https://github.com/CaoMeiYouRen/caomei-auth/commit/c25dc3e))
* 移除未使用的路由器引用并更新用户资料导航方法 ([8e5a0c2](https://github.com/CaoMeiYouRen/caomei-auth/commit/8e5a0c2))
* 移除重复的随机字符串生成导入，优化代码结构 ([1b36480](https://github.com/CaoMeiYouRen/caomei-auth/commit/1b36480))


### 📦 代码重构

* 增强 Demo 模式守卫，阻止危险的管理后台操作和不允许的写操作 ([b91afc2](https://github.com/CaoMeiYouRen/caomei-auth/commit/b91afc2))

# [1.6.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.5.0...v1.6.0) (2025-09-06)


### ✨ 新功能

* **password:** 添加密码强度组件，优化密码验证逻辑和提示信息 ([1b338b8](https://github.com/CaoMeiYouRen/caomei-auth/commit/1b338b8))
* **sms:** 添加对 Twilio 短信服务的支持，更新相关配置和文档 ([c1cbb3e](https://github.com/CaoMeiYouRen/caomei-auth/commit/c1cbb3e))


### 🐛 Bug 修复

* **auth:** 修复获取用户额外信息的类型声明，支持返回手机号 ([e23cb86](https://github.com/CaoMeiYouRen/caomei-auth/commit/e23cb86))
* **auth:** 移除不必要的服务器端检查，优化首页路由处理逻辑 ([fa4f10d](https://github.com/CaoMeiYouRen/caomei-auth/commit/fa4f10d))
* **consent:** 修复返回首页按钮的点击事件，确保导航功能正常 ([582e3de](https://github.com/CaoMeiYouRen/caomei-auth/commit/582e3de))
* **email-template:** 更新邮件模板，添加联系方式链接 ([97af9b1](https://github.com/CaoMeiYouRen/caomei-auth/commit/97af9b1))
* **env:** 修改 Spug 的环境变量配置名称和相关文档 ([adaa1fe](https://github.com/CaoMeiYouRen/caomei-auth/commit/adaa1fe))
* **logger:** 增强短信日志记录，支持 Twilio 特有字段和渠道信息 ([0dfc350](https://github.com/CaoMeiYouRen/caomei-auth/commit/0dfc350))
* **logger:** 将日志缓存刷新间隔从30秒修改为60秒，以减少高频查询的日志输出 ([eed5a28](https://github.com/CaoMeiYouRen/caomei-auth/commit/eed5a28))
* **login:** 更新登录按钮提示信息，优化用户体验；添加验证码输入自动提交功能 ([5cdc503](https://github.com/CaoMeiYouRen/caomei-auth/commit/5cdc503))


### 📦 代码重构

* **email-template:** 重构邮件模板引擎，简化模板生成逻辑并增强可读性 ([d375f85](https://github.com/CaoMeiYouRen/caomei-auth/commit/d375f85))
* **phone:** 重构短信发送逻辑，支持 Spug 和 Twilio 渠道，优化手机号验证和错误处理 ([4ca0045](https://github.com/CaoMeiYouRen/caomei-auth/commit/4ca0045))
* **quick-login:** 更新快速登录页面，优化用户体验和错误提示信息 ([b5bbdc2](https://github.com/CaoMeiYouRen/caomei-auth/commit/b5bbdc2))
* **styles:** 移除不必要的样式导入，优化组件样式结构 ([5d3991d](https://github.com/CaoMeiYouRen/caomei-auth/commit/5d3991d))
* 优化密码验证逻辑，移除重复的密码验证函数并调整导入路径 ([3321058](https://github.com/CaoMeiYouRen/caomei-auth/commit/3321058))

# [1.5.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.4.1...v1.5.0) (2025-08-30)


### ✨ 新功能

* **auth:** 添加快速登录页面和智能输入功能，支持邮箱和手机号登录 ([649008f](https://github.com/CaoMeiYouRen/caomei-auth/commit/649008f))
* **auth:** 添加用户名登录功能及相关配置 ([9450cbe](https://github.com/CaoMeiYouRen/caomei-auth/commit/9450cbe))
* **profile:** 添加隐私模式切换功能，优化邮箱和手机号显示逻辑 ([7a99878](https://github.com/CaoMeiYouRen/caomei-auth/commit/7a99878))
* **quick-login:** 优化输入区域和验证码发送逻辑，简化组件结构 ([6486ead](https://github.com/CaoMeiYouRen/caomei-auth/commit/6486ead))
* **quick-login:** 添加手机号输入框和区域选择器，优化输入逻辑 ([67c11ba](https://github.com/CaoMeiYouRen/caomei-auth/commit/67c11ba))
* **register:** 添加用户名输入功能及相关验证 ([23edd3d](https://github.com/CaoMeiYouRen/caomei-auth/commit/23edd3d))
* **social:** 统一社交平台品牌色定义，新增辅助工具函数以获取平台信息 ([c8e3d79](https://github.com/CaoMeiYouRen/caomei-auth/commit/c8e3d79))
* **styles:** 重构样式导入，新增全局样式文件并移除不必要的导入 ([9b62a16](https://github.com/CaoMeiYouRen/caomei-auth/commit/9b62a16))


### 🐛 Bug 修复

* **auth:** 修复用户名规范化变更 ([0256a9a](https://github.com/CaoMeiYouRen/caomei-auth/commit/0256a9a))
* **auth:** 添加 OpenID 用户 ID 声明并更新文档 ([b3e4bff](https://github.com/CaoMeiYouRen/caomei-auth/commit/b3e4bff))
* **deps:** update all non-major dependencies ([#61](https://github.com/CaoMeiYouRen/caomei-auth/issues/61)) ([fbd6950](https://github.com/CaoMeiYouRen/caomei-auth/commit/fbd6950))
* **home:** 添加快速登录页面跳转功能 ([b967dff](https://github.com/CaoMeiYouRen/caomei-auth/commit/b967dff))
* **login:** 调整匿名登录密码输入框的行高 ([bd2d082](https://github.com/CaoMeiYouRen/caomei-auth/commit/bd2d082))
* **profile:** 修复用户信息更新时用户名的获取逻辑 ([c13f444](https://github.com/CaoMeiYouRen/caomei-auth/commit/c13f444))
* **styles:** 添加错误色的深色变量并更新相关样式 ([cea4482](https://github.com/CaoMeiYouRen/caomei-auth/commit/cea4482))


### 📦 代码重构

* **profile:** 更新隐私模式下用户ID和用户名的显示逻辑，添加用户名脱敏处理 ([2e2bcee](https://github.com/CaoMeiYouRen/caomei-auth/commit/2e2bcee))
* 注册时不再要求设置用户名，而是昵称 ([b5eb32d](https://github.com/CaoMeiYouRen/caomei-auth/commit/b5eb32d))

## [1.4.1](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.4.0...v1.4.1) (2025-08-23)


### 🐛 Bug 修复

* **deps:** update dependency typeorm to v0.3.26 ([1a48034](https://github.com/CaoMeiYouRen/caomei-auth/commit/1a48034))
* **deps:** update dependency vue to v3.5.19 ([#55](https://github.com/CaoMeiYouRen/caomei-auth/issues/55)) ([bcd7410](https://github.com/CaoMeiYouRen/caomei-auth/commit/bcd7410))

# [1.4.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.3.0...v1.4.0) (2025-08-16)


### ♻ 代码重构

* **email:** 删除邮件发送测试端点的实现代码 ([3702934](https://github.com/CaoMeiYouRen/caomei-auth/commit/3702934))
* **email:** 更新登录验证码邮件的安全提示信息；移除未使用的模板组合方法 ([74ddcfc](https://github.com/CaoMeiYouRen/caomei-auth/commit/74ddcfc))
* **email:** 更新邮件发送成功消息格式，简化返回信息；删除邮箱验证模板 ([f793d2c](https://github.com/CaoMeiYouRen/caomei-auth/commit/f793d2c))
* **email:** 更新邮件模板样式并移除HTML压缩选项 ([620b8a9](https://github.com/CaoMeiYouRen/caomei-auth/commit/620b8a9))
* **logger:** 使用 Winston 替代 Consola 作为日志记录工具，添加日志文件轮转功能 ([cbfcc25](https://github.com/CaoMeiYouRen/caomei-auth/commit/cbfcc25))
* **logger:** 增强日志记录功能，支持无服务器环境下的文件日志检测与处理 ([9993c6e](https://github.com/CaoMeiYouRen/caomei-auth/commit/9993c6e))
* **logger:** 更新控制台日志格式配置，根据环境决定是否带颜色 ([7070cce](https://github.com/CaoMeiYouRen/caomei-auth/commit/7070cce))
* **logger:** 更新日志记录器以使用 Winston 标准日志级别，移除不必要的 emoji ([7d4efe3](https://github.com/CaoMeiYouRen/caomei-auth/commit/7d4efe3))
* **logger:** 简化响应记录逻辑，移除不必要的响应时间头设置 ([9239730](https://github.com/CaoMeiYouRen/caomei-auth/commit/9239730))
* **navigation:** 优先使用 navigateTo 函数处理页面导航，新增 goDocs 函数 ([55fcde8](https://github.com/CaoMeiYouRen/caomei-auth/commit/55fcde8))
* **phone:** 优化 google-libphonenumber 导入方式，使用解构赋值 ([d33a725](https://github.com/CaoMeiYouRen/caomei-auth/commit/d33a725))


### ✨ 新功能

* **api:** 添加返回服务信息的API端点 ([e31fd12](https://github.com/CaoMeiYouRen/caomei-auth/commit/e31fd12))
* **database:** 添加自定义日志记录器以增强数据库操作日志 ([b9ed54b](https://github.com/CaoMeiYouRen/caomei-auth/commit/b9ed54b))
* **date:** 添加日期格式化工具函数，统一日期处理方式 ([e2d1ccf](https://github.com/CaoMeiYouRen/caomei-auth/commit/e2d1ccf))
* **email:** 添加邮件验证服务与MJML模板支持 ([6df7e5c](https://github.com/CaoMeiYouRen/caomei-auth/commit/6df7e5c))
* **email:** 重构邮件发送逻辑，整合新的邮件模板系统并添加多种邮件类型支持 ([54b58b5](https://github.com/CaoMeiYouRen/caomei-auth/commit/54b58b5))
* **locale:** 添加国际化支持，集成语言检测和管理功能 ([f9c93e8](https://github.com/CaoMeiYouRen/caomei-auth/commit/f9c93e8))
* **logger:** 增强日志记录功能，添加敏感数据检查和安全参数格式化 ([4e9ca49](https://github.com/CaoMeiYouRen/caomei-auth/commit/4e9ca49))
* **logger:** 引入 consola 作为日志记录工具，重构日志方法并添加标签支持 ([977d3f2](https://github.com/CaoMeiYouRen/caomei-auth/commit/977d3f2))
* **logger:** 添加 Axiom 日志传输支持，更新环境变量配置 ([96e55b8](https://github.com/CaoMeiYouRen/caomei-auth/commit/96e55b8))
* **logging:** 使用logger替代console.error，增强错误记录的详细性 ([095c27d](https://github.com/CaoMeiYouRen/caomei-auth/commit/095c27d))
* **logging:** 增强OAuth应用管理的日志记录，添加创建、更新、删除失败的详细信息 ([f39dc9c](https://github.com/CaoMeiYouRen/caomei-auth/commit/f39dc9c))
* **logging:** 引入隐私保护工具，增强日志记录中的敏感信息脱敏处理 ([2e7a095](https://github.com/CaoMeiYouRen/caomei-auth/commit/2e7a095))
* **logging:** 更新日志记录，增强邮件和短信发送的错误处理与成功记录 ([cbdcfee](https://github.com/CaoMeiYouRen/caomei-auth/commit/cbdcfee))
* **logging:** 添加用户语言检测到 API 请求日志中 ([fac5e50](https://github.com/CaoMeiYouRen/caomei-auth/commit/fac5e50))
* **middleware:** 添加请求日志记录和用户身份验证处理 ([bba3654](https://github.com/CaoMeiYouRen/caomei-auth/commit/bba3654))
* **privacy:** 重构隐私保护工具函数，统一前后端脱敏逻辑 ([e7e55db](https://github.com/CaoMeiYouRen/caomei-auth/commit/e7e55db))
* **profile:** 添加邮箱和手机号脱敏处理功能，增强用户隐私保护 ([1ec3ff3](https://github.com/CaoMeiYouRen/caomei-auth/commit/1ec3ff3))
* **profile:** 添加隐私设置功能，允许用户控制邮箱和手机号的显示状态 ([e75daed](https://github.com/CaoMeiYouRen/caomei-auth/commit/e75daed))
* 添加 Google Analytics 集成及相关配置 ([4e0ebe3](https://github.com/CaoMeiYouRen/caomei-auth/commit/4e0ebe3))
* 添加 Google Analytics 集成文档及相关配置 ([59b0e7d](https://github.com/CaoMeiYouRen/caomei-auth/commit/59b0e7d))
* 添加百度统计客户端插件实现 ([8c0ec5f](https://github.com/CaoMeiYouRen/caomei-auth/commit/8c0ec5f))
* 添加百度统计集成及类型定义 ([72b48c1](https://github.com/CaoMeiYouRen/caomei-auth/commit/72b48c1))
* 添加百度统计集成支持 ([fe8ac20](https://github.com/CaoMeiYouRen/caomei-auth/commit/fe8ac20))


### 🐛 Bug 修复

* **database:** 在数据库初始化日志中添加端口信息 ([eba9cc1](https://github.com/CaoMeiYouRen/caomei-auth/commit/eba9cc1))
* **db:** 更新数据库初始化逻辑以支持测试环境，调整日志记录和查询时间设置 ([d84d888](https://github.com/CaoMeiYouRen/caomei-auth/commit/d84d888))
* **env:** 添加日志目录配置并更新日志记录器 ([82caea5](https://github.com/CaoMeiYouRen/caomei-auth/commit/82caea5))
* **logger:** 修改日志级别为 http，并移除请求日志中的 locale 信息 ([1aefee8](https://github.com/CaoMeiYouRen/caomei-auth/commit/1aefee8))
* **logger:** 修改错误日志文件名为 errors.log，以统一错误处理日志格式 ([e7d7490](https://github.com/CaoMeiYouRen/caomei-auth/commit/e7d7490))
* **phone:** 修复 SUPPORTED_REGIONS 的格式化，确保区域代码和国家代码正确映射 ([5173d65](https://github.com/CaoMeiYouRen/caomei-auth/commit/5173d65))
* **privacy:** 优化手机号码脱敏逻辑，支持区域解析和多种格式处理 ([5a7388b](https://github.com/CaoMeiYouRen/caomei-auth/commit/5a7388b))
* **privacy:** 更新第三方登录服务链接及描述，确保隐私政策的准确性 ([516f16b](https://github.com/CaoMeiYouRen/caomei-auth/commit/516f16b))
* **privacy:** 更新隐私政策，添加 Cookie 使用说明及第三方服务隐私声明链接 ([4fa80bf](https://github.com/CaoMeiYouRen/caomei-auth/commit/4fa80bf))
* **privacy:** 添加 Google Analytics 服务说明以增强隐私政策透明度 ([c658ce4](https://github.com/CaoMeiYouRen/caomei-auth/commit/c658ce4))
* **profile:** 更新隐私设置监听逻辑，优化本地存储保存方式 ([f377d55](https://github.com/CaoMeiYouRen/caomei-auth/commit/f377d55))
* **tsconfig:** 修复 tsconfig.json 格式，添加 compilerOptions 配置 ([e2d4e25](https://github.com/CaoMeiYouRen/caomei-auth/commit/e2d4e25))
* 优化 stylelint ([3270999](https://github.com/CaoMeiYouRen/caomei-auth/commit/3270999))
* 对提供者统计数据进行排序以确保正确显示 ([aa27883](https://github.com/CaoMeiYouRen/caomei-auth/commit/aa27883))
* 更新日期格式化方法，使用 dayjs 统一日期处理 ([3eb4ebd](https://github.com/CaoMeiYouRen/caomei-auth/commit/3eb4ebd))

# [1.3.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.2.0...v1.3.0) (2025-08-09)


### ♻ 代码重构

* **logger:** 优化日志格式化代码，提升可读性和一致性 ([419b480](https://github.com/CaoMeiYouRen/caomei-auth/commit/419b480))
* **logger:** 简化日志记录实现，移除不必要的依赖和复杂性 ([2ac9ebf](https://github.com/CaoMeiYouRen/caomei-auth/commit/2ac9ebf))
* **oauth:** 重构OAuth应用管理路由和命名 ([e5f91e3](https://github.com/CaoMeiYouRen/caomei-auth/commit/e5f91e3))
* **sso:** 添加SSO提供商的增删改查功能，支持敏感信息隐藏和错误处理 ([61e2857](https://github.com/CaoMeiYouRen/caomei-auth/commit/61e2857))
* 移除 @hyperwatch/useragent 依赖，改用 ua-parser-js 进行用户代理解析 ([998e3d8](https://github.com/CaoMeiYouRen/caomei-auth/commit/998e3d8))


### ✨ 新功能

* **admin:** 添加项目文档链接到侧边栏，增强用户导航体验 ([61ed851](https://github.com/CaoMeiYouRen/caomei-auth/commit/61ed851))
* **auth:** 添加SSO登录功能和管理界面 ([593b599](https://github.com/CaoMeiYouRen/caomei-auth/commit/593b599))
* **logging:** 添加日志记录功能，支持每日轮转和错误处理 ([571df39](https://github.com/CaoMeiYouRen/caomei-auth/commit/571df39))
* **logging:** 集成 Winston 日志库，增强日志记录功能，支持多种日志级别和格式 ([7e3fe34](https://github.com/CaoMeiYouRen/caomei-auth/commit/7e3fe34))
* **sso:** 更新SSO提供商管理功能，添加敏感信息隐藏和错误处理 ([1c03f70](https://github.com/CaoMeiYouRen/caomei-auth/commit/1c03f70))
* **sso:** 添加SSO提供商管理界面的数据加载和错误处理功能 ([efc9fd1](https://github.com/CaoMeiYouRen/caomei-auth/commit/efc9fd1))
* **user-management:** 更新用户搜索功能，支持有效邮箱和姓名搜索，优化@符号处理 ([682ea31](https://github.com/CaoMeiYouRen/caomei-auth/commit/682ea31))
* **user-management:** 添加用户管理页面的排序、搜索和筛选功能 ([fedd0da](https://github.com/CaoMeiYouRen/caomei-auth/commit/fedd0da))
* 添加 SSOProvider 实体以管理单点登录配置 ([2352248](https://github.com/CaoMeiYouRen/caomei-auth/commit/2352248))
* 添加无障碍适配文档，提升用户体验；为社交登录提供者添加图标支持 ([15908c0](https://github.com/CaoMeiYouRen/caomei-auth/commit/15908c0))


### 🐛 Bug 修复

* **auth:** 使用 crypto 模块生成更安全的 OAuth 客户端密钥 ([3a18ccc](https://github.com/CaoMeiYouRen/caomei-auth/commit/3a18ccc))
* **storage:** 修复内存存储类型和增量逻辑，确保正确处理字符串值 ([f653ab1](https://github.com/CaoMeiYouRen/caomei-auth/commit/f653ab1))

# [1.2.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.1.0...v1.2.0) (2025-08-02)


### ♻ 代码重构

* **admin:** 优化管理员角色同步逻辑，新增复用用户对象的同步函数 ([c7212e3](https://github.com/CaoMeiYouRen/caomei-auth/commit/c7212e3))
* **admin:** 移除权限管理相关内容，删除不再使用的管理员状态 API ([51a0e4c](https://github.com/CaoMeiYouRen/caomei-auth/commit/51a0e4c))
* **applications:** 添加应用创建功能，支持参数验证和返回符合 RFC7591 标准的响应 ([3920d76](https://github.com/CaoMeiYouRen/caomei-auth/commit/3920d76))
* **auth:** 优化身份验证中间件的代码结构和注释 ([7755884](https://github.com/CaoMeiYouRen/caomei-auth/commit/7755884))
* **auth:** 移除不必要的角色同步函数调用，优化中间件逻辑 ([35b2fc4](https://github.com/CaoMeiYouRen/caomei-auth/commit/35b2fc4))
* **clients:** 移除未使用的 secret-dialog 样式代码 ([1cce30c](https://github.com/CaoMeiYouRen/caomei-auth/commit/1cce30c))
* **security:** 将 Alert 组件替换为 Message 组件，优化双因素认证提示信息 ([7e21714](https://github.com/CaoMeiYouRen/caomei-auth/commit/7e21714))
* **validate:** 优化 URL 验证逻辑，使用 validator 库进行更严格的格式检查 ([9df9219](https://github.com/CaoMeiYouRen/caomei-auth/commit/9df9219))


### ✨ 新功能

* **admin:** 使用dayjs库优化日期处理，提升会话和统计数据查询的准确性 ([48dee2a](https://github.com/CaoMeiYouRen/caomei-auth/commit/48dee2a))
* **admin:** 实现管理员角色自动同步功能 ([f69e00e](https://github.com/CaoMeiYouRen/caomei-auth/commit/f69e00e))
* **admin:** 新增登录统计页面和API端点 ([fab4cf8](https://github.com/CaoMeiYouRen/caomei-auth/commit/fab4cf8))
* **admin:** 添加侧边栏收缩功能，优化导航项显示逻辑 ([9e550c8](https://github.com/CaoMeiYouRen/caomei-auth/commit/9e550c8))
* **admin:** 集成primelocale库并设置中文为默认语言 ([eb3d5ab](https://github.com/CaoMeiYouRen/caomei-auth/commit/eb3d5ab))
* **admin:** 集成图表组件并更新图表数据和配置 ([3527c2b](https://github.com/CaoMeiYouRen/caomei-auth/commit/3527c2b))
* **applications:** 添加应用状态管理功能，支持启用/禁用应用 ([748a99e](https://github.com/CaoMeiYouRen/caomei-auth/commit/748a99e))
* **auth:** 添加 JWKS 实体类并支持 JWT 认证 ([8073657](https://github.com/CaoMeiYouRen/caomei-auth/commit/8073657))
* **clarity:** 集成 Microsoft Clarity 行为分析工具，添加相关配置和使用说明 ([77a3fa9](https://github.com/CaoMeiYouRen/caomei-auth/commit/77a3fa9))
* **clients:** 替换 Chips 组件为 InputText，优化重定向 URL 和联系邮箱的输入处理 ([9d36e93](https://github.com/CaoMeiYouRen/caomei-auth/commit/9d36e93))
* **clients:** 添加 API 文档对话框，展示 OIDC 端点信息 ([f647622](https://github.com/CaoMeiYouRen/caomei-auth/commit/f647622))
* **developer:** 新增部署指南和常见问题文档 ([17cf492](https://github.com/CaoMeiYouRen/caomei-auth/commit/17cf492))
* **docs:** 新增vitepress文档支持 ([e1f8090](https://github.com/CaoMeiYouRen/caomei-auth/commit/e1f8090))
* **docs:** 更新 VitePress 配置，添加多语言支持和文档重定向 ([8eef51a](https://github.com/CaoMeiYouRen/caomei-auth/commit/8eef51a))
* **footer:** 添加个人中心、管理后台和忘记密码链接，基于用户会话状态显示 ([6164544](https://github.com/CaoMeiYouRen/caomei-auth/commit/6164544))
* **index:** 实现首页智能管理员角色同步机制，优化角色状态检查与同步逻辑 ([9c4de27](https://github.com/CaoMeiYouRen/caomei-auth/commit/9c4de27))
* **login:** 添加用户协议和隐私政策的同意提示 ([380427d](https://github.com/CaoMeiYouRen/caomei-auth/commit/380427d))
* **nav:** 在关于、隐私和条款页面添加返回首页按钮 ([5c46063](https://github.com/CaoMeiYouRen/caomei-auth/commit/5c46063))
* **register:** 添加用户协议和隐私政策的同意框及相关验证 ([8204efd](https://github.com/CaoMeiYouRen/caomei-auth/commit/8204efd))
* **sentry:** 添加 Sentry 错误监控集成 ([acc675a](https://github.com/CaoMeiYouRen/caomei-auth/commit/acc675a))
* **tracking:** 添加 Microsoft Clarity 用户行为追踪方案及相关页面追踪实现 ([fbd9277](https://github.com/CaoMeiYouRen/caomei-auth/commit/fbd9277))
* 在页脚和首页新增项目文档链接 ([b97e816](https://github.com/CaoMeiYouRen/caomei-auth/commit/b97e816))


### 🐛 Bug 修复

* **admin:** 优化用户操作按钮，增加角色和状态判断逻辑 ([27eaa0d](https://github.com/CaoMeiYouRen/caomei-auth/commit/27eaa0d))
* **admin:** 更新凭证图标和名称，修正为锁图标和密码登录 ([023b6f6](https://github.com/CaoMeiYouRen/caomei-auth/commit/023b6f6))
* **auth:** 更新用户信息声明，添加 sub 和 nickname 字段，并优化隐私处理 ([4ac79d7](https://github.com/CaoMeiYouRen/caomei-auth/commit/4ac79d7))
* **auth:** 添加 requirePKCE 配置选项以控制 PKCE 强制性 ([17fd80f](https://github.com/CaoMeiYouRen/caomei-auth/commit/17fd80f))
* **clients:** 更新 OAuth 2.0 兼容性提示，明确不支持的特性并优化表单说明 ([b49d01f](https://github.com/CaoMeiYouRen/caomei-auth/commit/b49d01f))
* **clients:** 添加提示信息说明 OAuth 2.0 特性支持情况，并优化样式 ([374173d](https://github.com/CaoMeiYouRen/caomei-auth/commit/374173d))
* **nuxt:** 添加 @hyperwatch/useragent 到构建转译列表 ([c6435d1](https://github.com/CaoMeiYouRen/caomei-auth/commit/c6435d1))
* **users:** 将“姓名”字段更改为“昵称”，以更好地反映用户信息； 更新用户信息中的用户名字段为显示昵称 ([a6827ce](https://github.com/CaoMeiYouRen/caomei-auth/commit/a6827ce))
* **validate:** 更新用户名验证逻辑，禁止手机号格式 ([079f384](https://github.com/CaoMeiYouRen/caomei-auth/commit/079f384))
* 添加邮件和上传文件的限流配置选项 ([5434017](https://github.com/CaoMeiYouRen/caomei-auth/commit/5434017))

# [1.1.0](https://github.com/CaoMeiYouRen/caomei-auth/compare/v1.0.0...v1.1.0) (2025-07-26)


### ♻ 代码重构

* **admin:** 重构应用列表加载逻辑，优化刷新处理函数 ([4f9acf9](https://github.com/CaoMeiYouRen/caomei-auth/commit/4f9acf9))
* **auth:** 优化权限检查逻辑，简化代码结构 ([813de65](https://github.com/CaoMeiYouRen/caomei-auth/commit/813de65))
* **auth:** 移除未使用的变量和注释，优化代码结构 ([3a48a74](https://github.com/CaoMeiYouRen/caomei-auth/commit/3a48a74))
* **db:** 提取实体数组为常量以简化数据源配置 ([4878fd7](https://github.com/CaoMeiYouRen/caomei-auth/commit/4878fd7))
* **entities:** 移除不必要的 @JoinColumn 装饰器，简化实体关系定义 ([06e26c3](https://github.com/CaoMeiYouRen/caomei-auth/commit/06e26c3))
* **profile:** 修改个人中心为个人资料，优化登出确认弹窗逻辑 ([a1a7324](https://github.com/CaoMeiYouRen/caomei-auth/commit/a1a7324))
* **session:** 注释掉模拟管理员的多对一关系定义，简化代码 ([8ba87f3](https://github.com/CaoMeiYouRen/caomei-auth/commit/8ba87f3))


### ✨ 新功能

* **admin:** 优化用户管理功能，增强角色设置和批量操作确认提示 ([f24faf8](https://github.com/CaoMeiYouRen/caomei-auth/commit/f24faf8))
* **admin:** 新增用户管理页面和用户代理解析功能 ([00d31fd](https://github.com/CaoMeiYouRen/caomei-auth/commit/00d31fd))
* **admin:** 更新手机号验证状态显示，增加手机号信息展示 ([8af6e2e](https://github.com/CaoMeiYouRen/caomei-auth/commit/8af6e2e))
* **admin:** 更新用户验证状态显示，增加手机验证标签和样式优化 ([a7a4343](https://github.com/CaoMeiYouRen/caomei-auth/commit/a7a4343))
* **admin:** 添加应用搜索和筛选功能，优化应用列表展示 ([7f55197](https://github.com/CaoMeiYouRen/caomei-auth/commit/7f55197))
* **admin:** 添加管理后台按钮，优化用户界面导航 ([b8da132](https://github.com/CaoMeiYouRen/caomei-auth/commit/b8da132))
* **admin:** 移除用户编辑功能，添加管理员角色禁用和删除提示 ([c934991](https://github.com/CaoMeiYouRen/caomei-auth/commit/c934991))
* **apple:** 添加 Apple 登录支持，更新环境变量和文档 ([e75652c](https://github.com/CaoMeiYouRen/caomei-auth/commit/e75652c))
* **auth:** 优化双因素认证界面，添加多种验证方式支持 ([8e943f8](https://github.com/CaoMeiYouRen/caomei-auth/commit/8e943f8))
* **auth:** 更新作用域支持，简化用户信息声明逻辑 ([a73db47](https://github.com/CaoMeiYouRen/caomei-auth/commit/a73db47))
* **auth:** 更新微信和抖音配置，调整环境变量名称 ([447dca2](https://github.com/CaoMeiYouRen/caomei-auth/commit/447dca2))
* **auth:** 更新抖音图标和提示信息，调整字体文件路径 ([7e578e3](https://github.com/CaoMeiYouRen/caomei-auth/commit/7e578e3))
* **auth:** 更新环境变量和生成器函数 ([5b1d07f](https://github.com/CaoMeiYouRen/caomei-auth/commit/5b1d07f))
* **auth:** 添加OAuth2相关路由限流配置，优化应用信息获取逻辑，重构授权中间件 ([6f10997](https://github.com/CaoMeiYouRen/caomei-auth/commit/6f10997))
* **auth:** 添加OAuth相关实体以支持OAuth2认证 ([951a1b8](https://github.com/CaoMeiYouRen/caomei-auth/commit/951a1b8))
* **auth:** 添加OIDC提供者支持，更新认证配置以包含OIDC插件 ([1bfad8e](https://github.com/CaoMeiYouRen/caomei-auth/commit/1bfad8e))
* **auth:** 添加两因素认证支持，更新环境变量配置，优化安全页面 ([20b5979](https://github.com/CaoMeiYouRen/caomei-auth/commit/20b5979))
* **auth:** 添加双因素认证对话框和验证逻辑 ([267f3be](https://github.com/CaoMeiYouRen/caomei-auth/commit/267f3be))
* **auth:** 添加微信登录支持，更新环境变量和文档 ([d7c76db](https://github.com/CaoMeiYouRen/caomei-auth/commit/d7c76db))
* **auth:** 添加抖音登录支持，更新环境变量和文档 ([d257db1](https://github.com/CaoMeiYouRen/caomei-auth/commit/d257db1))
* **auth:** 添加自定义作用域支持，优化用户信息声明逻辑; 增强 OAuth 授权请求调试信息，优化白名单路径处理 ([77443c0](https://github.com/CaoMeiYouRen/caomei-auth/commit/77443c0))
* **auth:** 调整验证码有效期为30秒，并更新邮件内容提示；优化发送短信验证码的参数 ([0f68fbd](https://github.com/CaoMeiYouRen/caomei-auth/commit/0f68fbd))
* **database:** 添加数据库关系优化文档及实体关系定义 ([7c213d7](https://github.com/CaoMeiYouRen/caomei-auth/commit/7c213d7))
* **footer:** 新增应用页脚组件，整合版权和链接信息 ([26d2ad2](https://github.com/CaoMeiYouRen/caomei-auth/commit/26d2ad2))
* **oauth:** 优化授权应用加载逻辑，使用 useFetch 替代传统方法 ([3095a83](https://github.com/CaoMeiYouRen/caomei-auth/commit/3095a83))
* **oauth:** 增强应用创建表单，添加字段验证和提示信息 ([cf882cd](https://github.com/CaoMeiYouRen/caomei-auth/commit/cf882cd))
* **oauth:** 强制更新应用列表响应式数据，优化应用创建逻辑 ([b1368f1](https://github.com/CaoMeiYouRen/caomei-auth/commit/b1368f1))
* **oauth:** 扩展OAuth应用实体字段 ([108e645](https://github.com/CaoMeiYouRen/caomei-auth/commit/108e645))
* **oauth:** 更新应用管理接口，支持编辑应用描述和其他字段，优化重定向URI验证 ([7da1087](https://github.com/CaoMeiYouRen/caomei-auth/commit/7da1087))
* **oauth:** 更新应用编辑和删除逻辑，增强错误处理 ([2669b2b](https://github.com/CaoMeiYouRen/caomei-auth/commit/2669b2b))
* **oauth:** 添加 OAuth 应用管理和详情接口，优化管理员权限检查 ([ae4f6e9](https://github.com/CaoMeiYouRen/caomei-auth/commit/ae4f6e9))
* **oauth:** 添加OAuth2应用管理和授权页面，更新相关API处理逻辑 ([27834fd](https://github.com/CaoMeiYouRen/caomei-auth/commit/27834fd))
* **oauth:** 添加加载和错误状态处理，优化同意页面用户体验 ([6122b66](https://github.com/CaoMeiYouRen/caomei-auth/commit/6122b66))
* **oauth:** 添加动态生成客户端 ID 和密钥的功能 ([dc335f6](https://github.com/CaoMeiYouRen/caomei-auth/commit/dc335f6))
* **oauth:** 添加应用描述字段，支持动态客户端注册，优化应用创建和获取逻辑 ([ba67af9](https://github.com/CaoMeiYouRen/caomei-auth/commit/ba67af9))
* **oauth:** 添加应用管理的增删改查接口，重构权限检查逻辑 ([ccef7b8](https://github.com/CaoMeiYouRen/caomei-auth/commit/ccef7b8))
* **oauth:** 添加授权应用管理页面及相关API支持 ([5ca065d](https://github.com/CaoMeiYouRen/caomei-auth/commit/5ca065d))
* **oauth:** 添加服务条款和隐私政策链接，优化法律信息展示 ([8d4d941](https://github.com/CaoMeiYouRen/caomei-auth/commit/8d4d941))
* **oauth:** 添加返回个人中心按钮，调整按钮样式和布局 ([3c59d8b](https://github.com/CaoMeiYouRen/caomei-auth/commit/3c59d8b))
* **oauth:** 简化授权成功提示逻辑，优化用户反馈体验 ([ca78e9f](https://github.com/CaoMeiYouRen/caomei-auth/commit/ca78e9f))
* **profile:** 添加返回个人中心按钮，调整个人资料页面布局 ([0868d78](https://github.com/CaoMeiYouRen/caomei-auth/commit/0868d78))
* **security:** 添加双因素认证功能，优化安全页面和相关逻辑 ([7986c6e](https://github.com/CaoMeiYouRen/caomei-auth/commit/7986c6e))
* **social:** 为社交登录提供者添加颜色属性，优化按钮样式 ([1c567ac](https://github.com/CaoMeiYouRen/caomei-auth/commit/1c567ac))
* **social:** 添加社交登录提供商启用状态，优化登录和绑定逻辑 ([3dbbb7b](https://github.com/CaoMeiYouRen/caomei-auth/commit/3dbbb7b))
* **twitter:** 添加 Twitter 登录支持，更新环境变量和文档 ([e4829ee](https://github.com/CaoMeiYouRen/caomei-auth/commit/e4829ee))


### 🐛 Bug 修复

* **admin:** 修正禁用到期时间格式化逻辑，移除不必要的乘法运算 ([b184870](https://github.com/CaoMeiYouRen/caomei-auth/commit/b184870))
* **auth:** 更新 Apple 和微信登录配置，调整相关注释 ([65f97c7](https://github.com/CaoMeiYouRen/caomei-auth/commit/65f97c7))
* **env:** 修正机器ID在客户端环境下的默认值 ([fe3ad0b](https://github.com/CaoMeiYouRen/caomei-auth/commit/fe3ad0b))
* **login:** 添加社交登录提示，改善用户体验 ([180e030](https://github.com/CaoMeiYouRen/caomei-auth/commit/180e030))
* **phone:** 修正验证码有效时间参数描述，确保默认值为秒并正确计算分钟 ([45ed15d](https://github.com/CaoMeiYouRen/caomei-auth/commit/45ed15d)), closes [#6](https://github.com/CaoMeiYouRen/caomei-auth/issues/6)

# 1.0.0 (2025-07-19)


### ♻ 代码重构

* **auth:** 迁移电话功能开关到运行时配置 ([3e1ccd6](https://github.com/CaoMeiYouRen/caomei-auth/commit/3e1ccd6))
* **auth:** 重构环境变量配置 ([d647543](https://github.com/CaoMeiYouRen/caomei-auth/commit/d647543))
* **components:** 移除未使用的 vue 导入 ([871b8d0](https://github.com/CaoMeiYouRen/caomei-auth/commit/871b8d0))
* **config:** 将环境变量前缀从VITE改为NUXT_PUBLIC ([b54520d](https://github.com/CaoMeiYouRen/caomei-auth/commit/b54520d))
* **config:** 移除社交登录配置项 ([6f5b8c3](https://github.com/CaoMeiYouRen/caomei-auth/commit/6f5b8c3))
* **config:** 迁移环境变量到运行时配置 ([e8c1ca1](https://github.com/CaoMeiYouRen/caomei-auth/commit/e8c1ca1))
* **entities:** 使用自定义装饰器重构实体类字段定义 ([60bd6a3](https://github.com/CaoMeiYouRen/caomei-auth/commit/60bd6a3))
* **env:** 统一环境变量配置，简化代码结构 ([83c04e8](https://github.com/CaoMeiYouRen/caomei-auth/commit/83c04e8))
* **forgot-password:** 重构忘记密码页面逻辑 ([99db724](https://github.com/CaoMeiYouRen/caomei-auth/commit/99db724))
* **forgot-password:** 重构找回密码页面模式切换逻辑 ([7933ec3](https://github.com/CaoMeiYouRen/caomei-auth/commit/7933ec3))
* **layout:** 调整底部链接布局和样式 ([08426bd](https://github.com/CaoMeiYouRen/caomei-auth/commit/08426bd))
* **login:** 重构登录页面状态管理 ([a8108d3](https://github.com/CaoMeiYouRen/caomei-auth/commit/a8108d3))
* **profile:** 优化用户信息获取逻辑 ([a3462d9](https://github.com/CaoMeiYouRen/caomei-auth/commit/a3462d9))
* **profile:** 重构用户资料表单数据绑定方式 ([761af79](https://github.com/CaoMeiYouRen/caomei-auth/commit/761af79))
* **register:** 清理注册页面冗余注释 ([dadeae6](https://github.com/CaoMeiYouRen/caomei-auth/commit/dadeae6))
* **register:** 重构注册页面表单切换逻辑 ([2614db1](https://github.com/CaoMeiYouRen/caomei-auth/commit/2614db1))
* **register:** 重构注册页面逻辑和状态管理 ([ed09e5a](https://github.com/CaoMeiYouRen/caomei-auth/commit/ed09e5a))
* **snowflake:** 优化雪花算法机器ID生成方式 ([b4790dc](https://github.com/CaoMeiYouRen/caomei-auth/commit/b4790dc))


### ✨ 新功能

* **assets:** 新增iconfont字体图标资源 ([fb50a98](https://github.com/CaoMeiYouRen/caomei-auth/commit/fb50a98))
* **auth:** 为登录、注册和忘记密码页面添加模式参数传递 ([25bce0a](https://github.com/CaoMeiYouRen/caomei-auth/commit/25bce0a))
* **auth:** 优化认证模块的限流配置 ([132db51](https://github.com/CaoMeiYouRen/caomei-auth/commit/132db51))
* **auth:** 优化认证模块配置和限流逻辑 ([9996cbc](https://github.com/CaoMeiYouRen/caomei-auth/commit/9996cbc))
* **auth:** 增加验证码全局限流功能；重构存储模块实现 ([4022cac](https://github.com/CaoMeiYouRen/caomei-auth/commit/4022cac))
* **auth:** 增强认证模块功能 ([ef20b10](https://github.com/CaoMeiYouRen/caomei-auth/commit/ef20b10))
* **auth:** 增强认证模块功能并优化验证逻辑 ([74534b3](https://github.com/CaoMeiYouRen/caomei-auth/commit/74534b3))
* **auth:** 新增 Discord 登录支持 ([c2beb36](https://github.com/CaoMeiYouRen/caomei-auth/commit/c2beb36))
* **auth:** 新增会话存储配置选项 ([27babce](https://github.com/CaoMeiYouRen/caomei-auth/commit/27babce))
* **auth:** 新增修改密码功能页面 ([f5d4508](https://github.com/CaoMeiYouRen/caomei-auth/commit/f5d4508))
* **auth:** 新增全局认证中间件和公共路径配置 ([c92561b](https://github.com/CaoMeiYouRen/caomei-auth/commit/c92561b))
* **auth:** 新增匿名登录功能并优化用户界面 ([f600c4d](https://github.com/CaoMeiYouRen/caomei-auth/commit/f600c4d))
* **auth:** 添加 Microsoft 登录支持; 添加手机号国际化格式化功能 ([26e4353](https://github.com/CaoMeiYouRen/caomei-auth/commit/26e4353))
* **auth:** 添加API认证中间件例外规则 ([c636a56](https://github.com/CaoMeiYouRen/caomei-auth/commit/c636a56))
* **auth:** 添加Microsoft登录支持和多项认证优化 ([36b3ce3](https://github.com/CaoMeiYouRen/caomei-auth/commit/36b3ce3))
* **auth:** 添加QQ登录tokenUrlParams参数支持 ([72beef7](https://github.com/CaoMeiYouRen/caomei-auth/commit/72beef7))
* **auth:** 添加QQ登录unionID支持 ([bb5af4d](https://github.com/CaoMeiYouRen/caomei-auth/commit/bb5af4d))
* **auth:** 添加QQ登录支持 ([9651086](https://github.com/CaoMeiYouRen/caomei-auth/commit/9651086))
* **auth:** 添加会话cookie缓存配置 ([1723d30](https://github.com/CaoMeiYouRen/caomei-auth/commit/1723d30))
* **auth:** 添加完整的认证系统实现 ([fa57c78](https://github.com/CaoMeiYouRen/caomei-auth/commit/fa57c78))
* **auth:** 添加密码强度验证功能 ([9c73693](https://github.com/CaoMeiYouRen/caomei-auth/commit/9c73693))
* **auth:** 添加微博OAuth2登录支持 ([e2067c8](https://github.com/CaoMeiYouRen/caomei-auth/commit/e2067c8))
* **auth:** 添加微博OAuth2重定向URI支持和开发环境配置 ([930c89a](https://github.com/CaoMeiYouRen/caomei-auth/commit/930c89a))
* **auth:** 添加手机号密码重置功能 ([8dd407f](https://github.com/CaoMeiYouRen/caomei-auth/commit/8dd407f))
* **auth:** 添加社交登录功能支持 ([32e2386](https://github.com/CaoMeiYouRen/caomei-auth/commit/32e2386))
* **auth:** 添加社交登录配置和通用登录方法 ([0c8edc9](https://github.com/CaoMeiYouRen/caomei-auth/commit/0c8edc9))
* **auth:** 添加账户关联功能支持 ([2792c56](https://github.com/CaoMeiYouRen/caomei-auth/commit/2792c56))
* **auth:** 迁移环境变量配置并优化文件上传功能 ([c2916aa](https://github.com/CaoMeiYouRen/caomei-auth/commit/c2916aa))
* **auth:** 重构社交登录提供者获取方式并添加API请求频率限制 ([6613657](https://github.com/CaoMeiYouRen/caomei-auth/commit/6613657))
* **change-password:** 为密码修改页面添加工具提示 ([806e726](https://github.com/CaoMeiYouRen/caomei-auth/commit/806e726))
* **database:** 新增PostgreSQL和SQLite数据库表结构 ([cd1ff3d](https://github.com/CaoMeiYouRen/caomei-auth/commit/cd1ff3d))
* **database:** 添加数据库类型支持优化 ([ef090d8](https://github.com/CaoMeiYouRen/caomei-auth/commit/ef090d8))
* **database:** 添加数据库迁移配置和初始化脚本 ([321afb1](https://github.com/CaoMeiYouRen/caomei-auth/commit/321afb1))
* **database:** 重构数据库连接和存储系统 ([7fc46c8](https://github.com/CaoMeiYouRen/caomei-auth/commit/7fc46c8))
* **decorators:** 新增装饰器工具函数和自定义列装饰器 ([03e9a2a](https://github.com/CaoMeiYouRen/caomei-auth/commit/03e9a2a))
* **env:** 添加短信功能启用状态的环境变量支持 ([6d3d909](https://github.com/CaoMeiYouRen/caomei-auth/commit/6d3d909))
* **env:** 添加联系邮箱配置 ([484b508](https://github.com/CaoMeiYouRen/caomei-auth/commit/484b508))
* **file:** 添加上传文件用户级限制 ([8f0fb28](https://github.com/CaoMeiYouRen/caomei-auth/commit/8f0fb28))
* **forgot-password:** 为表单字段添加工具提示说明 ([5a5a85f](https://github.com/CaoMeiYouRen/caomei-auth/commit/5a5a85f))
* **layout:** 添加备案号显示并优化页脚链接 ([0b36b3d](https://github.com/CaoMeiYouRen/caomei-auth/commit/0b36b3d))
* **login:** 优化社交登录提示信息并添加登出功能 ([1fb65a4](https://github.com/CaoMeiYouRen/caomei-auth/commit/1fb65a4))
* **login:** 新增匿名登录功能 ([2147bf0](https://github.com/CaoMeiYouRen/caomei-auth/commit/2147bf0))
* **login:** 重构登录页面逻辑并添加认证客户端集成 ([ca59893](https://github.com/CaoMeiYouRen/caomei-auth/commit/ca59893))
* **pages:** 新增隐私政策和服务条款页面 ([57dfe04](https://github.com/CaoMeiYouRen/caomei-auth/commit/57dfe04))
* **phone-input:** 新增手机号输入组件 ([cc9cf72](https://github.com/CaoMeiYouRen/caomei-auth/commit/cc9cf72))
* **phone:** 新增手机号区域代码自动获取功能 ([c6817a6](https://github.com/CaoMeiYouRen/caomei-auth/commit/c6817a6))
* **phone:** 新增短信验证码发送功能 ([632701b](https://github.com/CaoMeiYouRen/caomei-auth/commit/632701b))
* **phone:** 添加短信功能支持 ([94ca25d](https://github.com/CaoMeiYouRen/caomei-auth/commit/94ca25d))
* **profile:** 优化用户个人资料页面的交互提示 ([1c62121](https://github.com/CaoMeiYouRen/caomei-auth/commit/1c62121))
* **profile:** 优化用户名设置交互 ([8aee7f5](https://github.com/CaoMeiYouRen/caomei-auth/commit/8aee7f5))
* **profile:** 优化用户头像组件功能 ([237b1a1](https://github.com/CaoMeiYouRen/caomei-auth/commit/237b1a1))
* **profile:** 优化用户资料页面提示信息 ([6a1f25b](https://github.com/CaoMeiYouRen/caomei-auth/commit/6a1f25b))
* **profile:** 优化第三方账号绑定界面和功能 ([cf64e31](https://github.com/CaoMeiYouRen/caomei-auth/commit/cf64e31))
* **profile:** 优化邮箱验证状态显示逻辑 ([c091302](https://github.com/CaoMeiYouRen/caomei-auth/commit/c091302))
* **profile:** 完善个人中心页面功能 ([f4b12e1](https://github.com/CaoMeiYouRen/caomei-auth/commit/f4b12e1))
* **profile:** 完善用户资料绑定功能 ([bdaabac](https://github.com/CaoMeiYouRen/caomei-auth/commit/bdaabac))
* **profile:** 添加取消按钮的严重性属性 ([6bbb532](https://github.com/CaoMeiYouRen/caomei-auth/commit/6bbb532))
* **profile:** 添加头像上传功能 ([1b3b54a](https://github.com/CaoMeiYouRen/caomei-auth/commit/1b3b54a))
* **profile:** 添加头像上传功能 ([ae2b650](https://github.com/CaoMeiYouRen/caomei-auth/commit/ae2b650))
* **profile:** 添加昵称验证功能 ([012f506](https://github.com/CaoMeiYouRen/caomei-auth/commit/012f506))
* **profile:** 添加用户ID显示和样式优化 ([4ffd352](https://github.com/CaoMeiYouRen/caomei-auth/commit/4ffd352))
* **profile:** 添加用户名设置功能 ([2e38c54](https://github.com/CaoMeiYouRen/caomei-auth/commit/2e38c54))
* **profile:** 添加第三方账号解绑确认对话框和工具提示 ([c78be99](https://github.com/CaoMeiYouRen/caomei-auth/commit/c78be99))
* **register:** 为表单字段添加提示文本 ([2250fc7](https://github.com/CaoMeiYouRen/caomei-auth/commit/2250fc7))
* **register:** 使用Message组件替换错误提示 ([084bbab](https://github.com/CaoMeiYouRen/caomei-auth/commit/084bbab))
* **register:** 添加邮箱和手机号双模式注册功能 ([7900c18](https://github.com/CaoMeiYouRen/caomei-auth/commit/7900c18))
* **register:** 重构注册页面表单验证逻辑 ([762655f](https://github.com/CaoMeiYouRen/caomei-auth/commit/762655f))
* **register:** 重构注册页面逻辑并添加新功能 ([08a460c](https://github.com/CaoMeiYouRen/caomei-auth/commit/08a460c))
* **security:** 增强会话管理界面功能 ([e336f69](https://github.com/CaoMeiYouRen/caomei-auth/commit/e336f69))
* **security:** 新增会话管理功能 ([be06a25](https://github.com/CaoMeiYouRen/caomei-auth/commit/be06a25))
* **security:** 添加会话撤销确认对话框功能 ([b838a5f](https://github.com/CaoMeiYouRen/caomei-auth/commit/b838a5f))
* **storage:** 新增文件存储功能支持S3和Vercel Blob ([c2c2019](https://github.com/CaoMeiYouRen/caomei-auth/commit/c2c2019))
* **verification:** 增加单用户验证码发送限制 ([073c7e1](https://github.com/CaoMeiYouRen/caomei-auth/commit/073c7e1))
* 优化 SendCodeButton 组件，调整按钮样式和重置逻辑，提升用户体验 ([9280d95](https://github.com/CaoMeiYouRen/caomei-auth/commit/9280d95))
* 优化登录按钮样式 ([d99c8a5](https://github.com/CaoMeiYouRen/caomei-auth/commit/d99c8a5))
* 优化登录按钮组样式，使用 ButtonGroup 组件，添加图标支持 ([474aaec](https://github.com/CaoMeiYouRen/caomei-auth/commit/474aaec))
* 优化登录验证逻辑，添加密码验证，调整样式 ([dcf28c3](https://github.com/CaoMeiYouRen/caomei-auth/commit/dcf28c3))
* 优化默认布局，调整页脚内容和链接，提升可读性和用户体验 ([8d5c8ce](https://github.com/CaoMeiYouRen/caomei-auth/commit/8d5c8ce))
* 在个人中心和账号安全设置页面添加导航按钮，提升用户体验 ([8a54de2](https://github.com/CaoMeiYouRen/caomei-auth/commit/8a54de2))
* 在主页面添加 Toast 组件，优化用户体验 ([0ceed2b](https://github.com/CaoMeiYouRen/caomei-auth/commit/0ceed2b))
* 在登录页面添加“忘记密码？”链接，方便用户重置密码 ([3e8087c](https://github.com/CaoMeiYouRen/caomei-auth/commit/3e8087c))
* 更新 Nuxt 配置，修改 PrimeVue 主题为 Lara，调整图标为 Material Design Icons ([2158eb9](https://github.com/CaoMeiYouRen/caomei-auth/commit/2158eb9))
* 更新登录页面样式，确保容器高度为100vh，优化布局 ([81d38d8](https://github.com/CaoMeiYouRen/caomei-auth/commit/81d38d8))
* 更新记住我复选框，添加二进制模式支持 ([2e0ca56](https://github.com/CaoMeiYouRen/caomei-auth/commit/2e0ca56))
* 更新页面样式，统一背景色，提升视觉一致性 ([512b498](https://github.com/CaoMeiYouRen/caomei-auth/commit/512b498))
* 添加 AuthLeft 组件，重构多个页面以统一登录界面样式和结构 ([89108e7](https://github.com/CaoMeiYouRen/caomei-auth/commit/89108e7))
* 添加 normalize.css 以统一样式，注释掉登录页面最小高度 ([97c18f4](https://github.com/CaoMeiYouRen/caomei-auth/commit/97c18f4))
* 添加 PrimeVue Toast 主题自定义样式，提升用户通知体验 ([43fd7d4](https://github.com/CaoMeiYouRen/caomei-auth/commit/43fd7d4))
* 添加 PrimeVue 组件和主题支持，更新 Nuxt 配置 ([abe11ab](https://github.com/CaoMeiYouRen/caomei-auth/commit/abe11ab))
* 添加 SendCodeButton 组件，简化验证码发送逻辑，提升用户体验 ([bfbd219](https://github.com/CaoMeiYouRen/caomei-auth/commit/bfbd219))
* 添加个人中心页面，支持用户信息管理和邮箱、手机号绑定功能 ([43be25a](https://github.com/CaoMeiYouRen/caomei-auth/commit/43be25a))
* 添加主题色变量，优化样式文件结构 ([c377007](https://github.com/CaoMeiYouRen/caomei-auth/commit/c377007))
* 添加注册页面，支持用户信息填写和验证功能 ([3ca5500](https://github.com/CaoMeiYouRen/caomei-auth/commit/3ca5500))
* 添加登录页面，支持用户名、邮箱和手机号登录，集成社交登录功能 ([bf83f44](https://github.com/CaoMeiYouRen/caomei-auth/commit/bf83f44))
* 添加登录页面和主题色配置，集成 PrimeVue 主题色调色板 ([db8bc38](https://github.com/CaoMeiYouRen/caomei-auth/commit/db8bc38))
* 添加账号安全设置页面，支持多因子认证、登录日志和设备管理功能 ([f4b6f8d](https://github.com/CaoMeiYouRen/caomei-auth/commit/f4b6f8d))
* 添加邮箱和手机号验证码登录功能，优化登录表单验证逻辑 ([c0cbeb8](https://github.com/CaoMeiYouRen/caomei-auth/commit/c0cbeb8))
* 添加错误消息样式，调整错误色变量，提升表单反馈效果 ([6410b27](https://github.com/CaoMeiYouRen/caomei-auth/commit/6410b27))
* 添加错误页面组件，提供统一的错误信息展示和用户操作选项 ([cffd2e4](https://github.com/CaoMeiYouRen/caomei-auth/commit/cffd2e4))
* 添加验证码验证页面，支持邮箱和手机号的验证码发送与验证功能 ([c34d839](https://github.com/CaoMeiYouRen/caomei-auth/commit/c34d839))
* 移除登录表单，简化登录演示页面，调整按钮功能 ([3ea525e](https://github.com/CaoMeiYouRen/caomei-auth/commit/3ea525e))
* 重构布局，添加默认布局组件，优化页面结构和样式 ([ce8cd80](https://github.com/CaoMeiYouRen/caomei-auth/commit/ce8cd80))
* 重构认证相关页面，统一样式和结构，提升代码可维护性 ([3a9361e](https://github.com/CaoMeiYouRen/caomei-auth/commit/3a9361e))
* 重构验证码发送逻辑，提取通用验证函数，优化代码结构 ([9884938](https://github.com/CaoMeiYouRen/caomei-auth/commit/9884938))


### 🐛 Bug 修复

* **auth:** 优化临时邮箱生成逻辑 ([e15a9c2](https://github.com/CaoMeiYouRen/caomei-auth/commit/e15a9c2))
* **auth:** 优化会话处理逻辑并修复用户数据获取问题 ([36e280c](https://github.com/CaoMeiYouRen/caomei-auth/commit/36e280c))
* **auth:** 优化认证配置和用户界面显示 ([7543c52](https://github.com/CaoMeiYouRen/caomei-auth/commit/7543c52))
* **auth:** 修正微博登录图标引用及第三方登录绑定逻辑 ([f5e3c69](https://github.com/CaoMeiYouRen/caomei-auth/commit/f5e3c69))
* **auth:** 更新认证配置和环境变量 ([c9d650e](https://github.com/CaoMeiYouRen/caomei-auth/commit/c9d650e))
* **auth:** 添加认证配置选项 ([adf87b2](https://github.com/CaoMeiYouRen/caomei-auth/commit/adf87b2))
* **auth:** 移除调试日志并调整账号ID显示长度 ([9e2900f](https://github.com/CaoMeiYouRen/caomei-auth/commit/9e2900f))
* **auth:** 统一错误提示显示时间 ([2e9fb65](https://github.com/CaoMeiYouRen/caomei-auth/commit/2e9fb65))
* **config:** 更新电话功能启用状态的环境变量处理逻辑 ([bdca663](https://github.com/CaoMeiYouRen/caomei-auth/commit/bdca663))
* **config:** 迁移环境变量到Vite配置 ([422c6e4](https://github.com/CaoMeiYouRen/caomei-auth/commit/422c6e4))
* **env:** 更新环境变量示例文件 ([5f48e61](https://github.com/CaoMeiYouRen/caomei-auth/commit/5f48e61))
* **env:** 更新环境变量配置和类型定义 ([e30f066](https://github.com/CaoMeiYouRen/caomei-auth/commit/e30f066))
* **layout:** 修复主页链接和登录页条件渲染问题 ([264383a](https://github.com/CaoMeiYouRen/caomei-auth/commit/264383a))
* **login:** 修复社交登录按钮样式问题 ([53e1095](https://github.com/CaoMeiYouRen/caomei-auth/commit/53e1095))
* **login:** 添加移动端响应式样式 ([c43de35](https://github.com/CaoMeiYouRen/caomei-auth/commit/c43de35))
* **profile:** 优化社交登录提供者获取方式 ([9d234a3](https://github.com/CaoMeiYouRen/caomei-auth/commit/9d234a3))
* **profile:** 修复用户名显示问题 ([765e4aa](https://github.com/CaoMeiYouRen/caomei-auth/commit/765e4aa))
* **profile:** 修复用户资料相关问题和代码格式 ([8022373](https://github.com/CaoMeiYouRen/caomei-auth/commit/8022373))
* **profile:** 调整错误提示显示时间和样式优化 ([579e8ff](https://github.com/CaoMeiYouRen/caomei-auth/commit/579e8ff))
* **storage:** 修正S3客户端端点配置问题 ([d132a74](https://github.com/CaoMeiYouRen/caomei-auth/commit/d132a74))
* **validate:** 优化验证工具导入方式 ([8659209](https://github.com/CaoMeiYouRen/caomei-auth/commit/8659209))
* 修复 Toast 组件层级错误 ([f6d1755](https://github.com/CaoMeiYouRen/caomei-auth/commit/f6d1755))
* 更新 Nuxt 配置，设置应用标题和语言属性，移除无用的 favicon 文件 ([44e105d](https://github.com/CaoMeiYouRen/caomei-auth/commit/44e105d))
