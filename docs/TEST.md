## 当前测试现状

-   现有一份端到端测试：`tests/e2e/api-index.nuxt.spec.ts`，已覆盖 `/api` 健康检查并默认参与运行。
-   未发现任何 `tests/unit`、`tests/integration` 等目录的实现文件，意味着单元、组件、集成层面完全空缺。
-   当前测试脚本通过 `pnpm test` 执行 `vitest run`，但由于测试资产缺失，命令始终以 0 用例结束，容易产生“假绿”。

### 测试工具链能力

-   `vitest.config.ts` 默认运行在 Nuxt 环境，并通过 `tests/setup/vitest.setup.ts` 注入统一的 Mock 及时区设置；后续可基于既定目录拆分出 unit/nuxt 项目。
-   依赖中已包含 `@vue/test-utils`、`happy-dom`、`playwright-core` 等，可分别支撑组件单测和端到端测试；无需额外安装即可落地。
-   E2E 模板使用 `@nuxt/test-utils/e2e`，借助内存 SQLite (`DATABASE_PATH=':memory:'`) 与环境变量，具备跑通基础后台 API 的条件。

## 测试失败与暂挂策略

-   同一个测试文件在 CI 或本地反复修复后依然累计出现 3 次及以上失败，即视为高风险用例，必须立刻暂挂：
    -   可通过移除文件、在入口使用 `describe.skip`/`it.skip` 或在 `vitest.config.ts` 中排除目录来阻断执行，确保不会持续拖慢主流程；
    -   暂挂操作完成后需要立刻在下方“暂挂测试记录”表格登记文件路径、失败次数、暂挂日期、责任人和待排查问题；
    -   暂挂的测试在下一轮测试规划或关联功能改动时优先拉起恢复，恢复后需要在同一记录中补充修复日期与方案；
    -   对暂挂用例的代码改动应附带说明，避免其他人误以为该模块已经具备测试覆盖。

### 暂挂测试记录

| 文件路径                                  | 失败次数 | 暂挂日期   | 责任人 | 问题描述 / 后续计划                                                                               |
| ----------------------------------------- | -------- | ---------- | ------ | ------------------------------------------------------------------------------------------------- |
| _示例：tests/unit/utils/validate.spec.ts_ | 3        | 2025-11-17 | QA     | `libphonenumber` 版本差异导致解析失败，等待依赖升级                                               |
| tests/unit/utils/navigation.spec.ts       | 4        | 2025-11-17 | QA     | 2025-11-17 重试仍失败：Nuxt auto-import mocks 与 `navigateTo` stub 未接入，需完善 mock 策略后恢复 |

## 风险评估与优先级

1. **纯函数缺乏验证导致输入校验风险**：`utils/validate.ts`、`utils/privacy.ts`、`utils/password-validator.ts`、`utils/password.ts`、`utils/navigation.ts` 等均为可复用的纯函数（无 I/O 副作用），一旦出错会在所有入口级联；这些必须成为首批测试目标。
2. **纯函数化的验证码/代码逻辑复杂**：`utils/code.ts`、`utils/smart-input.ts` 等虽然会被外层 Hook 调用，但其内部大部分逻辑与分支仍为纯计算，当前完全未覆盖。
3. **认证与安全链路缺乏验证**：`server/api/auth/[...all].ts` 直接暴露 better-auth handler，缺少黑盒验证；排在纯函数之后，作为紧随其后的高风险环节。
4. **管理后台与 OAuth API 面向第三方集成，环境故障风险高**：`server/api/admin/*`、`server/api/oauth/*` 缺少最小集成验证。
5. **前端交互与组件回归风险**：如 `components/phone-input.vue`、`components/send-code-button.vue` 涉及格式化、倒计时与状态切换，回归成本大；在纯函数和核心 API 稳定后推进。

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

### 阶段 P1（3-4 天）：纯函数优先覆盖

目标：在最短时间内为所有纯函数/确定性计算提供稳定的单测网，立即提升整体语句覆盖率，并为后续有副作用的模块提供可信依赖。

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
-   其他纯函数：`utils/navigation.ts`（外链检测、hash 处理）、`utils/smart-input.ts`（自动补全策略）、`utils/short-text.ts`（截断规则）等，全部纳入同批次测试以保持纯函数覆盖一致性。
-   纯函数化的 server util：`server/utils/random.ts`、`server/utils/locale.ts`、`server/utils/snowflake.ts`，通过统计/固定种子保证 determinism，继续归入此阶段。

### 阶段 P2（4-5 天）：副作用轻量模块与集成准备

-   继续补齐「近似纯函数」或副作用可完全 mock 的模块：
    -   `server/utils/rate-limit.ts`：通过 Stub `limiterStorage` 验证超限抛错；模拟不同 IP、路径组合。
    -   `server/utils/email-template`（若存在多个模板函数）：Mock `mjml` 渲染失败路径。
    -   `utils/code.ts`：利用 `vi.mock` 注入 fake `authClient` 与 `resolveCaptchaToken`，覆盖验证码成功/失败、冷却策略。
-   为后续集成测试搭建可复用夹具：
    -   `tests/fixtures/auth.ts`：基于 better-auth 提供虚拟用户/令牌。
    -   `tests/fixtures/storage.ts`：封装 Redis/Limiter mock，避免真实连接。
-   随后进入集成测试：
    -   `/api/auth/[...all]`：模拟登录（邮箱/手机号）、注册、`authClient` 错误分支。
    -   `/api/oauth/consents.get`、`/api/oauth/revoke-consent.post`、`/api/oauth/[id].get`：覆盖授权列表、撤销、查询失败。
    -   `/api/admin/users/*`、`/api/admin/oauth/applications/*`、`/api/admin/logs/stats.get`、`/sessions.get`：CRUD、分页、错误路径。
    -   `/api/file/upload.post`：验证 MIME、size 限制、鉴权失败。

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

-   **纯函数优先**：所有 utils 层（`validate`/`privacy`/`password`/`navigation`/`smart-input` 等）必须优先交付测试，其中每个函数都需要覆盖主流程与异常路径，作为后续测试的稳定基座。
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
