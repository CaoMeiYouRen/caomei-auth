import { defineConfig, devices } from '@playwright/test'

/**
 * 视觉参考态层（visual reference）独立工程。
 *
 * 职责：把「组件迁移前的渲染原貌」固化为随仓库提交的参考快照，供迁移批次逐路由比对，
 * 避免「迁移后自拍自比」——仓库里的自基线无法自证与迁移前一致。
 *
 * 独立入口：
 * - `pnpm test:visual:parity`    比对当前渲染 ↔ 迁移前参考态
 * - `pnpm test:visual:reference` 采集参考态（`--update-snapshots`，仅允许在迁移前提交上执行）
 *
 * 环境可复现纪律：固定浏览器渠道（chromium）、固定 locale / 时区 / DSF、关闭动画、隐藏光标；
 * 主题由 `tests/visual/helpers/visual.ts` 以 localStorage 显式注入；动态区域统一以
 * `[data-visual-mask]` 遮蔽。
 *
 * 依据见 docs/design/governance/2026-11-08-visual-baseline-harness.md。
 */

const visualHost = '127.0.0.1'
const visualPort = 3100
const visualBaseURL = `http://${visualHost}:${visualPort}`

/**
 * 视觉服务环境：必须与采集时完全一致。
 * - `NODE_ENV=test`：让 TypeORM `synchronize` 在空库上建表，且不写 SQL 日志；
 * - 每次启动前删除临时库，保证空库起步（页面不依赖任何种子数据）；
 * - 显式关闭验证码与 Demo 角标，避免第三方组件与装饰元素进入截图。
 */
const visualServerEnv = {
    NODE_ENV: 'test',
    HOST: visualHost,
    PORT: String(visualPort),
    DATABASE_TYPE: 'sqlite',
    DATABASE_PATH: 'database/.visual/visual.sqlite',
    AUTH_SECRET: 'visual-reference-secret',
    BETTER_AUTH_SECRET: 'visual-reference-secret',
    NUXT_PUBLIC_AUTH_BASE_URL: visualBaseURL,
    NUXT_PUBLIC_SITE_URL: visualBaseURL,
    NUXT_PUBLIC_DEMO_MODE: 'false',
    NUXT_PUBLIC_CAPTCHA_PROVIDER: '',
    NUXT_PUBLIC_USERNAME_ENABLED: 'true',
    NUXT_PUBLIC_PHONE_ENABLED: 'true',
    /* 固定 3 个社交渠道（假凭据）：只为稳定渲染社交按钮区，不发起任何 OAuth 请求。
     * 不配置则社交区整体消失，会漏掉该区的迁移差异；Apple 依赖 bundleId，不纳入。 */
    GITHUB_CLIENT_ID: 'visual-github',
    GITHUB_CLIENT_SECRET: 'visual-github-secret',
    GOOGLE_CLIENT_ID: 'visual-google',
    GOOGLE_CLIENT_SECRET: 'visual-google-secret',
    WECHAT_CLIENT_ID: 'visual-wechat',
    WECHAT_CLIENT_SECRET: 'visual-wechat-secret',
    LOG_LEVEL: 'warn',
    LOGFILES: 'false',
}

export default defineConfig({
    testDir: './tests/visual/parity',
    testMatch: '**/*.visual-parity.spec.ts',
    /* 截图层串行：避免并行渲染导致字体 / 布局抖动 */
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    /* 截图层不重试：不稳定即失败并归因，不用重试掩盖抖动 */
    retries: 0,
    workers: 1,
    timeout: 60000,
    expect: {
        toHaveScreenshot: {
            animations: 'disabled',
            caret: 'hide',
            /* 绝对像素上限保证细粒度改动（圆角 / 间距 / 颜色）可被检出，
             * 不依赖视口比例；不得为让测试变绿而放宽。 */
            maxDiffPixels: 200,
            threshold: 0.2,
            scale: 'css',
        },
    },
    reporter: process.env.CI
        ? [['github'], ['list'], ['blob', { outputDir: 'test-results/visual-parity-blob' }]]
        : [['html', { open: 'never', outputFolder: 'playwright-report/visual-parity' }], ['list']],
    /* 参考态快照随仓库提交；失败产物 -actual / -diff 落于 outputDir，不污染参考态目录 */
    snapshotPathTemplate: 'tests/visual/reference/{testFilePath}/{arg}{ext}',
    outputDir: 'test-results/visual-parity',
    use: {
        ...devices['Desktop Chrome'],
        baseURL: visualBaseURL,
        locale: 'zh-CN',
        timezoneId: 'Asia/Shanghai',
        deviceScaleFactor: 1,
        reducedMotion: 'reduce',
        trace: 'off',
        screenshot: 'off',
        video: 'off',
    },
    webServer: {
        /* 每次启动前重建空库，避免上一轮残留影响渲染 */
        command: 'mkdir -p database/.visual && rm -f database/.visual/visual.sqlite && node .output/server/index.mjs',
        url: visualBaseURL,
        reuseExistingServer: false,
        timeout: 180000,
        env: visualServerEnv,
    },
})
