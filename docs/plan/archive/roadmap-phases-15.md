# 阶段 15 里程碑：认证移动端可用性（2026-11-27 收口）

> 索引与阶段正文见 [todo-archive-phases-15.md](./todo-archive-phases-15.md)；范围登记见 [2026-11-26-phase15-registration.md](../../design/governance/2026-11-26-phase15-registration.md)，收口记录见 [2026-11-27-phase15-closure.md](../../design/governance/2026-11-27-phase15-closure.md)。

- **目标**：让 5 语言认证首屏在 390 / 360 下可用，消除固定悬浮控件遮挡，收敛个人中心与 Admin 移动端基础体验，补齐 OAuth 入口语言与跨语言卡片基线，并用轻量视觉矩阵锁住回归。
- **交付**：
    - 首屏：登录方式 Tab ≤768 改 3 列自适应并允许断行；验证码行输入收缩、按钮不压缩（覆盖 2FA 自建行）；SSO 标题让出顶部安全区。
    - 遮挡：认证页右侧 4–5rem 安全廊道，内容右缘恒早于固定按钮，任意滚动位置相交为 0；5 语言 × 390 / 360 / 768 首屏几何断言。
    - 个人中心与 Admin：操作行 ≤768 换行；Admin 侧栏移动端默认收起；表单控件 ≤768 字号 16px，表格保持容器内横向滚动。
    - 语言：OAuth 授权入口按 `i18n_locale` 补前缀并保留 query（服务端 302，语言经 registry 归一化）；会话卡片补 en-US / ja / ko / zh-TW 元素基线。
    - 视觉：5 语言 × 360 × 4 页整页矩阵 20 张，390 由几何断言 + 既有 zh-CN / ja / ko 基线承担。
- **关键决策**：D45 登录 Tab 3 列；D46 右侧安全廊道；D47 code-row 收缩；D48 OAuth 入口语言；D49 Admin 基础可用；D50 矩阵 20 张；D51 不做边界。
- **质量门**：见归档正文；入口 CSS +1.46%，视觉 320 用例 / 189 张自基线，单测 1572。
- **未覆盖边界**：769–1024 登录 Tab 与悬浮按钮遮挡（backlog §3.5）；Admin 收起态 aria-label、SSR 首帧展开、参考态 admin 移动端漂移（backlog §3.4）；OAuth 入口首访不读 Accept-Language；真机 iOS Safari 未实测。
