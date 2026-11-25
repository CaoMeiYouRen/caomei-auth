# 阶段 14 里程碑：国际化门禁与前端健壮性（2026-11-26 收口）

> 索引与阶段正文见 [todo-archive-phases-14.md](./todo-archive-phases-14.md)；范围登记见 [2026-11-24-phase14-registration.md](../../design/governance/2026-11-24-phase14-registration.md)，收口记录见 [2026-11-26-phase14-closure.md](../../design/governance/2026-11-26-phase14-closure.md)。

- **目标**：把 i18n 从「5 语可用」推进到「未启用语言也有门禁」，收敛前端错误处理、类型逃逸、样式门禁与两处具体布局缺陷，并修复验证码可选配置的功能回归。
- **交付**：
    - i18n 门禁与产物：未启用语言目录级键 / 占位符同构门禁（支持 `--allow-incomplete` 白名单）、语言包静态 chunk 按启用语言过滤、译文台账消费方、登录页与页脚站内链接 `localePath()`。
    - 视觉回归：ja / ko 的 register / forgot-password / sso-login 补 12 张窄屏基线（390 浅色 / 768 暗色，整页截图），360×640 长语言用例断言无横向溢出；结论：无需恢复 `white-space: normal`。
    - 前端健壮性：改密码 / 登出校验 better-auth `{ error }`；4 条非 Admin 流程失败 Toast 与失败分支单测；`useDataTable` 去默认 `any`、用户列表去断言；stylelint 覆盖 `styles/` 与深层 Vue。
    - 布局：Admin 主区 `min-width: 0`，`/admin/logs` 1440 页面溢出归零、769–1240 筛选行换行；移动端安全页会话表 ≤768 卡片化，暗色边框修正。
    - 插队修复（D43）：验证码未启用时 4 条流程不再被前端拦截，浏览器侧启用判定改用 `useRuntimeConfig().public`，两态浏览器冒烟通过。
- **关键决策**：D33 未启用语言门禁；D34 产物过滤；D35 台账消费方；D36 内部链接范围；D37 视觉矩阵；D38 失败处理；D39 类型与样式门禁；D40 Admin 1440；D41 移动端会话表；D42 本阶段不做；D43 验证码可选插队；D44 窄屏基线 12 张口径。
- **质量门**：`lint` / `lint:css` / `lint:md:check` / `typecheck` / `test`（218 文件 / 1565 用例）/ `test:coverage`（Statements 78.84% / Lines 79.04%）/ `i18n:check` / `ai:check` / `planning:check` / `quality:file-size` / `lint:duplicate`（3.77%）/ `migration:check-imports` / `migration:check-budget`（入口 CSS +1.37%）/ `build` / `docs:build` / `test:visual`（173 用例 / 165 张自基线）/ `security:alerts` 全绿。
- **Review Gate**：M1.1 R1 Reject → R2 Reject → R3 Pass → R4 Reject → R5 Pass；M1.2 R1 Pass → R2 Pass；M2.1 R1 Reject → R2 Pass；M2.2 R1 Reject → R2 Reject → R3 Pass；M3.1 R1 Pass；M3.2 R1 Pass → R2 Pass；M4.1 R1 Pass；M4.2 R1 Pass；M4.3 R1 Pass；M5.1 R1 Reject → R2 Pass；M5.2 R1 Reject → R2 Pass；M6.1 R1 Reject → R2 Pass；M6.2 R1 Reject → R2 Pass；M7.1 R1 Reject → R2 Pass；M7.2 R1 Reject → R2 Pass；M8.1 R1 Reject → R2 Reject → R3 Pass。
- **未覆盖边界**：窄屏完整 24 矩阵未采（D44 只采 12 张）；`/sso-login` 暗色主题缺失（backlog §3.4）；移动端会话卡片仅 zh-CN 元素基线；验证码自定义端点服务端校验与部分配置注册缺口（backlog §3.1）；推送与 CI 由维护者执行。
