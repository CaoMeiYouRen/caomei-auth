# 2026-11-25 移动端认证与国际化审计

> **状态**：2026-11-25 审计并登记 backlog；仅为候选与排期依据，不构成阶段启动授权。
> **范围**：生产构建 + 视觉夹具库，Playwright 在 390×844（iPhone UA / DPR3）与 360×640 下覆盖 5 个启用语言与 19 个页面，另抽查 9 个暗色场景；OAuth2 授权码流程用管理端点真实创建应用验证。
> **关联**：[backlog §3.5](../../plan/backlog.md#35-移动端与认证可用性)、[阶段 14 范围登记](./2026-11-24-phase14-registration.md)。

## 1. 结论

核心链路可用：密码登录、未登录跳转、OAuth2 授权码（native + PKCE）、拒绝回调与 state 往返均正常，5 语言带前缀路由无未翻译残留。移动端尚不算完成适配：登录 Tab、SSO 首屏、找回密码验证码行、个人中心操作行存在确定性布局缺陷；验证码关闭的部署会被前端拦截注册 / OTP / 换邮箱。

## 2. 复测现状（2026-11-25 master）

阶段 14 M6（`47e12c6`）已交付移动端会话表卡片布局，本次复测确认：

| 项 | 现状 |
| :--- | :--- |
| 安全设置会话表 | 390 / 360 下 5 语言均为卡片、页面溢出 0、卡片内控件越界 0 |
| 找回密码验证码行 | 390 下 5 语言页面溢出 0；360 下按钮探出行容器 32px，ja-JP 页面溢出 9px |
| 登录页 Tab | 390 下溢出：en-US 19px、zh-TW 74px、ja-JP 125px、ko-KR 63px；zh-CN 0 |
| SSO 标题与语言切换器 | 390 / 360 下 5 语言均重叠（约 2792–3547px²） |
| 个人中心操作行 | en-US 内容 311px / 容器 294px（360 下 264px）；ja-JP 300px；其余语言 0 |
| 悬浮按钮遮挡、验证码可选、OAuth 入口语言、Admin 移动端 | 沿用审计结论，尚未复测 |

## 3. 问题清单

### P1 验证码关闭时注册 / OTP / 换邮箱被前端拦截（条件触发）

- **现象**：未配置 captcha 的部署提交注册稳定提示「请先完成验证码验证」，邮箱注册、邮箱 / 短信验证码登录、更换邮箱全部不可用。
- **证据**：`utils/web/captcha.ts` 无 token 时抛错；`composables/use-register-flow.ts`、`use-login-flow.ts`、`use-otp.ts`、`components/profile/dialogs/edit-email-dialog.vue` 未按 `isCaptchaEnabled()` 传可选参数；`lib/auth.ts` 与 `.env.example` 均把 captcha 定义为可选插件。
- **修复方向**：`resolveCaptchaToken` 按启用状态决定是否必填；补关闭 captcha 的单测与一次端到端注册验证。
- **排期建议**：独立热修（功能回归，符合插队例外），不依赖视觉基线。

### P2 找回密码 / 快速登录验证码行窄屏溢出（原审计 P1）

- **现象**：360 宽下输入框 178px + 按钮 110–135px + 间距超出 264px 行容器，按钮右缘达到 344–369px；ja-JP 触发 9px 页面横向溢出。390 下已收敛到卡片内。
- **定位**：`styles/_form.scss` 的 `.code-row`、`components/base/input-v2.vue` 的 `.code-row :deep(.caomei-input) { flex: 1 }`、`pages/forgot-password.vue`。
- **修复方向**：输入 `flex: 1 1 0; min-width: 0`，按钮 `flex: none`，窄屏允许换行；同组件用于 2FA / 换邮箱，需一并回归。

### P2 登录页第三个 Tab 默认不可见

- **现象**：390 下 en-US / zh-TW / ja-JP / ko-KR 的 Tab 组内容宽 313–419px，容器 294px，手机号登录需要横向滑动才发现。
- **定位**：`pages/login.vue` 的登录方式 Tab（CaomeiButtonGroup）。
- **修复方向**：窄屏改 3 列自适应或换行，保持现有文案与顺序；补 5 语言 390 断言。

### P2 固定悬浮按钮遮挡可交互控件

- **现象**：主题切换按钮遮挡登录页微信 305px²、Google 127px²，注册页协议复选框 327px²、隐私链接 246px²，SSO 页域名登录 224px²；反馈按钮遮挡注册按钮 404px²，360 下遮挡「忘记密码？」95px²。
- **定位**：`layouts/default.vue`、`components/theme-toggle.vue`、`components/feedback-button.vue`。
- **修复方向**：认证页预留底部安全区，或移动端合并为不遮挡内容的底部工具条；补重叠面积断言。

### P2 SSO 页标题与语言切换器重叠

- **现象**：390 / 360 下标题从 y=16 开始，切换器占 12–48px，5 语言均重叠。
- **定位**：`pages/sso-login.vue` 移动端未预留顶部安全区。
- **修复方向**：移动端顶部安全区与标题起点调整；补元素相交断言。

### P2 OAuth 入口固定回落默认语言

- **现象**：`loginPage: '/login'`、`consentPage: '/oauth/consent'` 为静态路径，`detectBrowserLanguage.redirectOn` 只作用于根路径；用户已切换 ja-JP 后从授权入口进入仍渲染 zh-CN。直接访问 `/{locale}/oauth/consent` 正常。
- **定位**：`lib/auth.ts` OAuth 配置与 i18n 重定向策略。
- **修复方向**：评估 `redirectOn: 'no prefix'`，或授权入口按 cookie 补语言前缀；补 5 语言授权入口断言。

### P3 个人中心操作行溢出

- **现象**：390 下 en-US 内容 311px / 容器 294px，ja-JP 300px；360 下同样超出。
- **定位**：个人中心 `.profile-actions` 未换行。
- **修复方向**：允许换行并保留按钮顺序。

### P3 Admin 后台移动端体验

- **现象**：侧边栏默认全展开占首屏约 800px；搜索 / 筛选输入框 14px（iOS 聚焦会放大）；数据表无卡片化兜底。
- **修复方向**：移动端默认收起侧边栏、输入字号 ≥16px；表格保持横向滚动并评估卡片化。

### P3 移动端安全页卡片跨语言基线

- **现象**：阶段 14 M6 只采 zh-CN 元素基线；en-US / ja-JP / ko-KR 标签更长，当前复测无溢出但无像素保护。
- **修复方向**：补 1–2 张跨语言元素基线，或把 390 卡片断言扩到 5 语言。

### P3 OAuth web 客户端 http 回环回调

- **现象**：better-auth 1.7.20 不允许 web 类型客户端使用 http 回环回调，本地联调直接 `invalid_request`；native + PKCE 正常，生产 https 不受影响。
- **修复方向**：文档写明本地联调需用 native + PKCE；评估 `allowInsecureRedirectUri` 的开发环境开关。

## 4. 排期建议

| 选项 | 内容 | 代价 / 依赖 |
| :--- | :--- | :--- |
| A（推荐） | 先热修验证码可选（P1，行为修复，不动布局） | 1 小条目；不改变视觉基线，可在阶段 14 收口前完成 |
| B | 认证移动端可用性作为下一阶段候选：P2 首屏可用性 + P3 体验 + 5 语言窄屏视觉 | 4 大条目 / 10–12 小条目；依赖阶段 14 收口与 M3 窄屏基线 |
| C | 把 P1–P2 全部作为阶段 14 插队扩容 | 需用户授权扩容，阶段 14 容量 +2–4 条；会推迟 M7 收口 |

建议顺序：A → 阶段 14 M3 / M7 收口 → B。M3 的 ja / ko 窄屏基线会直接暴露上述缺陷，先登记可避免重复取证；验证码热修不改布局，不影响 M3 基线。

## 5. 未覆盖边界

- 真实用户数据下的极长用户名 / UA / 邮箱未纳入本次复测。
- Safari / Firefox 的 `min-width` 与 `overflow-wrap` 行为未实测。
- 悬浮按钮遮挡与验证码可选为审计结论，尚未在本次复测环境重建。
- OAuth web + http 回环仅记录现状，未验证 `allowInsecureRedirectUri` 的实际效果。
