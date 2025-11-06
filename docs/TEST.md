## 当前测试现状

-   现有一份端到端测试：`tests/e2e/api-index.nuxt.spec.ts`，已覆盖 `/api` 健康检查并默认参与运行。
-   未发现任何 `tests/unit`、`tests/integration` 等目录的实现文件，意味着单元、组件、集成层面完全空缺。
-   当前测试脚本通过 `pnpm test` 执行 `vitest run`，但由于测试资产缺失，命令始终以 0 用例结束，容易产生“假绿”。

### 测试工具链能力

-   `vitest.config.ts` 默认运行在 Nuxt 环境，并通过 `tests/setup/vitest.setup.ts` 注入统一的 Mock 及时区设置；后续可基于既定目录拆分出 unit/nuxt 项目。
-   依赖中已包含 `@vue/test-utils`、`happy-dom`、`playwright-core` 等，可分别支撑组件单测和端到端测试；无需额外安装即可落地。
-   E2E 模板使用 `@nuxt/test-utils/e2e`，借助内存 SQLite (`DATABASE_PATH=':memory:'`) 与环境变量，具备跑通基础后台 API 的条件。

## 风险评估与优先级

1. **认证与安全链路缺乏验证**：`server/api/auth/[...all].ts` 直接暴露 better-auth handler，未做任何黑盒验证；若配置变更或回归 bug，将无法提前发现。
2. **核心工具函数无人兜底**：`utils/validate.ts`、`utils/privacy.ts`、`utils/password-validator.ts`、`utils/password.ts` 等承担输入校验与脱敏逻辑，对生产安全影响大，必须优先补齐单测。
3. **短信/邮件验证码流程复杂**：`utils/code.ts` 依赖外部客户端与验证码，通过率受限于多个分支，现状无测试覆盖。
4. **管理后台与 OAuth API 面向第三方集成，环境故障风险高**：`server/api/admin/*`、`server/api/oauth/*` 缺少最小集成验证。
5. **前端交互与组件回归风险**：如 `components/phone-input.vue`、`components/send-code-button.vue` 涉及格式化、倒计时与状态切换，回归成本大；建议中优先。

## 分阶段建设路线图

### 阶段 P0（1-2 天）：测试基础设施

-   [x] 取消 `describe.skip`，并为 `tests/e2e/api-index.nuxt.spec.ts` 引入固定断言，验证 `/api` 健康度。
-   [x] 新建 `tests/setup/vitest.setup.ts`，统一初始化测试依赖（含 logger Mock），并在 `vitest.config.ts` 中通过 `setupFiles` 引入。
-   [x] 约定并创建基础目录结构：
    -   `tests/unit/utils/**`
    -   `tests/unit/server/**`
    -   `tests/unit/components/**`
    -   `tests/integration/api/**`
    -   `tests/e2e/pages/**`
-   [x] 为数据库相关集成测试封装 `tests/fixtures/database.ts`，利用 TypeORM + SQLite 内存库建表、清表。

### 阶段 P1（3-4 天）：核心工具函数单测

-   `utils/validate.ts`
    -   `validateEmail`：有效邮箱（含 UTF-8 本地部分）、无 TLD、IP 域名、含下划线等负例。
    -   `validatePhone`：`+8613812345678`、`+12025550123` 正例；缺少国家码、不符合规则的负例；自定义 locale。
    -   `validateUrl`：必须带协议、禁止 IP、末尾点的负例；开发域名（无 TLD）正例。
    -   `validateUsername` 与 `usernameValidator`：长度边界、邮箱/手机号伪装、禁止字符测试。
    -   `nicknameValidator`：控制字符（`\u0008`）、空格、过短/过长场景。
-   `utils/privacy.ts`
    -   `maskEmail`：短用户名、包含特殊字符的域名、异常输入（非字符串）。
    -   `maskPhone`：E.164 与本地格式、异常号码、`getRegionCodeForPhoneNumber` 的容错（捕获 warning 分支）。
    -   `maskUserId`、`maskUsername`、`maskIP`：长度边界、IPv6 缩写、无效 IP。
-   `utils/password.ts` 与 `utils/password-validator.ts`
    -   `passwordValidator`：强度枚举、`returnScore` 分支及自定义配置覆盖。
    -   `getPasswordStrength`、`getPasswordScore`、`getPasswordRequirements*`：不同预设、环境变量影响。
    -   `validatePassword`、`validatePasswordForm`：确认密码不一致、强度不足、缺少当前密码等。

### 阶段 P2（4-5 天）：Server 层与 API 集成

-   单测
    -   `server/utils/random.ts`：长度、字符集、随机性（统计分布）。
    -   `server/utils/rate-limit.ts`：通过 Stub `limiterStorage` 验证超限抛错；模拟不同 IP、路径组合。
    -   `server/utils/email-template`（若存在多个模板函数）：Mock `mjml` 渲染失败路径。
-   集成测试（使用内存 SQLite、`auth` stub）
    -   认证 API：
        -   `/api/auth/[...all]`：模拟登录（邮箱/手机号）、注册、`authClient` 错误分支。
        -   密码重置流程：校验 email / phone OTP 的发送与验证接口。
    -   OAuth API：
        -   `/api/oauth/consents.get`、`/api/oauth/revoke-consent.post`、`/api/oauth/[id].get`：覆盖授权列表、撤销、查询失败。
    -   管理后台 API：
        -   `/api/admin/users/*`：创建/更新/禁用用户。
        -   `/api/admin/oauth/applications/*`：CRUD 与秘钥轮换。
        -   `/api/admin/logs/stats.get`、`/sessions.get`：返回结构与分页。
    -   文件上传 `/api/file/upload.post`：验证 MIME、size 限制、鉴权失败。
-   需要的夹具
    -   `tests/fixtures/auth.ts`：基于 better-auth 提供虚拟用户/令牌。
    -   `tests/fixtures/storage.ts`：封装 Redis/Limiter mock，避免真实连接。

### 阶段 P3（4-5 天）：前端组件与页面

-   组件测试（`@vue/test-utils` + `happy-dom`）
    -   `components/phone-input.vue`：国家码选择、格式化展示、`validatePhone` 交互。
    -   `components/send-code-button.vue`：倒计时、禁用状态、`useSendEmailCode`/`useSendPhoneCode` 回调。
    -   `components/password-strength.vue`：不同强度颜色与提示文本。
    -   `components/demo-mode-dialog.vue`：对外事件、关闭逻辑。
-   页面级测试（`tests/nuxt` 或 `tests/e2e/pages`）
    -   `/login`：邮箱/手机号登录流程，验证码失败提示，`useDemoMode` 下的禁用状态。
    -   `/register`：表单验证、密码强度反馈、验证码发送拒绝。
    -   `/forgot-password`：流程跳转、成功提示。
    -   `/profile`、`/security`：需通过模拟已登录状态，验证数据拉取与错误流程。
    -   `/admin/users`、`/admin/oauth/clients`：基于 Mock API，验证表格渲染、筛选、操作按钮灰度。
-   建议对复杂表单使用 `@testing-library/vue`（与 `@vue/test-utils` 兼容），提升语义化断言。

### 阶段 P4（长期）：专项测试

-   性能：使用 Playwright Trace 或 Lighthouse CI 记录 `/login`、`/admin` 页面首屏指标。
-   安全：引入安全测试用例（SQL 注入、XSS、CSRF Token 丢失）模拟，重点验证服务端校验与前端过滤。
-   数据库：针对 `server/entities` 的 TypeORM Repository 编写集成测试，验证关系映射、级联删除。

## 详细测试设计

### 单元测试目录规划

```

├─ unit/
│  ├─ utils/
│  │  ├─ validate.spec.ts
│  │  ├─ privacy.spec.ts
│  │  ├─ password.spec.ts
│  │  └─ code.spec.ts
│  ├─ server/
│  │  ├─ rate-limit.spec.ts
│  │  └─ random.spec.ts
│  └─ components/
│     ├─ phone-input.spec.ts
│     └─ send-code-button.spec.ts
├─ integration/
│  └─ api/
│     ├─ auth.spec.ts
│     ├─ oauth.spec.ts
│     └─ admin-users.spec.ts
└─ e2e/
    ├─ api-index.nuxt.spec.ts
   └─ pages/
      ├─ login.spec.ts
      └─ register.spec.ts
```

### 关键用例补充说明

-   `utils/code.ts`
    -   Mock `authClient` 与 `resolveCaptchaToken`，覆盖验证码成功/失败、重复发送冷却逻辑，验证 `errors` 与 Toast 调用（可通过 spy）。
-   `utils/navigation.ts`（如存在条件重定向）：模拟不同 `navigateTo` 参数，验证返回值。
-   `server/middleware/auth.global.ts`：构造事件对象（带/不带 Session），断言重定向目标与状态码。
-   `server/api/index.ts`：Mock `fs.readJSON` 抛错路径，确认 logger 捕获。

### 测试夹具与 Mock 策略

-   已在 `tests/mocks/logger.ts` 中导出与生产 `logger` 同名对象（`info|error|warn|business`），集中断言日志输出。
-   借助 `vi.mock` 伪造第三方服务：
    -   `twilio`、`nodemailer`：返回固定消息 ID。
    -   `@aws-sdk/client-s3`、`@vercel/blob`：避免真实网络调用。
-   集成测试前后通过 `beforeAll/afterAll` 启动/关闭内存数据库；每个 `it` 使用事务或清表保障隔离。

### 覆盖率与质量门槛

-   目标：阶段 P2 结束后达到 **语句 70% / 分支 60% / 函数 70%**；阶段 P3 完成后提升到 **80%+**。
-   在 `vitest.config.ts` 的 `test.coverage` 中配置阈值与 `reporters: ['text', 'lcov']`，供 CI 与 Sonar 使用。

## CI 与持续集成建议

-   在 CI 流程中添加 `pnpm test --run` 与 `pnpm test:coverage`，若使用 GitHub Actions，可拆分为并行 Job（unit / integration / e2e）。
-   对 E2E Job 启用可选触发（仅在相关目录改动或手动 dispatch 时运行），降低耗时。
-   结合 `pnpm lint` 结果，阻断未覆盖的高风险改动。

## 后续迭代建议

1. 建立 `tests/README.md`，记录运行命令、夹具使用方法、常见问题。
2. 在 `docs/PLAN.md` 的“当前待办”中同步测试里程碑，便于团队跟踪。
3. 引入 `@playwright/test` 或 `@nuxt/test-utils/playwright`，在阶段 P3 之后扩展跨浏览器端到端测试。
4. 依据业务优先级持续回顾测试空白，例如多语言、Demo 模式、日志审计等模块。
