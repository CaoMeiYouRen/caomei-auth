---
name: nuxt-code-editor
description: 设计或实现 Vue 3、Nuxt 组件、页面、样式、交互、表单、状态绑定与 i18n 文本时使用。负责前端界面与交互的完整实现流程（目标确认、结构设计、实现约束、视觉验证），并遵循项目标准（PrimeVue、SCSS BEM、@mdi/font、Zod）。用户提到 component、page、UI、frontend、form、responsive、SCSS、BEM、i18n、设计落地时都应触发。

metadata:
  internal: true
---

# Nuxt Code Editor（前端实现专家）

铁律：不要在没有确认信息结构、设计约束和文本国际化策略前直接堆界面代码。

## 工作流

- [ ] Step 1: 确认界面目标 ⚠️ REQUIRED
    - [ ] 1.1 明确是新增页面、组件还是细节修复。
    - [ ] 1.2 盘点数据来源（API 契约）、设计模式、状态来源。
- [ ] Step 2: 结构设计（组件/样式） ⚠️ REQUIRED
    - [ ] 2.1 先确认职责划分：props、事件、状态边界。
    - [ ] 2.2 再拆布局、层级和可访问性结构。
- [ ] Step 3: 实现约束
    - [ ] 3.1 文本默认走 i18n，不硬编码中文或英文。
    - [ ] 3.2 样式优先使用设计 token，不引入重复或不可维护结构。
    - [ ] 3.3 页面级需要 SEO 时，补充头部元信息与静态数据。
- [ ] Step 4: 视觉与交互验证
    - [ ] 4.1 检查响应式、键盘可访问性、明暗模式和错误态。
    - [ ] 4.2 只要涉及视觉改动，交给 `@ui-validator` 做真实环境验证。

## 项目标准（草梅 Auth 特化）

-   **Vue 3 Composition API**: 生成 `<script setup lang="ts">` 组件，使用 `defineProps`、`defineEmits` 并配合 TypeScript 接口/类型。
-   **PrimeVue 4 集成**: 根据 `utils/` 或现有的 `components/` 用法正确使用 PrimeVue 4 组件。
-   **图标库**: 使用 `@mdi/font` (Material Design Icons)，图标类名 `mdi-*`。
-   **类型安全**: 确保所有后端相关代码使用在 `server/entities` 或 `types/` 中定义的 TypeORM 实体和 DTO。
-   **增量编辑**: 优先修补 (patch) 而非重写整个文件，以保留上下文。
-   **样式规范**: SCSS + BEM 命名，优先使用 `styles/` 目录中的变量和 mixin，不使用 `!important` 突破规范。
-   **校验模式**: 表单校验使用 `utils/shared/` 下的 Zod Schema（单一事实来源），前端 `useForm` 传入 `zodSchema`。
-   **数据获取**: SSR 场景优先 `useFetch` / `useAsyncData`，导航使用 `navigateTo`。

## 自检清单

-   结构、状态和视觉职责是否已明确，而不是直接堆代码。
-   文本是否已接入 i18n（`useI18n` / `$t()`），样式是否已接入 token 和可维护性。
-   关键状态（loading、error、empty、success）与响应式是否已覆盖。
-   涉及视觉改动时，是否已计划执行 `@ui-validator` 验证。

## 反模式

-   直接改模板而不先确认数据和状态来源。
-   硬编码文本或颜色值，事后再去补 i18n。
-   只做桌面端，忽略移动端和暗色模式。
-   为了绕过一个样式问题添加 `!important`。
