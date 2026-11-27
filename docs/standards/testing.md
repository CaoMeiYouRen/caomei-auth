# 测试规范 (Testing Specifications)

本文档定义了项目的测试策略和规范，确保功能的正确性和系统的稳定性。

## 1. 测试框架

-   **运行器**: 统一使用 **Vitest** 作为测试运行和断言框架。
-   **环境**: 端到端测试可能涉及 Playwright。

## 2. 测试分类

-   **单元测试 (Unit Tests)**:
    -   对象: 独立函数、工具类、纯逻辑模块。
    -   位置: `tests/unit/`。
    -   规则: 测试文件名需与被测文件一一对应，并添加 `.spec.ts` 后缀。
-   **集成测试 (Integration Tests)**:
    -   对象: 多个模块的协作、API 路由逻辑、数据库交互。
    -   位置: `tests/integration/`。
-   **E2E 测试 (End-to-End Tests)**:
    -   对象: 用户的关键操作路径（如：登录流程、授权确认、注册流程）。
    -   位置: `tests/e2e/`。

## 3. 测试实践准则

-   **隔离外部依赖**:
    -   测试中严禁发起真实的外部请求（邮件发送、短信、第三方 OAuth 服务）。
    -   必须使用 `vi.mock` 进行模拟。
-   **副作用管理**:
    -   在每个测试用例前 (`beforeEach`) 必须重置 Mock 状态：`vi.clearAllMocks()`。
    -   如果涉及顶层模块残留状态，使用 `vi.resetModules()`。
-   **断言质量**:
    -   断言应具有针对性，避免过度断言。
    -   错误边界必须包含在测试覆盖范围内。

## 4. 自动化与质量指标

-   **Pre-commit**: 在提交代码或合并 PR 之前，应在本地运行 `pnpm test` 确保无回归错误。
-   **覆盖率**: 重要核心逻辑（如 Auth、Database Utils）应维持高覆盖率。
-   **重复代码**: `pnpm lint:duplicate`（jscpd，minLines 5 / minTokens 50，阈值 5%）为 CI 门禁，报告写入 `jscpd-report/`；当前已低于阈值，按非回归口径保持。
-   **模块下限（自 2026-11-17 起）**: `pages` ≥ 40%、`plugins` ≥ 40%；全局作为非回归下限，不低于阶段 6 基线（Statements 76.07% / Lines 76.36%）。Vitest 4 已移除 `coverage.all`，当前未配置 `coverage.include`，百分比只统计测试导入过的文件，不代表 `pages/` 目录全量；新增页面测试若覆盖低于全局均值会拉低全局，需先补足交互再纳入。下限目前由报告与评审核对，自动化校验登记在 backlog。

---

## 5. 测试工作流 (Testing Workflow)

编写测试用例时应遵循以下步骤：

### 5.1 分析目标代码

-   **确定类型**: 业务逻辑推荐单元测试 (`tests/unit/`)，多模块协作推荐集成测试 (`tests/integration/`)。
-   **识别依赖**: 识别外部库 (`fs`, `fetch`, `nodemailer`)、环境依赖 (`process.env`) 及副作用。

### 5.2 创建测试文件

-   **路径规范**: 与源代码路径对应。例如：`server/utils/logger.ts` 对应 `tests/unit/server/logger.spec.ts`。

### 5.3 Mock 最佳实践

-   **外部库**: 使用 `vi.mock("lib-name")`。
-   **环境配置**: 如果模块在顶层读取环境配置，需结合 `vi.resetModules()` 和动态 `import()`。
-   **文件系统**: 模拟 `fs` 时需同时处理 `default` 导出及具名导出以确保兼容性。

### 5.4 验证与重构

-   运行单个测试：`pnpm test <path-to-spec>`。
-   确保测试代码同样通过 `pnpm lint`。

## 5. 视觉回归

-   **门禁**：自基线 `pnpm test:visual`（CI 阻断）；参考态快照自阶段 4 P5 起仅作历史证据，CI 不再执行 parity（本地 `pnpm test:visual:parity` 仍可审计）。
-   **环境**：本地与 CI 共用 Playwright 官方容器（`scripts/testing/run-visual.mjs` 自动调用）；基线只在容器内采集，宿主直跑仅用于调试。
-   **更新纪律**：差异逐项归因后才可 `pnpm test:visual:update`；参考态快照不可原地刷新。
-   **阈值与重采**：`maxDiffPixels` 只统计超过阈值的像素（本仓库 `threshold: 0.2`），阈值内的整片色差不会被计入；受影响 spec 必须用 `pnpm test:visual:update`（`--update-snapshots=all`）重采，跨全站 token / 主题变更才整层重采，中间态快照不得写回基线。定稿时序与 verify 留痕见 [视觉参考态基座](../design/governance/2026-11-08-visual-baseline-harness.md)。
-   **窄屏基线（阶段 14 D44）**：`localized-narrow.visual.spec.ts` 覆盖 ja-JP / ko-KR 的 register、forgot-password、sso-login，390×844 采浅色、768×1024 采暗色，共 12 张整页截图；同时断言 `html lang`、`noindex` 与页面级无横向溢出。每个视口不重复覆盖双主题（CI 预算取舍）；整页口径下固定定位控件（主题切换）按视口锚点绘制，控件移位会在截图中段制造归因噪声，重采前需先确认其位置未变。
-   **长语言窄容器结论（阶段 14 M3.2）**：`localized-narrow-360.visual.spec.ts` 在 360×640 下检查 ja / ko 的 register 与 sso-login，页面无横向溢出、提交按钮不越出卡片；当前无需恢复 `white-space: normal`，长文案由 caomei-ui 按钮文本层的 `min-width: 0` + `nowrap` + ellipsis 承接。若后续组件移除该截断契约，本条用例与基线需同步复核。
-   **移动端矩阵口径（阶段 15）**：`mobile-auth-matrix.visual.spec.ts` 覆盖 5 语言 × 360×640 × login / register / forgot-password / sso-login 共 20 张整页基线；390 档由 `mobile-auth-layout.visual.spec.ts` 的几何断言 + 既有 zh-CN（auth）/ ja / ko（localized-narrow）基线承担，不重复出图。会话卡片跨语言元素基线为 en-US / ja / ko / zh-TW 各 1 张（390 浅色），ja 卡片因标签更长多一行属已接受现状。
-   **平板几何与 1024 横向基线（阶段 16 D52 / D53）**：`mobile-auth-layout.visual.spec.ts` 的断点几何矩阵在 390 / 360 / 768 之外增加 769 / 800 / 1024 三档，只作用于登录 Tab 与悬浮遮挡两组用例（其余移动端几何仍只跑 ≤768）；`tablet-landscape-1024.visual.spec.ts` 采集 login / register / security / admin-users 四张 1024×768 浅色整页基线，不采双主题。admin-users 在套件中靠后执行，库里已有其它用例创建的随机账号，必须用 `?userId=` 深链固定夹具行，否则整表内容随运行漂移。
-   **SSO 暗色基线（阶段 16 D54）**：`sso-dark.visual.spec.ts` 采集 390 / 768 暗色两张；先用计算样式断言页面底色、方法卡 / 普通登录入口背景与说明文字色，token 漏映射时直接报具体色值，不必等像素漂移反查。`/sso-login` 的浅色基线仍由认证矩阵维护（桌面浅色不变）。
-   **Admin 首帧与可访问性（阶段 16 D55–D57）**：侧栏收起改为 CSS-first——≤768 由媒体查询渲染收起外观，`mobile-expanded` 才展开，SSR 首帧即收起；`mobile-auth-layout` 用 `DOMContentLoaded` 取样记录首帧类名并与终态比对，恢复 `onMounted` 收起会直接变红。导航链接常驻 `aria-label`（实际 9 个 `nav-item`），折叠按钮断言 `aria-label` / `aria-expanded`。admin 移动端参考态 12 张（6 路由 × 2 主题）为**永久已知漂移**：参考态采自 P4 迁移前、侧栏当时展开，`admin-matrix` 在 parity 层跳过移动端视口，只由自基线保护；`admin-matrix` 的就绪文案判定收敛到 `.admin-main`，首页 / 错误页 / 我的应用不走 admin 布局时退回整页匹配。
-   **视觉环境限流**：`VISUAL_HARNESS=1` 时跳过 API 频率限制，避免多语言矩阵撞 60 次/分钟导致页面缺数据；仅容器内视觉任务使用。
-   **升级联动**：升级 `@playwright/test` 必须同批重采自基线并说明差异。
-   **时序型用例口径（阶段 18 D64 / D65）**：不得用 `sleep` 等真实等待制造 TTL 过期或等待 emit —— better-auth 的魔法链接与可信设备都以 `verification.expiresAt` 判过期，测试直接把内存库记录改成过去时间即可（`expireVerifications`）；组件断言在 `trigger` 后显式 `await nextTick()` 再读 `emitted`，并断言「多等一个 tick 不产生重复 emit」。调大超时或重试不解决问题，视为未修复。
-   **覆盖率门禁（阶段 18 D66）**：`pnpm coverage:check` 读 `coverage/coverage-final.json`，按目录前缀判定 `pages ≥ 40%` / `plugins ≥ 40%`，并把全局 Statements / Branch / Functions / Lines 与 `scripts/quality/coverage-baseline.json` 比较（容差 0.05，只要求不降低）；报告缺失按未通过处理。基线调整需单独提交并说明原因，CI 在 `test:coverage` 之后执行该门禁。
-   详见 [视觉参考态基座](../design/governance/2026-11-08-visual-baseline-harness.md)。
