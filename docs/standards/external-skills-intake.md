# 外部 Skills 准入清单

本清单登记草梅 Auth 项目允许引用的**外部**（非项目内部维护）skills。完整字段与结构化事实源见 [external-skills-registry.json](../../.github/external-skills-registry.json)，本表是面向开发者的摘要视图。治理规则见 [AI 资产治理规范 - 2.2](./ai-governance.md#22-外部同步或平台提供资产)。

| id | 采纳用途 | 来源路径 | 同步地址 | 更新节奏 | 失效处理 | 转内部化门槛 |
| --- | --- | --- | --- | --- | --- | --- |
| `nuxt` | Nuxt 应用结构、server routes、useFetch、middleware、SSR / SSG 混合场景 | `%USERPROFILE%/.copilot/skills/nuxt/SKILL.md` | `%USERPROFILE%/.copilot/skills/nuxt/` | 每月一次，或 Nuxt 主版本显著变化后复核 | 若本地 skill 缺失或描述过时，降级到官方文档与 Context7，不镜像入库 | 同类任务连续 3 次以上依赖且需要项目特化规则时，转为内部 skill |
| `vue` | Vue 3 组件、组合式 API、宏语法、内置组件与响应式模型 | `%USERPROFILE%/.copilot/skills/vue/SKILL.md` | `%USERPROFILE%/.copilot/skills/vue/` | 每月一次，或 Vue 3 最佳实践明显变化后复核 | 若与项目 `<script setup lang="ts">` 规范冲突，以项目规范和官方文档为准 | 需要补充本项目 i18n、BEM、Nuxt 目录约束时，并入内部前端类 skill |
| `vue-best-practices` | Vue 代码风格审校、组合式 API 约束、TypeScript 与 SSR 兼容建议 | `%USERPROFILE%/.copilot/skills/vue-best-practices/SKILL.md` | `%USERPROFILE%/.copilot/skills/vue-best-practices/` | 每两个月一次，或 Vue 官方推荐范式变化后复核 | 若建议与项目既有 Nuxt 约束重复或冲突，仅保留参考 | 需要稳定沉淀为本项目 Vue 编码准则时，并入 `nuxt-code-editor` |
| `vitest` | Vitest 定向运行、mock、coverage、fixture 与 Jest 兼容 API | `%USERPROFILE%/.copilot/skills/vitest/SKILL.md` | `%USERPROFILE%/.copilot/skills/vitest/` | 每月一次，或 Vitest 重大版本变更后复核 | 若与本项目测试预算、目录规范冲突，以测试规范和 `test-engineer` 为准 | 需要反复补充本项目的测试预算与回归模板时，沉淀到内部 `test-engineer` references |
| `vitepress` | VitePress 站点配置、导航 / 侧边栏维护、Markdown 页面生成 | `%USERPROFILE%/.copilot/skills/vitepress/SKILL.md` | `%USERPROFILE%/.copilot/skills/vitepress/` | 每两个月一次，或文档站结构大幅调整后复核 | 若未覆盖本项目 docs 规范或 sidebar 约束，只作为补充参考 | 文档站改造频繁复用且需长期维护项目规则时，转为内部文档治理能力 |
| `pnpm` | pnpm workspace、frozen lockfile、依赖管理与 lockfile 治理 | `%USERPROFILE%/.copilot/skills/pnpm/SKILL.md` | `%USERPROFILE%/.copilot/skills/pnpm/` | 每两个月一次，或 lockfile / workspace 策略调整后复核 | 若建议与本项目既有依赖审计、冻结安装约束不一致，以项目脚本与安全规范为准 | 依赖治理与发版前校验出现稳定复用需求时，沉淀到内部治理能力 |
