import { devices } from '@playwright/test'

/**
 * 视觉层共享配置（参考态层与自基线层共用）。
 *
 * 两层必须使用同一服务环境、同一浏览器与同一渲染纪律，否则「参考态 ↔ 当前态」的差异
 * 会混入环境噪声。依据见 docs/design/governance/2026-11-08-visual-baseline-harness.md。
 */

export const visualHost = '127.0.0.1'
export const visualPort = 3100
export const visualBaseURL = `http://${visualHost}:${visualPort}`

/** 视觉层固定时钟锚点：与 `scripts/testing/visual-fixtures.mjs` 的默认值一致。 */
export const visualFixedNow = '2026-06-15T12:00:00+08:00'

/** 视觉层 AUTH_SECRET：同时用于服务端与测试侧会话 cookie 签名。 */
export const visualAuthSecret = 'visual-reference-secret'

/**
 * 视觉服务环境：两层共用，必须与采集时完全一致。
 * - `NODE_ENV=test`：让 TypeORM `synchronize` 在空库上建表，且不写 SQL 日志；
 * - 每次启动前重建临时库、按 `create.sql` 建表并写入确定性夹具；
 * - `VISUAL_HARNESS=1` + `VISUAL_FIXED_NOW`：仅视觉层启用固定时钟（见 `server/plugins/visual-clock.ts`）；
 * - 显式关闭验证码与 Demo 角标；固定 3 个社交渠道（假凭据）只为稳定渲染社交按钮区。
 */
export const visualServerEnv = {
    NODE_ENV: 'test',
    HOST: visualHost,
    PORT: String(visualPort),
    DATABASE_TYPE: 'sqlite',
    DATABASE_PATH: 'database/.visual/visual.sqlite',
    AUTH_SECRET: visualAuthSecret,
    BETTER_AUTH_SECRET: visualAuthSecret,
    /* 固定时钟：Admin 页面的日期 / 相对时间 / 趋势图不随真实时间漂移 */
    VISUAL_HARNESS: '1',
    VISUAL_FIXED_NOW: visualFixedNow,
    NUXT_PUBLIC_AUTH_BASE_URL: visualBaseURL,
    NUXT_PUBLIC_SITE_URL: visualBaseURL,
    NUXT_PUBLIC_DEMO_MODE: 'false',
    NUXT_PUBLIC_CAPTCHA_PROVIDER: '',
    NUXT_PUBLIC_USERNAME_ENABLED: 'true',
    NUXT_PUBLIC_PHONE_ENABLED: 'true',
    GITHUB_CLIENT_ID: 'visual-github',
    GITHUB_CLIENT_SECRET: 'visual-github-secret',
    GOOGLE_CLIENT_ID: 'visual-google',
    GOOGLE_CLIENT_SECRET: 'visual-google-secret',
    WECHAT_CLIENT_ID: 'visual-wechat',
    WECHAT_CLIENT_SECRET: 'visual-wechat-secret',
    LOG_LEVEL: 'warn',
    LOGFILES: 'false',
}

export const visualExpect = {
    toHaveScreenshot: {
        animations: 'disabled' as const,
        caret: 'hide' as const,
        /* 绝对像素上限保证细粒度改动（圆角 / 间距 / 颜色）可被检出，不依赖视口比例；
         * 不得为让测试变绿而放宽。 */
        maxDiffPixels: 200,
        threshold: 0.2,
        scale: 'css' as const,
    },
}

export const visualUse = {
    ...devices['Desktop Chrome'],
    baseURL: visualBaseURL,
    locale: 'zh-CN',
    timezoneId: 'Asia/Shanghai',
    deviceScaleFactor: 1,
    reducedMotion: 'reduce' as const,
    trace: 'off' as const,
    screenshot: 'off' as const,
    video: 'off' as const,
}

export const visualWebServer = {
    /* 重建库、按 create.sql 建表并写入确定性夹具，避免上一轮残留影响渲染 */
    command: 'node scripts/testing/prepare-visual-db.mjs && node .output/server/index.mjs',
    url: visualBaseURL,
    reuseExistingServer: false,
    timeout: 180000,
    env: visualServerEnv,
}
