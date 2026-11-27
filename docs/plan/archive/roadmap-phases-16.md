# 阶段 16 里程碑：平板收尾与 Admin 移动端可访问性（2026-11-28 收口）

> 索引与阶段正文见 [todo-archive-phases-16.md](./todo-archive-phases-16.md)；范围登记见 [2026-11-27-phase16-registration.md](../../design/governance/2026-11-27-phase16-registration.md)，收口记录见 [2026-11-27-phase16-closure.md](../../design/governance/2026-11-27-phase16-closure.md)。

- **目标**：把阶段 15 只在 ≤768 生效的登录 Tab 与右侧安全廊道扩到 ≤1024，补 1024 横向像素保护，给 `/sso-login` 接入暗色主题，并收敛 Admin 移动端导航的可访问性与首帧体验。
- **交付**：
    - 平板：登录方式 Tab 的 3 列与登录 / 注册 / SSO 右侧 4–5rem 安全廊道统一扩到 ≤1024；769 / 800 / 1024 三档 5 语言几何断言（Tab 完整可见、相交面积 0、无横向溢出）。
    - 视觉：1024×768 四页浅色整页基线（login / register / security / admin-users）；admin-users 用 `?userId=` 深链固定夹具行。
    - 暗色：SSO 页接入既有 `$dark-*` token（页面底色、方法卡、提供方卡、普通登录入口、说明文字），390 / 768 暗色基线 + 计算样式断言。
    - Admin：9 个导航链接常驻 `aria-label`，折叠按钮补 `aria-label` / `aria-expanded`；≤768 收起改为 CSS-first（`mobile-expanded` 才展开），SSR 首帧即收起、无跳变；参考态移动端 12 张登记永久漂移并在 parity 层豁免，就绪判定收敛到主内容区。
- **关键决策**：D52 平板 ≤1024；D53 只采 4 张 1024 浅色；D54 SSO 暗色 token 接入；D55 常驻 aria-label；D56 CSS-first 收起；D57 参考态漂移登记；D58 本阶段不做边界。
- **质量门**：见归档正文；视觉 389 用例 / 195 张自基线，单测 1572，覆盖率 Statements 78.87%，入口 CSS +1.46%。
- **未覆盖边界**：真机 iOS Safari / Android 未实测；admin 移动端参考态永久漂移只由自基线保护；`localized-narrow` 768 暗色基线随 SSO 暗色同批更新。
